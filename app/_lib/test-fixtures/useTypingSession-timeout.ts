import { mock } from "bun:test";

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
  addEventListener: (_type: string, _listener: (event: unknown) => void) => undefined,
  removeEventListener: (_type: string, _listener: (event: unknown) => void) => undefined,
  requestAnimationFrame: (callback: () => void) => callback(),
};

Object.defineProperty(globalThis, "window", { configurable: true, value: windowMock });
Object.defineProperty(globalThis, "document", {
  configurable: true,
  value: { documentElement: { dataset: {} } },
});

const [{ storageKey, initialStoredState }, { useTypingSession }] = await Promise.all([
  import("../constants"),
  import("../useTypingSession"),
]);
localStorage.setItem(storageKey, JSON.stringify({
  ...initialStoredState,
  bestPracticeScore: 6000,
}));

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

let session = renderUntilStable(() => useTypingSession({
  initialChallengeLanguage: "en",
  initialModeId: "production-ime-on",
  initialProductionDuration: 300,
  initialScreen: "typing",
})) as ReturnType<typeof useTypingSession>;
const typing = session.typingPanelProps;
const targetCharacters = Array.from(typing.currentDisplay);
const wrongCharacter = targetCharacters[10] === "X" ? "Q" : "X";
const input = [...targetCharacters.slice(0, 10), wrongCharacter].join("");
typing.onImeInput(input);

session = renderUntilStable(() => useTypingSession({
  initialChallengeLanguage: "en",
  initialModeId: "production-ime-on",
  initialProductionDuration: 300,
  initialScreen: "typing",
})) as ReturnType<typeof useTypingSession>;

clock += 300_000;
for (const callback of intervalCallbacks.values()) {
  callback();
}
session = renderUntilStable(() => useTypingSession({
  initialChallengeLanguage: "en",
  initialModeId: "production-ime-on",
  initialProductionDuration: 300,
  initialScreen: "typing",
})) as ReturnType<typeof useTypingSession>;

const output = {
  input,
  target: typing.currentDisplay,
  stats: session.stats,
  metrics: session.metrics,
  session: session.sessions[0],
  isFinished: session.typingPanelProps.isFinished,
};
process.stdout.write(`${JSON.stringify(output)}\n`);
