import type {
  AppSettings,
  ChallengeLanguage,
  ProductionDuration,
  RuntimeStats,
  StoredState,
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

export const initialStats: RuntimeStats = {
  keystrokes: 0,
  scoredInputLength: 0,
  physicalKeystrokes: 0,
  characterAttempts: 0,
  correctCharacters: 0,
  mistakes: 0,
  mistakeDebt: 0,
  intervals: [],
  keyStabilityHistory: [],
  lastKeyAt: null,
  lastInputAt: null,
  completedPrompts: 0,
};

export const initialSettings: AppSettings = {
  showRomajiWordSpaces: true,
  romajiInputPreset: "hepburn",
  romajiInputSelections: {},
  allowSplitYoon: true,
  sokuonInput: {
    allowSplit: true,
    accepted: ["ltsu", "xtsu", "ltu", "xtu"],
    preferred: "xtu",
  },
  idleRetireSeconds: 0,
  theme: "dark",
  soundVolume: 0.7,
  typingSoundEnabled: true,
  uiSoundEnabled: true,
  speedDisplayUnit: "keysPerSecond",
};

export const initialStoredState: StoredState = {
  bestPracticeScore: 0,
  bestProductionScore: 0,
  sessions: [],
  settings: initialSettings,
};
