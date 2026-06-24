import type {
  AppSettings,
  ChallengeLanguage,
  EnglishFontFamily,
  JapaneseFontFamily,
  ProductionDuration,
  RuntimeStats,
  StoredState,
  TargetDisplayElementId,
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
  { id: "kanaCharactersPerSecond", label: "かな文字/秒" },
  { id: "promptCharactersPerSecond", label: "課題文字/秒" },
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
  "kanaCharactersPerSecond",
  "promptCharactersPerSecond",
  "accuracy",
  "mistakes",
  "physicalKeystrokes",
  "completedPrompts",
] as const satisfies readonly TopDisplayMetricId[];

export const defaultTargetDisplayOrder = [
  "kanji",
  "kanjiInputProgress",
  "hiragana",
  "hiraganaInputProgress",
  "romaji",
] as const satisfies readonly TargetDisplayElementId[];

export const targetDisplayElementOptions = [
  { id: "kanji", label: "漢字" },
  { id: "kanjiInputProgress", label: "入力途中経過（漢字）" },
  { id: "hiragana", label: "ひらがな" },
  { id: "hiraganaInputProgress", label: "入力途中経過（ひらがな）" },
  { id: "romaji", label: "ローマ字" },
] as const satisfies readonly {
  id: TargetDisplayElementId;
  label: string;
}[];

export const japaneseFontFamilyOptions = [
  {
    id: "noto-sans-jp",
    label: "Noto Sans JP",
    cssFamily: '"Noto Sans JP"',
  },
  {
    id: "biz-udp-gothic",
    label: "BIZ UDPGothic",
    cssFamily: '"BIZ UDPGothic"',
  },
  {
    id: "m-plus-1",
    label: "M PLUS 1",
    cssFamily: '"M PLUS 1"',
  },
  {
    id: "noto-serif-jp",
    label: "Noto Serif JP",
    cssFamily: '"Noto Serif JP"',
  },
] as const satisfies readonly {
  id: JapaneseFontFamily;
  label: string;
  cssFamily: string;
}[];

export const englishFontFamilyOptions = [
  {
    id: "inter",
    label: "Inter",
    cssFamily: '"Inter"',
  },
  {
    id: "roboto",
    label: "Roboto",
    cssFamily: '"Roboto"',
  },
  {
    id: "noto-sans",
    label: "Noto Sans",
    cssFamily: '"Noto Sans"',
  },
  {
    id: "source-code-pro",
    label: "Source Code Pro",
    cssFamily: '"Source Code Pro"',
  },
] as const satisfies readonly {
  id: EnglishFontFamily;
  label: string;
  cssFamily: string;
}[];

export function isJapaneseFontFamily(value: unknown): value is JapaneseFontFamily {
  return japaneseFontFamilyOptions.some((option) => option.id === value);
}

export function isEnglishFontFamily(value: unknown): value is EnglishFontFamily {
  return englishFontFamilyOptions.some((option) => option.id === value);
}

export function getJapaneseFontFamilyCss(value: JapaneseFontFamily) {
  return (
    japaneseFontFamilyOptions.find((option) => option.id === value)?.cssFamily ??
    japaneseFontFamilyOptions[0].cssFamily
  );
}

export function getEnglishFontFamilyCss(value: EnglishFontFamily) {
  return (
    englishFontFamilyOptions.find((option) => option.id === value)?.cssFamily ??
    englishFontFamilyOptions[0].cssFamily
  );
}

export const initialStats: RuntimeStats = {
  keystrokes: 0,
  scoredInputLength: 0,
  physicalKeystrokes: 0,
  kanaCharacters: 0,
  promptCharacters: 0,
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
  showKanjiInputProgress: false,
  showHiraganaInputProgress: false,
  showRomajiMarker: true,
  romajiMarkerMode: "character",
  japaneseFontFamily: "noto-sans-jp",
  englishFontFamily: "inter",
  kanjiFontSize: 32,
  kanjiInputProgressFontSize: 24,
  furiganaFontScale: 0.42,
  hiraganaFontSize: 24,
  hiraganaInputProgressFontSize: 20,
  romajiFontSize: 20,
  kanjiLineHeight: 1.45,
  kanjiMarginBottom: 6,
  kanjiInputProgressLineHeight: 1.3,
  kanjiInputProgressMarginBottom: 0,
  furiganaLineHeight: 1.1,
  furiganaMarginBottom: 0,
  hiraganaLineHeight: 1.4,
  hiraganaMarginBottom: 10,
  hiraganaInputProgressLineHeight: 1.3,
  hiraganaInputProgressMarginBottom: 0,
  romajiLineHeight: 1.45,
  romajiMarginBottom: 0,
  productionLongTextLineCount: 5,
  romajiInputPreset: "hepburn",
  romajiInputSelections: {},
  allowSplitYoon: true,
  allowSplitSpecialYoon: false,
  specialRomajiInputPreset: "integrated",
  specialRomajiInputSelections: {},
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
  targetDisplayOrder: [...defaultTargetDisplayOrder],
  enSpaceDisplay: "glyph",
};

export const initialStoredState: StoredState = {
  bestPracticeScore: 0,
  bestProductionScore: 0,
  sessions: [],
  settings: initialSettings,
};
