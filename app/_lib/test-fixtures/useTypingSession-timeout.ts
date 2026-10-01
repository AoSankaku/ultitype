import { mock } from "bun:test";
import type { UseTypingSessionOptions } from "../useTypingSession";

type HookSlot = {
  value?: unknown;
  deps?: readonly unknown[];
  cleanup?: (() => void) | void;
};

const hookSlots: HookSlot[] = [];
let hookIndex = 0;
let pendingEffects: Array<{
  index: number;
  effect: () => void | (() => void);
  previousCleanup?: (() => void) | void;
}> = [];
let stateChanged = false;

function dependenciesChanged(previous: readonly unknown[] | undefined, next: readonly unknown[]) {
  return !previous || previous.length !== next.length || next.some((value, index) => value !== previous[index]);
}

function useState<T>(initialValue: T | (() => T)) {
  const index = hookIndex++;
  const slot = (hookSlots[index] ??= {
    value: typeof initialValue === "function" ? (initialValue as () => T)() : initialValue,
  });

  return [
    slot.value as T,
    (nextValue: T | ((previous: T) => T)) => {
      const previousValue = slot.value as T;
      slot.value = typeof nextValue === "function"
        ? (nextValue as (previous: T) => T)(previousValue)
        : nextValue;
      stateChanged = true;
    },
  ] as const;
}

function useRef<T>(initialValue: T) {
  const index = hookIndex++;
  const slot = (hookSlots[index] ??= { value: { current: initialValue } });
  return slot.value as { current: T };
}

function useMemo<T>(factory: () => T, deps: readonly unknown[] = []) {
  const index = hookIndex++;
  const slot = hookSlots[index] ??= {};
  if (!slot.deps || dependenciesChanged(slot.deps, deps)) {
    slot.value = factory();
    slot.deps = deps;
  }
  return slot.value as T;
}

function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]) {
  const index = hookIndex++;
  const slot = hookSlots[index] ??= {};
  if (!deps || !slot.deps || dependenciesChanged(slot.deps, deps)) {
    pendingEffects.push({ index, effect, previousCleanup: slot.cleanup });
    slot.deps = deps;
  }
}

mock.module("react", () => ({
  useCallback: <T extends (...args: never[]) => unknown>(callback: T, deps: readonly unknown[]) =>
    useMemo(() => callback, deps),
  useEffect,
  useMemo,
  useRef,
  useState,
}));

let clock = 1_000_000;
Date.now = () => clock;

const localStorageValues = new Map<string, string>();
const localStorage = {
  get length() {
    return localStorageValues.size;
  },
  clear: () => localStorageValues.clear(),
  getItem: (key: string) => localStorageValues.get(key) ?? null,
  key: (index: number) => [...localStorageValues.keys()][index] ?? null,
  removeItem: (key: string) => localStorageValues.delete(key),
  setItem: (key: string, value: string) => localStorageValues.set(key, value),
};

const intervalCallbacks = new Map<number, () => void>();
const eventListeners = new Map<string, Set<(event: any) => void>>();
let nextTimerId = 1;
const windowMock = {
  localStorage,
  setInterval: (callback: () => void) => {
    const id = nextTimerId++;
    intervalCallbacks.set(id, callback);
    return id;
  },
  clearInterval: (id: number) => intervalCallbacks.delete(id),
  setTimeout: (callback: () => void) => {
    const id = nextTimerId++;
    return id;
  },
  clearTimeout: (_id: number) => undefined,
  addEventListener: (type: string, listener: (event: any) => void) => {
    const listeners = eventListeners.get(type) ?? new Set();
    listeners.add(listener);
    eventListeners.set(type, listeners);
  },
  removeEventListener: (type: string, listener: (event: any) => void) => {
    eventListeners.get(type)?.delete(listener);
  },
  requestAnimationFrame: (callback: () => void) => callback(),
};

Object.defineProperty(globalThis, "window", { configurable: true, value: windowMock });
Object.defineProperty(globalThis, "document", {
  configurable: true,
  value: { documentElement: { dataset: {} } },
});

const [
  { storageKey, initialStoredState },
  { calculateCurrentImeMetricDeltas, useTypingSession },
] = await Promise.all([
  import("../constants"),
  import("../useTypingSession"),
]);
const scenario = process.argv[2] ?? "plain";
const isCompositionScenario = scenario === "composition-japanese" || scenario === "composition-empty";
const isImeRetireScenario = scenario === "retire-ime";
const isDirectScenario = scenario.startsWith("retire-direct") || scenario === "timeout-race";
const challengeLanguage = scenario === "plain" || isDirectScenario ? "en" : "ja";
const initialModeId = isDirectScenario ? "production-ime-off" : "production-ime-on";
localStorage.setItem(storageKey, JSON.stringify({
  ...initialStoredState,
  bestPracticeScore: 6000,
  settings: {
    ...initialStoredState.settings,
    idleRetireSeconds: scenario === "timeout-race" ? 300 : 0,
  },
}));

const sessionOptions: UseTypingSessionOptions = {
  initialChallengeLanguage: challengeLanguage as "ja" | "en",
  initialModeId,
  initialProductionDuration: 300 as const,
  initialScreen: "typing" as const,
};
if (process.env.ULTITYPE_TEST_STORAGE_FAILURE === "quota") {
  localStorage.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
}

function renderUntilStable(hook: () => unknown) {
  let result: unknown;
  for (let pass = 0; pass < 30; pass += 1) {
    stateChanged = false;
    hookIndex = 0;
    pendingEffects = [];
    result = hook();
    const effects = pendingEffects;
    for (const entry of effects) {
      entry.previousCleanup?.();
      const slot = hookSlots[entry.index]!;
      slot.cleanup = entry.effect();
    }
    if (!stateChanged) {
      return result;
    }
  }
  throw new Error("Mock React hook did not stabilize after 30 renders");
}

const renderSession = () =>
  renderUntilStable(() => useTypingSession(sessionOptions)) as ReturnType<typeof useTypingSession>;
let session = renderSession();
if (process.env.ULTITYPE_TEST_STORAGE_FAILURE === "quota") {
  session.updateSettings({ theme: "light" });
  session = renderSession();
}
const target = session.typingPanelProps.currentDisplay;
const targetCharacters = Array.from(target);
let committedInput: string;
let input: string;
let preFinishScore: number | null = null;
let postReset: Record<string, unknown> | null = null;
let retiredState: Record<string, unknown> | null = null;

function dispatchKey(key: string) {
  const event = {
    key,
    code: "",
    repeat: false,
    shiftKey: key.length === 1 && key.toUpperCase() === key,
    preventDefault: () => undefined,
  };
  for (const listener of eventListeners.get("keydown") ?? []) {
    listener(event);
  }
}

function tickIntervals() {
  for (const callback of [...intervalCallbacks.values()]) {
    callback();
  }
}

function retireWithEscape() {
  for (let count = 0; count < 3; count += 1) {
    if (isDirectScenario) {
      dispatchKey("Escape");
    } else {
      session.typingPanelProps.onImeKeyDown({
        key: "Escape",
        shiftKey: false,
        repeat: false,
        preventDefault: () => undefined,
      } as never);
    }
    session = renderSession();
  }
}

if (scenario === "plain") {
  const wrongCharacter = targetCharacters[10] === "X" ? "Q" : "X";
  committedInput = [...targetCharacters.slice(0, 10), wrongCharacter].join("");
  input = committedInput;
  session.typingPanelProps.onImeInput(input);
  session = renderSession();
} else if (scenario === "composition-empty") {
  committedInput = "";
  input = targetCharacters.slice(0, 3).join("");
  session.typingPanelProps.onImeCompositionStart(committedInput);
  session = renderSession();
  session.typingPanelProps.onImeInput(input);
  session = renderSession();
} else if (scenario === "composition-japanese") {
  if (targetCharacters.length < 21) {
    throw new Error("Japanese production challenge must have at least 21 display characters");
  }
  committedInput = targetCharacters.slice(0, 10).join("");
  const wrongCharacter = targetCharacters[20] === "X" ? "Q" : "X";
  input = [...targetCharacters.slice(0, 20), wrongCharacter].join("");
  session.typingPanelProps.onImeInput(committedInput);
  session = renderSession();
  session.typingPanelProps.onImeCompositionStart(committedInput);
  session = renderSession();
  session.typingPanelProps.onImeInput(input);
  session = renderSession();
} else if (isDirectScenario) {
  const directTarget = session.typingPanelProps.currentGuide;
  if (typeof directTarget !== "string" || directTarget.length === 0) {
    throw new Error("Expected an English direct target for the retirement scenario");
  }
  committedInput = directTarget;
  input = Array.from(directTarget)[0] ?? "";
  dispatchKey(input);
  session = renderSession();

  if (scenario === "retire-direct") {
    clock += 10_000;
    tickIntervals();
    session = renderSession();
  } else if (scenario === "timeout-race") {
    clock += 300_000;
    tickIntervals();
    session = renderSession();
  }

  preFinishScore = session.metrics.score;
  if (scenario !== "timeout-race") {
    retireWithEscape();
    retiredState = {
      finishReason: session.typingPanelProps.finishReason,
      isFinished: session.typingPanelProps.isFinished,
      metrics: session.metrics,
      session: session.sessions[0],
      visibleRank: session.typingPanelProps.currentRank.label,
    };
  }

  if (scenario === "retire-direct-cap-reset") {
    session.typingPanelProps.onResetSession();
    session = renderSession();
    const resetMetrics = session.metrics;
    postReset = {
      isFinished: session.typingPanelProps.isFinished,
      score: resetMetrics.score,
      rank: session.typingPanelProps.currentRank.label,
      sessionCount: session.sessions.length,
    };

    const nextTarget = session.typingPanelProps.currentGuide;
    if (typeof nextTarget !== "string" || nextTarget.length === 0) {
      throw new Error("Expected a direct target after reset");
    }
    dispatchKey(Array.from(nextTarget)[0] ?? "");
    session = renderSession();
    clock += 10_000;
    tickIntervals();
    session = renderSession();
  }
} else if (isImeRetireScenario) {
  committedInput = targetCharacters.slice(0, 10).join("");
  input = committedInput;
  session.typingPanelProps.onImeInput(input);
  session = renderSession();
  clock += 5_000;
  tickIntervals();
  session = renderSession();
  preFinishScore = session.metrics.score;
  retireWithEscape();
  retiredState = {
    finishReason: session.typingPanelProps.finishReason,
    isFinished: session.typingPanelProps.isFinished,
    metrics: session.metrics,
    session: session.sessions[0],
    visibleRank: session.typingPanelProps.currentRank.label,
  };
} else {
  throw new Error(`Unknown lifecycle fixture scenario: ${scenario}`);
}

if (scenario === "plain" || isCompositionScenario) {
  clock += 300_000;
  tickIntervals();
  session = renderSession();
}

const panel = session.typingPanelProps;
let afterNavigation: Record<string, unknown> | null = null;
if (process.env.ULTITYPE_TEST_STORAGE_FAILURE === "quota") {
  hookSlots.length = 0;
  const remounted = renderSession();
  afterNavigation = {
    sessionCount: remounted.sessions.length,
    score: remounted.sessions[0]?.score,
    theme: remounted.settings.theme,
  };
}
const output = {
  afterNavigation,
  committedInput,
  currentAccuracy: panel.currentAccuracy,
  currentRank: panel.currentRank.label,
  expectedDeltas: calculateCurrentImeMetricDeltas({
    challengeLanguage,
    currentDisplay: panel.currentDisplay,
    currentReading: panel.currentReading,
    input: panel.scoringInput,
  }),
  input,
  target,
  preFinishScore,
  stats: session.stats,
  metrics: session.metrics,
  session: session.sessions[0],
  sessions: session.sessions,
  sessionCount: session.sessions.length,
  finishReason: panel.finishReason,
  retiredState,
  postReset,
  visibleRank: panel.currentRank.label,
  scoringInput: panel.scoringInput,
  isFinished: panel.isFinished,
};
process.stdout.write(`${JSON.stringify(output)}\n`);
