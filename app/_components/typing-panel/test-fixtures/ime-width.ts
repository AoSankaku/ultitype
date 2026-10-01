import { mock } from "bun:test";

// Run in a separate process so hook mocks never affect component rendering tests.
const react = await import("react");
const slots: any[] = [];
let cursor = 0;
let changed = false;
let effects: (() => void)[] = [];
mock.module("react", () => ({
  ...react,
  useState(initial: any) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
    return [slots[index], (next: any) => {
      const value = typeof next === "function" ? next(slots[index]) : next;
      if (!Object.is(value, slots[index])) { slots[index] = value; changed = true; }
    }];
  },
  useRef(initial: any) {
    const index = cursor++;
    return slots[index] ??= { current: initial };
  },
  useCallback: (callback: any) => callback,
  useEffect: queueEffect,
  useLayoutEffect: queueEffect,
}));

function queueEffect(effect: () => void, dependencies: unknown[] = []) {
  const index = cursor++;
  const previous = slots[index];
  if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
    slots[index] = dependencies;
    effects.push(effect);
  }
}

const rawWidth = JSON.parse(process.argv[2] ?? "null") as string | null;
const direct = process.argv[3] === "direct";
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: { localStorage: {
    getItem: () => rawWidth,
    setItem: () => undefined,
  } },
});
const [{ TypingPanel }, { initialSettings, initialStats }, { modes, getRank }] = await Promise.all([
  import("../typing-panel"), import("../../../_lib/constants"), import("@/src/lib/typing"),
]);
const props = {
  ...initialSettings,
  acceptsTextInput: !direct,
  challengeLanguage: "en",
  correctionDebt: 0, currentAccuracy: 1,
  currentDisplay: "ABCD", currentFurigana: [], currentGuide: "ABCD", currentReading: "",
  currentRomajiTarget: null, currentRank: getRank(0),
  elapsedSeconds: null, finishReason: null, imeError: "", input: "", scoringInput: "",
  inputRef: { current: null }, isFinished: false, isProductionBlocked: false,
  mistakeFlash: null, metrics: {
    score: 0, accuracy: 1, keysPerSecond: 0, kanaCharactersPerSecond: 0,
    promptCharactersPerSecond: 0, paceMs: 0, consistency: 1,
  },
  mode: modes.find((mode) => mode.id === (direct ? "practice-accuracy" : "production-ime-on"))!,
  nextChallengeDisplay: "", nextChallengeFurigana: [], nextChallengeGuide: "",
  nextChallengePreview: "", nextChallengeReading: "", nextChallengeRomajiTarget: null,
  previousChallengeDisplay: "", previousChallengeFurigana: [], previousChallengeGuide: "",
  previousChallengeReading: "", progress: 0, remainingSeconds: 300,
  productionBlockReason: "", soundSettings: initialSettings, startedAt: null,
  stats: initialStats, strictMistakeInput: "",
  onBackToModeSelect: () => undefined, onImeCompositionEnd: () => undefined,
  onImeCompositionStart: () => undefined, onImeInput: () => undefined,
  onImeKeyDown: () => undefined, onPrepareSession: () => undefined,
  onPreventDirectTextInput: () => undefined, onResetSession: () => undefined,
} as Parameters<typeof TypingPanel>[0];

function render() {
  let tree: any;
  for (let pass = 0; pass < 15; pass++) {
    cursor = 0; changed = false; effects = [];
    tree = TypingPanel(props);
    for (const effect of effects) effect();
    if (!changed) return tree;
  }
  throw new Error("Width restoration did not stabilize");
}

function inputWidth(element: any): number | null | undefined {
  if (!element) return undefined;
  if (element.type?.name === "TypingInputField") return element.props.productionImeInputWidth;
  for (const child of [element.props?.children].flat(Infinity)) {
    const width = inputWidth(child);
    if (width !== undefined) return width;
  }
  return undefined;
}

const mounted = inputWidth(render());
slots.length = 0;
const remounted = inputWidth(render());
process.stdout.write(JSON.stringify({ mounted, remounted }));
