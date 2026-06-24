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

import { splitRubyPart } from "./center-display-text";

export function DisplayText({
  display,
  furigana,
  markerProgress,
  showFurigana,
  showFuriganaMarker,
  showKanjiMarker,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  markerProgress: { completedTokens: number; currentTokenIndex: number } | null;
  showFurigana: boolean;
  showFuriganaMarker: boolean;
  showKanjiMarker: boolean;
}) {
  let tokenStart = 0;

  return (
    <p className={css(styles, "display-text")}>
      {showFurigana && furigana.length > 0 ? (
        createJapaneseFuriganaParts(display, furigana).flatMap((part, index) => {
          const partTokenStart = tokenStart;
          const tokenCount = countJapaneseReadingTokens(part.ruby ?? part.text);
          const tokenEnd = tokenStart + tokenCount;
          tokenStart = tokenEnd;

          if (part.ruby) {
            const subRubies = splitRubyPart(part.text, part.ruby, partTokenStart);
            return subRubies.map((subRuby, subIndex) => {
              if (showFurigana) {
                const rubyClassName = getDisplayMarkerClassName(
                  "display-ruby",
                  showKanjiMarker,
                  markerProgress,
                  subRuby.tokenStart,
                  subRuby.tokenEnd,
                );
                const rubyText =
                  showFuriganaMarker && markerProgress !== null
                    ? renderFuriganaMarkerCharacters(
                      subRuby.ruby,
                      subRuby.tokenStart,
                      markerProgress.completedTokens,
                      markerProgress.currentTokenIndex,
                    )
                    : subRuby.ruby;

                return (
                  <ruby className={rubyClassName} key={`${part.text}-${index}-${subIndex}`}>
                    {subRuby.kanji}
                    <rt>{rubyText}</rt>
                  </ruby>
                );
              }

              if (showKanjiMarker && markerProgress !== null) {
                return renderDisplayMarkerCharacters(
                  subRuby.kanji,
                  subRuby.tokenStart,
                  markerProgress.completedTokens,
                  markerProgress.currentTokenIndex,
                  `display-${index}-${subIndex}`,
                );
              }

              return (
                <span className={css(styles, "display-plain")} key={`${part.text}-${index}-${subIndex}`}>
                  {subRuby.kanji}
                </span>
              );
            });
          }

          if (showKanjiMarker && markerProgress !== null) {
            return renderDisplayMarkerCharacters(
              part.text,
              partTokenStart,
              markerProgress.completedTokens,
              markerProgress.currentTokenIndex,
              `display-${index}`,
            );
          }

          return [
            <span className={css(styles, "display-plain")} key={`${part.text}-${index}`}>
              {part.text}
            </span>,
          ];
        })
      ) : (
        display
      )}
    </p>
  );
}

export function getDisplayMarkerClassName(
  baseClassName: string,
  showMarker: boolean,
  markerProgress: { completedTokens: number; currentTokenIndex: number } | null,
  tokenStart: number,
  tokenEnd: number,
) {
  if (!showMarker || markerProgress === null) {
    return css(styles, baseClassName);
  }

  if (tokenEnd <= markerProgress.completedTokens) {
    return css(styles, baseClassName, "kanji-marker-correct");
  }

  if (tokenStart <= markerProgress.currentTokenIndex && markerProgress.currentTokenIndex < tokenEnd) {
    return css(styles, baseClassName, "kanji-marker-current");
  }

  return css(styles, baseClassName, "kanji-marker-pending");
}

export function renderFuriganaMarkerCharacters(
  ruby: string,
  partTokenStart: number,
  completedTokens: number,
  currentTokenIndex: number,
) {
  return createDisplayMarkerTextParts(ruby).map((part, partIndex) => {
    if (part.kind === "visual") {
      return part.text;
    }

    const className = getTextMarkerStateClassName(
      "furigana-marker",
      partTokenStart + part.tokenStart,
      partTokenStart + part.tokenEnd,
      completedTokens,
      currentTokenIndex,
    );

    return (
      <span
        className={className}
        key={`furigana-${partTokenStart}-${part.tokenStart}-${part.text}-${partIndex}`}
      >
        {part.text}
      </span>
    );
  });
}

export function renderDisplayMarkerCharacters(
  text: string,
  partTokenStart: number,
  completedTokens: number,
  currentTokenIndex: number,
  keyPrefix: string,
) {
  return createDisplayMarkerTextParts(text).map((part, partIndex) => {
    if (part.kind === "visual") {
      return (
        <span className={css(styles, "display-plain")} key={`${keyPrefix}-visual-${partIndex}`}>
          {part.text}
        </span>
      );
    }

    const className = getTextMarkerStateClassName(
      "kanji-marker",
      partTokenStart + part.tokenStart,
      partTokenStart + part.tokenEnd,
      completedTokens,
      currentTokenIndex,
    );

    return (
      <span
        className={cx(css(styles, "display-plain"), className)}
        key={`${keyPrefix}-${part.tokenStart}-${part.text}-${partIndex}`}
      >
        {part.text}
      </span>
    );
  });
}

export function createDisplayMarkerTextParts(text: string) {
  const parts = createJapaneseReadingGuideParts(text);
  const markerParts: typeof parts = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const nextPart = parts[index + 1];

    if (
      part?.kind === "reading" &&
      part.text === "っ" &&
      nextPart?.kind === "reading"
    ) {
      markerParts.push({
        kind: "reading",
        text: `${part.text}${nextPart.text}`,
        tokenStart: part.tokenStart,
        tokenEnd: nextPart.tokenEnd,
      });
      index += 1;
      continue;
    }

    if (part) {
      markerParts.push(part);
    }
  }

  return markerParts;
}

export function getTextMarkerStateClassName(
  baseClassName: "furigana-marker" | "kanji-marker",
  tokenStart: number,
  tokenEnd: number,
  completedTokens: number,
  currentTokenIndex: number,
) {
  if (tokenEnd <= completedTokens) {
    return css(styles, `${baseClassName}-correct`);
  }

  if (tokenStart <= currentTokenIndex && currentTokenIndex < tokenEnd) {
    return css(styles, `${baseClassName}-current`);
  }

  return css(styles, `${baseClassName}-pending`);
}

export function countJapaneseReadingTokens(reading: string) {
  return createJapaneseReadingGuideParts(reading).reduce(
    (tokenCount, part) => (part.kind === "reading" ? Math.max(tokenCount, part.tokenEnd) : tokenCount),
    0,
  );
}

export function normalizeKana(value: string): string {
  return Array.from(value)
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint >= 0x30a1 && codePoint <= 0x30f6
        ? String.fromCodePoint(codePoint - 0x60)
        : character;
    })
    .join("");
}
