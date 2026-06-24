import {
  ArrowLeft,
  CheckCircle2,
  Crosshair,
  Lock,
  Play,
  RotateCcw,
  Timer,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type {
  ClipboardEvent,
  CompositionEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  PointerEvent,
  ReactNode,
  RefObject,
  CSSProperties,
} from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  formatTimer,
  getRomajiInputProgress,
  scoreImeProductionInput,
  type Metrics,
  type Rank,
  type RomajiInputTarget,
  type TypingMode,
} from "@/src/lib/typing";
import {
  createJapaneseFuriganaParts,
  type JapaneseFuriganaEntry,
  createJapaneseReadingGuideParts,
  type JapaneseReadingGuidePart,
} from "@/src/lib/challenges";
import { css, cx } from "../../_lib/css-module";
import {
  getRandomPostSessionTip,
  getRandomPreSessionTip,
  postSessionTips,
  preSessionTips,
} from "../../_lib/challenge-tips";
import {
  getEnglishFontFamilyCss,
  getJapaneseFontFamilyCss,
  topDisplayMetricOptions,
} from "../../_lib/constants";
import { getVisibleSessionRank } from "../../_lib/session-rank-visibility";
import { type SoundSettings, useTypingSounds } from "../../_lib/typing-sounds";
import type {
  ChallengeLanguage,
  EnSpaceDisplay,
  EnglishFontFamily,
  FinishReason,
  JapaneseFontFamily,
  KeyStabilitySample,
  MistakeFlash,
  NextChallengePreviewMode,
  RankCalculationMode,
  RomajiMarkerMode,
  RuntimeStats,
  StrictMistakeDisplayMode,
  TargetDisplayElementId,
  TopDisplayMetricId,
} from "../../_lib/types";
import styles from "../TypingPanel.module.css";


export type BlockableTextEvent =
  | FormEvent<HTMLTextAreaElement>
  | ClipboardEvent<HTMLTextAreaElement>
  | CompositionEvent<HTMLTextAreaElement>
  | DragEvent<HTMLTextAreaElement>;

export type TypingPanelProps = {
  acceptsTextInput: boolean;
  challengeLanguage: ChallengeLanguage;
  correctionDebt: number;
  currentAccuracy: number;
  currentDisplay: string;
  currentFurigana: JapaneseFuriganaEntry[];
  currentGuide: string;
  currentReading: string;
  currentRomajiTarget: RomajiInputTarget | null;
  currentRank: Rank;
  elapsedSeconds: number | null;
  finishReason: FinishReason | null;
  imeError: string;
  input: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  scoringInput: string;
  isFinished: boolean;
  isProductionBlocked: boolean;
  mistakeFlash: MistakeFlash | null;
  metrics: Metrics;
  mode: TypingMode;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  nextChallengeGuide: string;
  nextChallengePreview: string;
  nextChallengePreviewMode: NextChallengePreviewMode;
  nextChallengeReading: string;
  nextChallengeRomajiTarget: RomajiInputTarget | null;
  previousChallengeDisplay: string;
  previousChallengeFurigana: JapaneseFuriganaEntry[];
  previousChallengeGuide: string;
  previousChallengeReading: string;
  progress: number;
  productionBlockReason: string;
  remainingSeconds: number;
  showFuriganaDisplay: boolean;
  showFuriganaMarker: boolean;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showKanjiDisplay: boolean;
  showKanjiMarker: boolean;
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
  soundSettings: SoundSettings;
  startedAt: number | null;
  stats: RuntimeStats;
  rankCalculationMode: RankCalculationMode;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
  sessionModeIcon?: LucideIcon | null;
  sessionModeLabel?: string;
  prepareActionIcon?: LucideIcon;
  prepareActionTitle?: string;
  autoFocusDirectInput?: boolean;
  isPreview?: boolean;
  topDisplayMetricIds: TopDisplayMetricId[];
  targetDisplayOrder: TargetDisplayElementId[];
  enSpaceDisplay: EnSpaceDisplay;
  onBackToModeSelect: () => void;
  onImeCompositionEnd: (input: string) => void;
  onImeCompositionStart: (input: string) => void;
  onImeInput: (input: string) => void;
  onImeKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onPrepareSession: () => void;
  onPreventDirectTextInput: (event: BlockableTextEvent) => void;
  onResetSession: () => void;
};

export type InputProgress = {
  hiragana: string;
  kanji: string;
};

export type DirectInputFocusRetryInput = {
  acceptsTextInput: boolean;
  autoFocusDirectInput: boolean;
  isDevelopment: boolean;
  isProductionBlocked: boolean;
};

export type ProductionImeInputStickinessInput = {
  key: string | null;
  selectionEnd: number;
  selectionStart: number;
  valueLength: number;
};

export type ProductionImeInputResizeSession = {
  maxWidth: number;
  pointerId: number;
  startWidth: number;
  startX: number;
};

export type CenteredProductionImeInputWidthInput = {
  maxWidth: number;
  pointerDeltaX: number;
  startWidth: number;
};

export type ProductionImePromptScrollMarkerState = {
  display: string;
  input: string;
  inputLength: number;
  marker: number | null;
};

export type StableProductionImePromptScrollMarkerInput = {
  display: string;
  input: string;
  inputLength: number;
  nextMarker: number | null;
  previous: ProductionImePromptScrollMarkerState | null;
};

export type CorrectnessTile = {
  id: string;
  label: string;
  state: "correct" | "wrong" | "correction" | "neutral";
  title: string;
};

export type ProductionLongDisplaySnapshot = {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  scrollContentKey: string;
};

export type ProductionLongDisplayHandoff = {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  id: string;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  previousDisplay: string;
  previousFurigana: JapaneseFuriganaEntry[];
  resetContentKey: string;
  scrollContentKey: string;
};

export type ProductionLongScrollState = {
  contentKey: string;
  scrollLines: number;
};

export type ProductionTextSegment = {
  text: string;
  tokenStart: number;
  tokenEnd: number;
};

export type CenterScrollViewportKind =
  | "display"
  | "kanji-progress"
  | "hiragana-progress"
  | "reading"
  | "input";

export type SplitRubyPart = {
  kanji: string;
  ruby: string;
  tokenStart: number;
  tokenEnd: number;
};

export type RomajiMarkerUnit =
  | {
      kind: "visual";
      text: string;
    }
  | {
      characterStart: number;
      hasVariant: boolean;
      kind: "input";
      text: string;
      tokenStart: number;
      tokenEnd: number;
    };
