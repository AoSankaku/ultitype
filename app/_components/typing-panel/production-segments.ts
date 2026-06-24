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

import { ProductionTextSegment } from "./types";

export function createFallbackSegment(text: string): ProductionTextSegment {
  return {
    text,
    tokenStart: 0,
    tokenEnd: Math.max(0, Array.from(text).length),
  };
}

export function createReadingPunctuationSegments(reading: string): ProductionTextSegment[] {
  const parts = createJapaneseReadingGuideParts(reading);
  const segments: ProductionTextSegment[] = [];
  let text = "";
  let tokenStart: number | null = null;
  let tokenEnd = 0;

  parts.forEach((part) => {
    if (part.kind === "reading") {
      tokenStart ??= part.tokenStart;
      tokenEnd = part.tokenEnd;
    }

    text += part.text;

    if (isProductionSegmentPunctuation(part.text)) {
      segments.push({
        text,
        tokenStart: tokenStart ?? tokenEnd,
        tokenEnd,
      });
      text = "";
      tokenStart = null;
    }
  });

  if (text) {
    segments.push({
      text,
      tokenStart: tokenStart ?? tokenEnd,
      tokenEnd,
    });
  }

  return segments.length > 0 ? segments : [createFallbackSegment(reading)];
}

export function createRomajiPunctuationSegments(
  target: RomajiInputTarget | null,
  guide: string,
): ProductionTextSegment[] {
  if (!target) {
    return splitPlainTextPunctuationSegments(guide);
  }

  const segments: ProductionTextSegment[] = [];
  let text = "";
  let tokenStart: number | null = null;
  let tokenEnd = 0;

  target.parts.forEach((part) => {
    if (part.kind === "input") {
      tokenStart ??= part.tokenIndex;
      tokenEnd = part.tokenIndex + 1;
    }

    text += part.text;

    if (isProductionSegmentPunctuation(part.text)) {
      segments.push({
        text,
        tokenStart: tokenStart ?? tokenEnd,
        tokenEnd,
      });
      text = "";
      tokenStart = null;
    }
  });

  if (text) {
    segments.push({
      text,
      tokenStart: tokenStart ?? tokenEnd,
      tokenEnd,
    });
  }

  return segments.length > 0 ? segments : [createFallbackSegment(guide)];
}

export function splitPlainTextPunctuationSegments(text: string): ProductionTextSegment[] {
  const segments: ProductionTextSegment[] = [];
  let segment = "";
  let tokenStart = 0;
  let tokenEnd = 0;

  Array.from(text).forEach((character) => {
    segment += character;
    tokenEnd += 1;
    if (isProductionSegmentPunctuation(character)) {
      segments.push({ text: segment, tokenStart, tokenEnd });
      segment = "";
      tokenStart = tokenEnd;
    }
  });

  if (segment) {
    segments.push({ text: segment, tokenStart, tokenEnd });
  }

  return segments.length > 0 ? segments : [createFallbackSegment(text)];
}

export function getActiveProductionSegmentIndex(
  segments: ProductionTextSegment[],
  currentTokenIndex: number,
) {
  const activeIndex = segments.findIndex(
    (segment) =>
      segment.tokenStart <= currentTokenIndex && currentTokenIndex < segment.tokenEnd,
  );

  if (activeIndex >= 0) {
    return activeIndex;
  }

  if (segments.length === 0) {
    return 0;
  }

  return currentTokenIndex >= (segments.at(-1)?.tokenEnd ?? 0) ? segments.length - 1 : 0;
}

export function isProductionSegmentPunctuation(text: string) {
  return /[、。,.!?！？]/u.test(text);
}
