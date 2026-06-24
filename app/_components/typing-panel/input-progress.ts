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

import { countJapaneseReadingTokens, normalizeKana } from "./display-text";
import { InputProgress } from "./types";

export function createInputProgress({
  acceptsTextInput,
  display,
  furigana,
  input,
  reading,
  romajiTarget,
}: {
  acceptsTextInput: boolean;
  display: string;
  furigana: JapaneseFuriganaEntry[];
  input: string;
  reading: string;
  romajiTarget: RomajiInputTarget | null;
}) {
  if (!input) {
    return { hiragana: "", kanji: "" };
  }

  if (acceptsTextInput) {
    const displayPrefixLength = getSharedPrefixLength(display, input);
    const kanji = displayPrefixLength > 0 ? display.slice(0, displayPrefixLength) : input;
    const hiragana =
      displayPrefixLength > 0
        ? getReadingForDisplayPrefix(display, furigana, displayPrefixLength)
        : normalizeKana(input);

    return { hiragana, kanji };
  }

  if (!romajiTarget) {
    return { hiragana: "", kanji: "" };
  }

  const progress = getRomajiInputProgress(romajiTarget, input);
  const completedTokens = progress.completedTokens;
  const hiraganaProgress = sliceReadingByTokensWithBoundary(reading, completedTokens);
  const pendingRomaji = getPendingRomajiInput(progress, hiraganaProgress.convertedTokenCount);

  return {
    hiragana: `${hiraganaProgress.text}${pendingRomaji}`,
    kanji: `${sliceDisplayByReadingTokens(display, furigana, hiraganaProgress.convertedTokenCount)}${pendingRomaji}`,
  };
}

export function createCompletedInputProgress({
  display,
  reading,
}: {
  display: string;
  reading: string;
}): InputProgress {
  return {
    hiragana: reading,
    kanji: display,
  };
}

export function getPendingRomajiInput(
  progress: ReturnType<typeof getRomajiInputProgress>,
  convertedTokenCount: number,
) {
  if (!progress.accepted) {
    return "";
  }

  let pendingInput = "";

  for (
    let tokenIndex = convertedTokenCount;
    tokenIndex < progress.completedTokens;
    tokenIndex += 1
  ) {
    pendingInput += progress.selectedOptions[tokenIndex] ?? "";
  }

  if (progress.currentOption && convertedTokenCount <= progress.currentTokenIndex) {
    pendingInput += progress.currentOption.slice(0, progress.currentOptionOffset);
  }

  return pendingInput;
}

export function getSharedPrefixLength(target: string, value: string) {
  const targetCharacters = Array.from(target);
  const valueCharacters = Array.from(value);
  let index = 0;

  while (index < targetCharacters.length && targetCharacters[index] === valueCharacters[index]) {
    index += 1;
  }

  return index;
}

export function getReadingForDisplayPrefix(
  display: string,
  furigana: JapaneseFuriganaEntry[],
  prefixLength: number,
) {
  const prefix = Array.from(display).slice(0, prefixLength).join("");
  return createJapaneseFuriganaParts(prefix, furigana)
    .map((part) => normalizeKana(part.ruby ?? part.text))
    .join("");
}

export function sliceReadingByTokens(reading: string, tokenCount: number) {
  return sliceReadingByTokensWithBoundary(reading, tokenCount).text;
}

export function sliceReadingByTokensWithBoundary(reading: string, tokenCount: number) {
  const parts = createJapaneseReadingGuideParts(reading);
  let output = "";
  let convertedTokenCount = 0;

  for (const part of parts) {
    if (part.kind === "visual") {
      if (output) {
        output += part.text;
      }
      continue;
    }

    if (part.tokenEnd <= tokenCount) {
      output += part.text;
      convertedTokenCount = part.tokenEnd;
    }
  }

  return { text: output.trimEnd(), convertedTokenCount };
}

export function sliceDisplayByReadingTokens(
  display: string,
  furigana: JapaneseFuriganaEntry[],
  tokenCount: number,
) {
  let output = "";
  let tokenStart = 0;

  for (const part of createJapaneseFuriganaParts(display, furigana)) {
    const tokenEnd = tokenStart + countJapaneseReadingTokens(part.ruby ?? part.text);

    if (tokenEnd <= tokenCount) {
      output += part.text;
      tokenStart = tokenEnd;
      continue;
    }

    if (tokenStart < tokenCount) {
      output += normalizeKana(sliceReadingByTokens(part.ruby ?? part.text, tokenCount - tokenStart));
    }

    break;
  }

  return output;
}
