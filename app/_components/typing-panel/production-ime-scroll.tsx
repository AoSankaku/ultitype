"use client";

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

import { productionImePromptScrollLeadCharacters } from "./common";
import { ProductionImePromptScrollMarkerState, StableProductionImePromptScrollMarkerInput } from "./types";

export function calculateProductionImePromptScrollMarkerPosition(input: string, target: string) {
  const targetCharacters = Array.from(target);
  if (Array.from(input).length === 0 || targetCharacters.length === 0) {
    return null;
  }

  const score = scoreImeProductionInput(input, target);
  if (!isReliableProductionImePromptScrollScore(score)) {
    return null;
  }

  return Math.min(
    targetCharacters.length - 1,
    score.completedTargetLength + productionImePromptScrollLeadCharacters,
  );
}

export function isReliableProductionImePromptScrollScore(score: {
  completedTargetLength: number;
  inputLength: number;
  mistakes: number;
}) {
  if (score.completedTargetLength === 0 && score.mistakes > 0) {
    return false;
  }

  const maxStableMistakes = Math.max(4, Math.ceil(score.inputLength * 0.45));
  return score.mistakes <= maxStableMistakes;
}

export function stabilizeProductionImePromptScrollMarkerPosition({
  display,
  input,
  inputLength,
  nextMarker,
  previous,
}: StableProductionImePromptScrollMarkerInput): ProductionImePromptScrollMarkerState {
  if (previous === null || previous.display !== display || inputLength === 0) {
    return { display, input, inputLength, marker: nextMarker };
  }

  const isTrailingDeletion = inputLength < previous.inputLength && previous.input.startsWith(input);
  if (isTrailingDeletion) {
    return { display, input, inputLength, marker: nextMarker };
  }

  if (nextMarker === null) {
    return { display, input, inputLength, marker: previous.marker };
  }

  return {
    display,
    input,
    inputLength,
    marker: previous.marker === null ? nextMarker : Math.max(previous.marker, nextMarker),
  };
}

export function useStableProductionImePromptScrollMarkerPosition(input: string, target: string) {
  const markerStateRef = useRef<ProductionImePromptScrollMarkerState | null>(null);
  const inputLength = Array.from(input).length;
  const nextMarker = calculateProductionImePromptScrollMarkerPosition(input, target);
  const stableState = stabilizeProductionImePromptScrollMarkerPosition({
    display: target,
    input,
    inputLength,
    nextMarker,
    previous: markerStateRef.current,
  });
  markerStateRef.current = stableState;
  return stableState.marker;
}
