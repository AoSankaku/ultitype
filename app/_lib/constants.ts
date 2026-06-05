import type {
  AppSettings,
  ChallengeLanguage,
  ProductionDuration,
  RuntimeStats,
  StoredState,
  TopDisplayMetricId,
} from "./types";

export const storageKey = "ultitype:v0";

export const productionDurations = [300, 600] as const satisfies readonly ProductionDuration[];

export const challengeLanguages = [
  { id: "ja", label: "日本語", flagSrc: "/circle-flags/jp.svg" },
  { id: "en", label: "English", flagSrc: "/circle-flags/us.svg" },
] as const satisfies readonly {
  id: ChallengeLanguage;
  label: string;
  flagSrc: string;
}[];

export const ignoredKeys = new Set([
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "Tab",
  "Escape",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

export const topDisplayMetricOptions = [
  { id: "remainingTime", label: "残り時間" },
  { id: "remainingPercent", label: "残り時間（％）" },
  { id: "keysPerSecond", label: "打鍵/秒" },
  { id: "keysPerMinute", label: "打鍵/分" },
  { id: "accuracy", label: "正確率" },
  { id: "mistakes", label: "ミス数" },
  { id: "physicalKeystrokes", label: "物理打鍵" },
  { id: "completedPrompts", label: "完了課題" },
  { id: "mistakeRate", label: "ミス/物理打鍵" },
  { id: "correctRate", label: "正解/物理打鍵" },
] as const satisfies readonly {
  id: TopDisplayMetricId;
  label: string;
}[];

export const defaultTopDisplayMetricIds = [
  "remainingTime",
  "keysPerSecond",
  "accuracy",
  "mistakes",
  "physicalKeystrokes",
  "completedPrompts",
] as const satisfies readonly TopDisplayMetricId[];

export const initialStats: RuntimeStats = {
  keystrokes: 0,
  scoredInputLength: 0,
  physicalKeystrokes: 0,
  characterAttempts: 0,
  correctCharacters: 0,
  mistakes: 0,
  mistakeDebt: 0,
  mistakeInput: "",
  intervals: [],
  keyStabilityHistory: [],
  lastKeyAt: null,
  lastInputAt: null,
  completedPrompts: 0,
};

export const initialSettings: AppSettings = {
  showKanjiDisplay: true,
  showFuriganaDisplay: true,
  showHiraganaDisplay: true,
  showKanjiMarker: false,
  showFuriganaMarker: false,
  showHiraganaMarker: true,
  showRomajiMarker: true,
  kanjiFontSize: 32,
  furiganaFontScale: 0.42,
  hiraganaFontSize: 24,
  romajiFontSize: 20,
  kanjiLineHeight: 1.45,
  kanjiMarginBottom: 6,
  furiganaLineHeight: 1.1,
  furiganaMarginBottom: 0,
  hiraganaLineHeight: 1.4,
  hiraganaMarginBottom: 10,
  romajiLineHeight: 1.45,
  romajiMarginBottom: 0,
  productionLongTextLineCount: 5,
  romajiInputPreset: "hepburn",
  romajiInputSelections: {},
  allowSplitYoon: true,
  allowSplitSpecialYoon: false,
  sokuonInput: {
    allowSplit: true,
    accepted: ["ltsu", "xtsu", "ltu", "xtu"],
    preferred: "xtu",
  },
  idleRetireSeconds: 0,
  consecutiveMistypeRetireCount: 0,
  accuracyRetireBorderPercent: 0,
  theme: "dark",
  soundVolume: 0.7,
  typingSoundEnabled: true,
  uiSoundEnabled: true,
  rankCalculationMode: "projected",
  strictMistakeDisplayMode: "overwrite",
  nextChallengePreviewLength: 8,
  nextChallengePreviewMode: "split-slide",
  topDisplayMetricIds: [...defaultTopDisplayMetricIds],
};

export const initialStoredState: StoredState = {
  bestPracticeScore: 0,
  bestProductionScore: 0,
  sessions: [],
  settings: initialSettings,
};
