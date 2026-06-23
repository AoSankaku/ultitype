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
import { productionLongScrollTransitionMs } from "./common";
import { countJapaneseReadingTokens, getDisplayMarkerClassName, renderDisplayMarkerCharacters, renderFuriganaMarkerCharacters } from "./display-text";
import { createProductionLongChallengeHandoff, createProductionLongScrollContentKey, useProductionLongBodyScroll } from "./production-long-scroll";
import { ProductionLongDisplayHandoff, ProductionLongDisplaySnapshot } from "./types";

export function ProductionLongDisplay({
  display,
  furigana,
  input,
  nextChallengeDisplay,
  nextChallengeFurigana,
  romajiTarget,
  scrollAnchorLine = 0,
  scrollMarkerCharacterIndex,
  showFurigana,
  showFuriganaMarker,
  showKanjiMarker,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  input: string;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  romajiTarget: RomajiInputTarget | null;
  scrollAnchorLine?: number;
  scrollMarkerCharacterIndex?: number | null;
  showFurigana: boolean;
  showFuriganaMarker: boolean;
  showKanjiMarker: boolean;
}) {
  const previousSnapshotRef = useRef<ProductionLongDisplaySnapshot | null>(null);
  const [activeHandoff, setActiveHandoff] = useState<ProductionLongDisplayHandoff | null>(null);
  const markerProgress = romajiTarget ? getRomajiInputProgress(romajiTarget, input) : null;
  const currentContentKey = createProductionLongScrollContentKey({
    display,
    nextChallengeDisplay,
  });
  const previousSnapshot = previousSnapshotRef.current;
  const nextHandoff =
    previousSnapshot === null
      ? null
      : createProductionLongDisplayHandoff({
          display,
          furigana,
          nextChallengeDisplay,
          nextChallengeFurigana,
          previous: previousSnapshot,
        });
  const visibleHandoff = activeHandoff ?? nextHandoff;
  const scrollContentKey = visibleHandoff?.scrollContentKey ?? currentContentKey;
  const markerKey = `${visibleHandoff?.id ?? "normal"}-${scrollAnchorLine}-${scrollMarkerCharacterIndex ?? "romaji"}-${markerProgress?.currentTokenIndex ?? 0}-${markerProgress?.completedTokens ?? 0}`;
  const { bodyRef, scrollLines } = useProductionLongBodyScroll(
    markerKey,
    scrollAnchorLine,
    scrollContentKey,
  );
  const scrollStyle = {
    "--production-long-scroll-lines": `${scrollLines}`,
  } as CSSProperties;

  useLayoutEffect(() => {
    if (nextHandoff !== null && activeHandoff?.id !== nextHandoff.id) {
      setActiveHandoff(nextHandoff);
    }
  }, [activeHandoff?.id, nextHandoff]);

  useEffect(() => {
    if (activeHandoff === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActiveHandoff((current) => (current?.id === activeHandoff.id ? null : current));
    }, productionLongScrollTransitionMs);

    return () => window.clearTimeout(timeoutId);
  }, [activeHandoff]);

  useLayoutEffect(() => {
    previousSnapshotRef.current = {
      display,
      furigana,
      nextChallengeDisplay,
      nextChallengeFurigana,
      scrollContentKey: currentContentKey,
    };
  }, [currentContentKey, display, furigana, nextChallengeDisplay, nextChallengeFurigana]);

  return (
    <div className={css(styles, "production-long-body")} ref={bodyRef}>
      <div
        className={css(styles, "production-long-scroll-content")}
        key={scrollContentKey}
        style={scrollStyle}
      >
        {visibleHandoff ? (
          <>
            <ProductionLongDisplayText
              display={visibleHandoff.previousDisplay}
              furigana={visibleHandoff.previousFurigana}
              markerProgress={null}
              scrollMarkerCharacterIndex={null}
              scrollMarkerProgress={null}
              showFurigana={showFurigana}
              showFuriganaMarker={false}
              showKanjiMarker={false}
            />
            <div className={css(styles, "production-long-next-spacer")}>
              <ProductionLongDisplayText
                display={display}
                furigana={furigana}
                markerProgress={showKanjiMarker || showFuriganaMarker ? markerProgress : null}
                scrollMarkerCharacterIndex={scrollMarkerCharacterIndex ?? 0}
                scrollMarkerProgress={markerProgress}
                showFurigana={showFurigana}
                showFuriganaMarker={showFuriganaMarker}
                showKanjiMarker={showKanjiMarker}
              />
            </div>
            {nextChallengeDisplay ? (
              <div className={css(styles, "production-long-next-spacer")}>
                <ProductionLongDisplayText
                  display={nextChallengeDisplay}
                  furigana={nextChallengeFurigana}
                  markerProgress={null}
                  scrollMarkerCharacterIndex={null}
                  scrollMarkerProgress={null}
                  showFurigana={showFurigana}
                  showFuriganaMarker={false}
                  showKanjiMarker={false}
                />
              </div>
            ) : null}
          </>
        ) : (
          <>
            <ProductionLongDisplayText
              display={display}
              furigana={furigana}
              markerProgress={showKanjiMarker || showFuriganaMarker ? markerProgress : null}
              scrollMarkerCharacterIndex={scrollMarkerCharacterIndex ?? null}
              scrollMarkerProgress={markerProgress}
              showFurigana={showFurigana}
              showFuriganaMarker={showFuriganaMarker}
              showKanjiMarker={showKanjiMarker}
            />
            {nextChallengeDisplay ? (
              <div className={css(styles, "production-long-next-spacer")}>
                <ProductionLongDisplayText
                  display={nextChallengeDisplay}
                  furigana={nextChallengeFurigana}
                  markerProgress={null}
                  scrollMarkerCharacterIndex={null}
                  scrollMarkerProgress={null}
                  showFurigana={showFurigana}
                  showFuriganaMarker={false}
                  showKanjiMarker={false}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function createProductionLongDisplayHandoff({
  display,
  furigana,
  nextChallengeDisplay,
  nextChallengeFurigana,
  previous,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  previous: ProductionLongDisplaySnapshot;
}): ProductionLongDisplayHandoff | null {
  const handoff = createProductionLongChallengeHandoff({
    display,
    nextChallengeDisplay,
    previousDisplay: previous.display,
    previousNextChallengeDisplay: previous.nextChallengeDisplay,
  });

  if (handoff === null) {
    return null;
  }

  return {
    ...handoff,
    display,
    furigana,
    nextChallengeDisplay,
    nextChallengeFurigana,
    previousDisplay: previous.display,
    previousFurigana: previous.furigana,
  };
}

export function ProductionLongDisplayText({
  display,
  furigana,
  markerProgress,
  scrollMarkerCharacterIndex,
  scrollMarkerProgress,
  showFurigana,
  showFuriganaMarker,
  showKanjiMarker,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  markerProgress: { completedTokens: number; currentTokenIndex: number } | null;
  scrollMarkerCharacterIndex: number | null;
  scrollMarkerProgress: { completedTokens: number; currentTokenIndex: number } | null;
  showFurigana: boolean;
  showFuriganaMarker: boolean;
  showKanjiMarker: boolean;
}) {
  if (furigana.length === 0) {
    if (scrollMarkerCharacterIndex !== null) {
      return (
        <p className={css(styles, "display-text production-long-display-text")}>
          {renderProductionLongPlainScrollTarget(display, scrollMarkerCharacterIndex)}
        </p>
      );
    }

    return <p className={css(styles, "display-text production-long-display-text")}>{display}</p>;
  }

  let characterStart = 0;
  let tokenStart = 0;
  const displayParts = createJapaneseFuriganaParts(display, furigana);
  const totalTokenCount = displayParts.reduce(
    (total, part) => total + countJapaneseReadingTokens(part.ruby ?? part.text),
    0,
  );

  return (
    <p className={css(styles, "display-text production-long-display-text")}>
      {displayParts.map((part, index) => {
        const partCharacterStart = characterStart;
        const partCharacterEnd = partCharacterStart + Array.from(part.text).length;
        const partTokenStart = tokenStart;
        const tokenCount = countJapaneseReadingTokens(part.ruby ?? part.text);
        const tokenEnd = tokenStart + tokenCount;
        characterStart = partCharacterEnd;
        tokenStart = tokenEnd;

        if (part.ruby) {
          const subRubies = splitRubyPart(part.text, part.ruby, partTokenStart);
          let subRubyCharacterStart = partCharacterStart;

          return subRubies.map((subRuby, subIndex) => {
            const subRubyCharacterEnd =
              subRubyCharacterStart + Array.from(subRuby.kanji).length;
            const isScrollTarget =
              shouldPlaceProductionLongScrollTarget(
                scrollMarkerProgress,
                subRuby.tokenStart,
                subRuby.tokenEnd,
                subRuby.tokenEnd >= totalTokenCount,
              ) ||
              shouldPlaceProductionLongScrollCharacterTarget(
                scrollMarkerCharacterIndex,
                subRubyCharacterStart,
                subRubyCharacterEnd,
              );
            subRubyCharacterStart = subRubyCharacterEnd;

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
                <span
                  className={isScrollTarget ? css(styles, "production-long-scroll-target") : undefined}
                  key={`production-display-ruby-wrapper-${part.text}-${index}-${subIndex}`}
                >
                  <ruby className={rubyClassName}>
                    {subRuby.kanji}
                    <rt>{rubyText}</rt>
                  </ruby>
                </span>
              );
            }

            if (showKanjiMarker && markerProgress !== null) {
              return (
                <span
                  className={isScrollTarget ? css(styles, "production-long-scroll-target") : undefined}
                  key={`production-display-marker-wrapper-${part.text}-${index}-${subIndex}`}
                >
                  {renderDisplayMarkerCharacters(
                    subRuby.kanji,
                    subRuby.tokenStart,
                    markerProgress.completedTokens,
                    markerProgress.currentTokenIndex,
                    `production-display-${index}-${subIndex}`,
                  )}
                </span>
              );
            }

            return (
              <span
                className={css(styles, "display-plain", isScrollTarget ? "production-long-scroll-target" : "")}
                key={`production-display-plain-${part.text}-${index}-${subIndex}`}
              >
                {subRuby.kanji}
              </span>
            );
          });
        }

        const isScrollTarget =
          shouldPlaceProductionLongScrollTarget(
            scrollMarkerProgress,
            partTokenStart,
            tokenEnd,
            tokenEnd >= totalTokenCount,
          ) ||
          shouldPlaceProductionLongScrollCharacterTarget(
            scrollMarkerCharacterIndex,
            partCharacterStart,
            partCharacterEnd,
          );

        if (showKanjiMarker && markerProgress !== null) {
          return (
            <span
              className={isScrollTarget ? css(styles, "production-long-scroll-target") : undefined}
              key={`production-display-marker-wrapper-${part.text}-${index}`}
            >
              {renderDisplayMarkerCharacters(
                part.text,
                partTokenStart,
                markerProgress.completedTokens,
                markerProgress.currentTokenIndex,
                `production-display-${index}`,
              )}
            </span>
          );
        }

        return (
          <span
            className={css(styles, "display-plain", isScrollTarget ? "production-long-scroll-target" : "")}
            key={`production-display-plain-${part.text}-${index}`}
          >
            {part.text}
          </span>
        );
      })}
    </p>
  );
}

export function renderProductionLongPlainScrollTarget(display: string, scrollMarkerCharacterIndex: number) {
  const characters = Array.from(display);
  const clampedIndex = Math.min(Math.max(scrollMarkerCharacterIndex, 0), characters.length - 1);
  const before = characters.slice(0, clampedIndex).join("");
  const marker = characters[clampedIndex];
  const after = characters.slice(clampedIndex + 1).join("");

  return (
    <>
      {before}
      <span className={css(styles, "production-long-scroll-target")}>{marker}</span>
      {after}
    </>
  );
}

export function shouldPlaceProductionLongScrollTarget(
  markerProgress: { completedTokens: number; currentTokenIndex: number } | null,
  tokenStart: number,
  tokenEnd: number,
  isFinalTokenRange = false,
) {
  return (
    markerProgress !== null &&
    ((tokenStart <= markerProgress.currentTokenIndex &&
      markerProgress.currentTokenIndex < tokenEnd) ||
      (isFinalTokenRange && markerProgress.currentTokenIndex >= tokenEnd))
  );
}

export function shouldPlaceProductionLongScrollCharacterTarget(
  markerCharacterIndex: number | null,
  characterStart: number,
  characterEnd: number,
) {
  return (
    markerCharacterIndex !== null &&
    characterStart <= markerCharacterIndex &&
    markerCharacterIndex < characterEnd
  );
}
