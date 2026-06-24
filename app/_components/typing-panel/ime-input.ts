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

import { productionImeInputMinWidth } from "./common";
import { CenteredProductionImeInputWidthInput, DirectInputFocusRetryInput, ProductionImeInputStickinessInput } from "./types";

export function getDirectInputFocusRetryDelays({
  acceptsTextInput,
  autoFocusDirectInput,
  isDevelopment,
  isProductionBlocked,
}: DirectInputFocusRetryInput) {
  if (!isDevelopment || !autoFocusDirectInput || acceptsTextInput || isProductionBlocked) {
    return [];
  }

  return [50, 150, 300, 600];
}

export function clampProductionImeInputWidth(width: number) {
  if (!Number.isFinite(width)) {
    return null;
  }

  return Math.max(productionImeInputMinWidth, Math.round(width));
}

export function calculateCenteredProductionImeInputWidth({
  maxWidth,
  pointerDeltaX,
  startWidth,
}: CenteredProductionImeInputWidthInput) {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
    return productionImeInputMinWidth;
  }

  const clampedMaxWidth = Math.round(maxWidth);
  const minWidth = Math.min(productionImeInputMinWidth, clampedMaxWidth);
  const nextWidth = Math.round(startWidth + pointerDeltaX * 2);

  return Math.min(Math.max(nextWidth, minWidth), clampedMaxWidth);
}

export function shouldStickProductionImeInputToBottom({
  key,
  selectionEnd,
  selectionStart,
  valueLength,
}: ProductionImeInputStickinessInput) {
  if (key === "Backspace" || key?.startsWith("Arrow")) {
    return false;
  }

  return selectionStart === valueLength && selectionEnd === valueLength;
}
