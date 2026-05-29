import type {
  ModeId,
  RomajiInputPreset,
  SokuonInputSelection,
  RomajiVariantId,
  RomajiVariantSelection,
} from "@/src/lib/typing";

export type ChallengeLanguage = "ja" | "en";
export type Theme = "dark" | "light";
export type FinishReason = "completed" | "retired";
export type Screen = "mode-select" | "typing";
export type ProductionDuration = 300 | 600;
export type DirectKeyEvent = Pick<
  globalThis.KeyboardEvent,
  "code" | "key" | "preventDefault" | "shiftKey"
>;

export type AppSettings = {
  showRomajiWordSpaces: boolean;
  romajiInputPreset: RomajiInputPreset;
  romajiInputSelections: Partial<Record<RomajiVariantId, RomajiVariantSelection>>;
  allowSplitYoon: boolean;
  sokuonInput: SokuonInputSelection;
  idleRetireSeconds: number;
  theme: Theme;
  soundVolume: number;
  typingSoundEnabled: boolean;
  uiSoundEnabled: boolean;
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

export type RuntimeStats = {
  keystrokes: number;
  scoredInputLength: number;
  physicalKeystrokes: number;
  characterAttempts: number;
  correctCharacters: number;
  mistakes: number;
  mistakeDebt: number;
  intervals: number[];
  lastKeyAt: number | null;
  lastInputAt: number | null;
  completedPrompts: number;
};
