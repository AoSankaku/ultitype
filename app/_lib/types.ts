import type {
  ModeId,
  RomajiInputPreset,
  SpecialRomajiInputPreset,
  SpecialRomajiVariantId,
  SokuonInputSelection,
  StandardRomajiVariantId,
  RomajiVariantSelection,
} from "@/src/lib/typing";

export type ChallengeLanguage = "ja" | "en";
export type Theme = "dark" | "light";
export type StrictMistakeDisplayMode = "overwrite" | "insert" | "none";
export type RomajiMarkerMode = "character" | "token";
export type JapaneseFontFamily =
  | "noto-sans-jp"
  | "biz-udp-gothic"
  | "m-plus-1"
  | "noto-serif-jp";
export type EnglishFontFamily =
  | "inter"
  | "roboto"
  | "noto-sans"
  | "source-code-pro";
export type NextChallengePreviewMode =
  | "none"
  | "split-slide"
  | "split-alternate"
  | "center-scroll";
export type RankCalculationMode = "projected" | "actual";
export type TopDisplayMetricId =
  | "remainingTime"
  | "remainingPercent"
  | "keysPerSecond"
  | "keysPerMinute"
  | "kanaCharactersPerSecond"
  | "promptCharactersPerSecond"
  | "accuracy"
  | "mistakes"
  | "physicalKeystrokes"
  | "completedPrompts"
  | "mistakeRate"
  | "correctRate";
export type TargetDisplayElementId =
  | "kanji"
  | "kanjiInputProgress"
  | "hiragana"
  | "hiraganaInputProgress"
  | "romaji";
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
  showKanjiInputProgress: boolean;
  showHiraganaInputProgress: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  japaneseFontFamily: JapaneseFontFamily;
  englishFontFamily: EnglishFontFamily;
  kanjiFontSize: number;
  kanjiInputProgressFontSize: number;
  furiganaFontScale: number;
  hiraganaFontSize: number;
  hiraganaInputProgressFontSize: number;
  romajiFontSize: number;
  kanjiLineHeight: number;
  kanjiMarginBottom: number;
  kanjiInputProgressLineHeight: number;
  kanjiInputProgressMarginBottom: number;
  furiganaLineHeight: number;
  furiganaMarginBottom: number;
  hiraganaLineHeight: number;
  hiraganaMarginBottom: number;
  hiraganaInputProgressLineHeight: number;
  hiraganaInputProgressMarginBottom: number;
  romajiLineHeight: number;
  romajiMarginBottom: number;
  productionLongTextLineCount: number;
  romajiInputPreset: RomajiInputPreset;
  romajiInputSelections: Partial<Record<StandardRomajiVariantId, RomajiVariantSelection>>;
  allowSplitYoon: boolean;
  allowSplitSpecialYoon: boolean;
  specialRomajiInputPreset: SpecialRomajiInputPreset;
  specialRomajiInputSelections: Partial<Record<SpecialRomajiVariantId, RomajiVariantSelection>>;
  sokuonInput: SokuonInputSelection;
  idleRetireSeconds: number;
  consecutiveMistypeRetireCount: number;
  accuracyRetireBorderPercent: number;
  theme: Theme;
  soundVolume: number;
  typingSoundEnabled: boolean;
  uiSoundEnabled: boolean;
  rankCalculationMode: RankCalculationMode;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  nextChallengePreviewLength: number;
  nextChallengePreviewMode: NextChallengePreviewMode;
  topDisplayMetricIds: TopDisplayMetricId[];
  targetDisplayOrder: TargetDisplayElementId[];
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
  kanaCharacters: number;
  promptCharacters: number;
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
