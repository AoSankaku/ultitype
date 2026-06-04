import type {
  ModeId,
  RomajiInputPreset,
  SokuonInputSelection,
  RomajiVariantId,
  RomajiVariantSelection,
} from "@/src/lib/typing";

export type ChallengeLanguage = "ja" | "en";
export type Theme = "dark" | "light";
export type StrictMistakeDisplayMode = "overwrite" | "insert" | "none";
export type NextChallengePreviewMode =
  | "none"
  | "split-slide"
  | "split-alternate"
  | "center-scroll";
export type TopDisplayMetricId =
  | "remainingTime"
  | "remainingPercent"
  | "keysPerSecond"
  | "keysPerMinute"
  | "accuracy"
  | "mistakes"
  | "physicalKeystrokes"
  | "completedPrompts"
  | "mistakeRate"
  | "correctRate";
export type FinishReason = "completed" | "retired";
export type Screen = "mode-select" | "typing";
export type ProductionDuration = 300 | 600;
export type MistakeFlash = {
  id: number;
  input: string;
};
export type DirectKeyEvent = Pick<
  globalThis.KeyboardEvent,
  "code" | "key" | "preventDefault" | "shiftKey"
>;

export type AppSettings = {
  showKanjiDisplay: boolean;
  showFuriganaDisplay: boolean;
  showHiraganaDisplay: boolean;
  showKanjiMarker: boolean;
  showFuriganaMarker: boolean;
  showHiraganaMarker: boolean;
  showRomajiMarker: boolean;
  kanjiFontSize: number;
  furiganaFontScale: number;
  hiraganaFontSize: number;
  romajiFontSize: number;
  kanjiLineHeight: number;
  kanjiMarginBottom: number;
  furiganaLineHeight: number;
  furiganaMarginBottom: number;
  hiraganaLineHeight: number;
  hiraganaMarginBottom: number;
  romajiLineHeight: number;
  romajiMarginBottom: number;
  romajiInputPreset: RomajiInputPreset;
  romajiInputSelections: Partial<Record<RomajiVariantId, RomajiVariantSelection>>;
  allowSplitYoon: boolean;
  allowSplitSpecialYoon: boolean;
  sokuonInput: SokuonInputSelection;
  idleRetireSeconds: number;
  consecutiveMistypeRetireCount: number;
  accuracyRetireBorderPercent: number;
  theme: Theme;
  soundVolume: number;
  typingSoundEnabled: boolean;
  uiSoundEnabled: boolean;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  nextChallengePreviewLength: number;
  nextChallengePreviewMode: NextChallengePreviewMode;
  topDisplayMetricIds: TopDisplayMetricId[];
};

export type StoredSession = {
  modeId: ModeId;
  challengeLanguage?: ChallengeLanguage;
  score: number;
  rank: string;
  accuracy: number;
  keysPerSecond: number;
  createdAt: string;
};

export type StoredState = {
  bestPracticeScore: number;
  bestProductionScore: number;
  sessions: StoredSession[];
  settings: AppSettings;
};

export type KeyStabilitySample = {
  id: number;
  key: string;
  intervalMs: number | null;
  isCorrect: boolean;
  kind: "input" | "correction";
  promptIndex: number;
  at: number;
};

export type RuntimeStats = {
  keystrokes: number;
  scoredInputLength: number;
  physicalKeystrokes: number;
  characterAttempts: number;
  correctCharacters: number;
  mistakes: number;
  mistakeDebt: number;
  mistakeInput: string;
  intervals: number[];
  keyStabilityHistory: KeyStabilitySample[];
  lastKeyAt: number | null;
  lastInputAt: number | null;
  completedPrompts: number;
};
