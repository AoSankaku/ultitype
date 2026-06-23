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

import { countJapaneseReadingTokens, getDisplayMarkerClassName, normalizeKana, renderDisplayMarkerCharacters, renderFuriganaMarkerCharacters } from "./display-text";
import { SplitRubyPart } from "./types";

export function splitRubyPart(
  kanji: string,
  ruby: string,
  partTokenStart: number
): SplitRubyPart[] {
  const kanjiChars = Array.from(kanji);
  const K = kanjiChars.length;
  if (K === 0) return [];

  const readingParts = createJapaneseReadingGuideParts(ruby);
  const M = readingParts.length;

  if (M === 0) {
    return kanjiChars.map((char) => ({
      kanji: char,
      ruby: "",
      tokenStart: partTokenStart,
      tokenEnd: partTokenStart,
    }));
  }

  const groupedParts: JapaneseReadingGuidePart[][] = Array.from({ length: K }, () => []);
  readingParts.forEach((part, index) => {
    const kanjiIndex = Math.min(K - 1, Math.floor((index * K) / M));
    groupedParts[kanjiIndex]?.push(part);
  });

  return kanjiChars.map((char, j) => {
    const partsForKanji = groupedParts[j] || [];
    const subRuby = partsForKanji.map((p) => p.text).join("");

    let subRubyTokenStart = partTokenStart;
    let subRubyTokenEnd = partTokenStart;

    if (partsForKanji.length > 0) {
      const starts = partsForKanji
        .filter((p) => p.kind === "reading")
        .map((p) => p.tokenStart);
      const ends = partsForKanji
        .filter((p) => p.kind === "reading")
        .map((p) => p.tokenEnd);

      const relStart = starts.length > 0 ? Math.min(...starts) : 0;
      const relEnd = ends.length > 0 ? Math.max(...ends) : 0;

      subRubyTokenStart = partTokenStart + relStart;
      subRubyTokenEnd = partTokenStart + relEnd;
    } else {
      let prevEnd = 0;
      for (let prevIdx = j - 1; prevIdx >= 0; prevIdx--) {
        const prevParts = groupedParts[prevIdx] || [];
        const prevEnds = prevParts.filter((p) => p.kind === "reading").map((p) => p.tokenEnd);
        if (prevEnds.length > 0) {
          prevEnd = Math.max(...prevEnds);
          break;
        }
      }
      subRubyTokenStart = partTokenStart + prevEnd;
      subRubyTokenEnd = partTokenStart + prevEnd;
    }

    return {
      kanji: char,
      ruby: subRuby,
      tokenStart: subRubyTokenStart,
      tokenEnd: subRubyTokenEnd,
    };
  });
}

export function PreviousCenterDisplayText({
  display,
  furigana,
  showFurigana,
  showFuriganaMarker,
  showKanjiMarker,
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  showFurigana: boolean;
  showFuriganaMarker: boolean;
  showKanjiMarker: boolean;
}) {
  if (!display) {
    return null;
  }

  if (furigana.length === 0) {
    return (
      <span className={css(styles, "center-scroll-previous-text")}>
        {showKanjiMarker
          ? renderDisplayMarkerCharacters(
            display,
            0,
            Number.MAX_SAFE_INTEGER,
            Number.MAX_SAFE_INTEGER,
            "previous-display",
          )
          : display}
      </span>
    );
  }

  let tokenStart = 0;

  return (
    <span className={css(styles, "center-scroll-previous-text")}>
      {createJapaneseFuriganaParts(display, furigana).flatMap((part, index) => {
        const partTokenStart = tokenStart;
        const tokenCount = countJapaneseReadingTokens(part.ruby ?? part.text);
        const tokenEnd = tokenStart + tokenCount;
        tokenStart = tokenEnd;

        if (part.ruby) {
          return splitRubyPart(part.text, part.ruby, partTokenStart).map((subRuby, subIndex) => {
            if (showFurigana) {
              const rubyClassName = getDisplayMarkerClassName(
                "display-ruby",
                showKanjiMarker,
                {
                  completedTokens: Number.MAX_SAFE_INTEGER,
                  currentTokenIndex: Number.MAX_SAFE_INTEGER,
                },
                subRuby.tokenStart,
                subRuby.tokenEnd,
              );
              const rubyText = showFuriganaMarker
                ? renderFuriganaMarkerCharacters(
                  subRuby.ruby,
                  subRuby.tokenStart,
                  Number.MAX_SAFE_INTEGER,
                  Number.MAX_SAFE_INTEGER,
                )
                : subRuby.ruby;

              return (
                <ruby className={rubyClassName} key={`previous-display-ruby-${part.text}-${index}-${subIndex}`}>
                  {subRuby.kanji}
                  <rt>{rubyText}</rt>
                </ruby>
              );
            }

            if (showKanjiMarker) {
              return renderDisplayMarkerCharacters(
                subRuby.kanji,
                subRuby.tokenStart,
                Number.MAX_SAFE_INTEGER,
                Number.MAX_SAFE_INTEGER,
                `previous-display-${index}-${subIndex}`,
              );
            }

            return (
              <span className={css(styles, "display-plain")} key={`previous-display-plain-${part.text}-${index}-${subIndex}`}>
                {subRuby.kanji}
              </span>
            );
          });
        }

        if (showKanjiMarker) {
          return renderDisplayMarkerCharacters(
            part.text,
            partTokenStart,
            Number.MAX_SAFE_INTEGER,
            Number.MAX_SAFE_INTEGER,
            `previous-display-${index}`,
          );
        }

        return [
          <span className={css(styles, "display-plain")} key={`previous-display-plain-${part.text}-${index}`}>
            {part.text}
          </span>,
        ];
      })}
    </span>
  );
}

export function renderCenterNextDisplayText(
  display: string,
  furigana: JapaneseFuriganaEntry[],
  showFurigana: boolean,
) {
  if (!display) {
    return "";
  }

  if (!showFurigana || furigana.length === 0) {
    return display;
  }

  return createJapaneseFuriganaParts(display, furigana).flatMap((part, index) =>
    part.ruby ? (
      splitRubyPart(part.text, part.ruby, 0).map((subRuby, subIndex) => (
        <ruby className={css(styles, "display-ruby")} key={`next-display-ruby-${part.text}-${index}-${subIndex}`}>
          {subRuby.kanji}
          <rt>{subRuby.ruby}</rt>
        </ruby>
      ))
    ) : (
      [
        <span className={css(styles, "display-plain")} key={`next-display-plain-${part.text}-${index}`}>
          {part.text}
        </span>,
      ]
    ),
  );
}

export function renderCenterDisplayText(
  display: string,
  furigana: JapaneseFuriganaEntry[],
  currentTokenIndex: number,
  showFurigana: boolean,
  showFuriganaMarker: boolean,
  showKanjiMarker: boolean,
  nextText: ReactNode,
) {
  if (furigana.length === 0) {
    return renderCenterTextWithMarker(
      display,
      currentTokenIndex,
      nextText,
      css(styles, "center-scroll-next-text", showKanjiMarker ? "" : "seamless"),
      css(styles, "center-scroll-current-display"),
    );
  }

  let tokenStart = 0;
  let insertedMarker = false;
  const content: ReactNode[] = [];

  createJapaneseFuriganaParts(display, furigana).forEach((part, index) => {
    const partTokenStart = tokenStart;

    if (part.ruby) {
      const subRubies = splitRubyPart(part.text, part.ruby, partTokenStart);
      const parentTokenEnd = partTokenStart + countJapaneseReadingTokens(part.ruby);
      tokenStart = parentTokenEnd;

      subRubies.forEach((subRuby, subIndex) => {
        const isCurrent = subRuby.tokenStart <= currentTokenIndex && currentTokenIndex < subRuby.tokenEnd;

        if (!insertedMarker && isCurrent) {
          content.push(<CenterScrollCurrentMarker key={`center-display-marker-${index}-${subIndex}`} />);
          insertedMarker = true;
        }

        if (showFurigana) {
          const rubyClassName = getDisplayMarkerClassName(
            "display-ruby",
            showKanjiMarker,
            { completedTokens: currentTokenIndex, currentTokenIndex },
            subRuby.tokenStart,
            subRuby.tokenEnd,
          );
          const rubyText = showFuriganaMarker
            ? renderFuriganaMarkerCharacters(
              subRuby.ruby,
              subRuby.tokenStart,
              currentTokenIndex,
              currentTokenIndex,
            )
            : subRuby.ruby;

          content.push(
            <ruby className={rubyClassName} key={`center-display-ruby-${part.text}-${index}-${subIndex}`}>
              <span className={css(styles, "display-ruby-base", isCurrent && "center-scroll-current-display")}>
                {subRuby.kanji}
              </span>
              <rt>{rubyText}</rt>
            </ruby>,
          );
        } else if (showKanjiMarker) {
          content.push(
            ...renderDisplayMarkerCharacters(
              subRuby.kanji,
              subRuby.tokenStart,
              currentTokenIndex,
              currentTokenIndex,
              `center-display-${index}-${subIndex}`,
            ),
          );
        } else {
          content.push(
            <span
              className={css(styles, "display-plain", isCurrent && "center-scroll-current-display")}
              key={`center-display-plain-${part.text}-${index}-${subIndex}`}
            >
              {subRuby.kanji}
            </span>,
          );
        }
      });
      return;
    }

    const normalizedReading = normalizeKana(part.text);
    const readingGuideParts = createJapaneseReadingGuideParts(normalizedReading);
    const displayChars = Array.from(part.text);
    let displayCharIndex = 0;

    for (const guidePart of readingGuideParts) {
      if (guidePart.kind !== "reading") {
        content.push(
          <span key={`center-display-plain-${index}-v-${displayCharIndex}`} className={css(styles, "display-plain")}>
            {guidePart.text}
          </span>,
        );
        displayCharIndex += Array.from(guidePart.text).length;
        continue;
      }

      const unitTokenEnd = tokenStart + (guidePart.tokenEnd - guidePart.tokenStart);

      if (!insertedMarker && tokenStart <= currentTokenIndex && currentTokenIndex < unitTokenEnd) {
        content.push(<CenterScrollCurrentMarker key={`center-display-marker-${index}`} />);
        insertedMarker = true;
      }

      const unitCharCount = Array.from(guidePart.text).length;
      const unitDisplayChars = displayChars.slice(displayCharIndex, displayCharIndex + unitCharCount).join("");

      if (showKanjiMarker) {
        content.push(
          ...renderDisplayMarkerCharacters(
            unitDisplayChars,
            tokenStart,
            currentTokenIndex,
            currentTokenIndex,
            `center-display-${index}-${displayCharIndex}`,
          ),
        );
      } else {
        content.push(
          <span
            key={`center-display-plain-${index}-${displayCharIndex}`}
            className={css(
              styles,
              "display-plain",
              tokenStart <= currentTokenIndex && currentTokenIndex < unitTokenEnd && "center-scroll-current-display",
            )}
          >
            {unitDisplayChars}
          </span>,
        );
      }

      displayCharIndex += unitCharCount;
      tokenStart = unitTokenEnd;
    }
  });

  if (!insertedMarker) {
    content.push(<CenterScrollCurrentMarker key="center-display-marker" />);
  }

  if (nextText) {
    content.push(
      <span
        className={css(styles, "center-scroll-next-text", showKanjiMarker ? "" : "seamless")}
        key="center-next-text"
      >
        {nextText}
      </span>,
    );
  }

  return content;
}

export function renderCenterTextWithMarker(
  text: string,
  markerPosition: number,
  nextText: ReactNode,
  nextTextClassName = css(styles, "center-scroll-next-text"),
  currentCharacterClassName = "",
) {
  const characters = Array.from(text);
  const markerIndex = Math.min(characters.length, Math.max(0, markerPosition));
  const content: ReactNode[] = [];

  characters.forEach((character, index) => {
    if (index === markerIndex) {
      content.push(<CenterScrollCurrentMarker key="center-marker" />);
    }
    content.push(
      <span className={index === markerIndex ? currentCharacterClassName : undefined} key={`center-character-${index}`}>
        {character}
      </span>,
    );
  });

  if (markerIndex === characters.length) {
    content.push(<CenterScrollCurrentMarker key="center-marker" />);
  }

  if (nextText) {
    content.push(
      <span className={nextTextClassName} key="center-next-text">
        {nextText}
      </span>,
    );
  }

  return content;
}

export function renderCenterInputProgressText(currentText: string, previousText: string) {
  const content: ReactNode[] = [];

  if (previousText) {
    content.push(
      <span className={css(styles, "center-scroll-previous-text")} key="center-progress-previous">
        {previousText}
      </span>,
    );
  }

  const currentCharacters = Array.from(currentText);
  if (currentCharacters.length === 0) {
    content.push(<CenterScrollCurrentMarker key="center-progress-marker" />);
    return content;
  }

  currentCharacters.forEach((character, index) => {
    content.push(
      <span
        className={index === currentCharacters.length - 1 ? css(styles, "center-scroll-current-display") : undefined}
        key={`center-progress-current-${index}`}
      >
        {character}
      </span>,
    );
  });

  return content;
}

export function getReadingMarkerNodeIndex(reading: string, tokenPosition: number) {
  // renderReadingGuideCharacters emits one node per reading-guide part, but a
  // single kana can span multiple romaji tokens, so the token index is not the
  // node-array index. Map the token position to the node that owns it (the same
  // rule the visible current-char highlight uses) so the zero-width marker lines
  // up with the kana actually being typed instead of drifting right.
  const parts = createJapaneseReadingGuideParts(reading);
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    if (part.kind === "reading" && tokenPosition < part.tokenEnd) {
      return index;
    }
  }
  return parts.length;
}

export function insertCenterMarker(nodes: ReactNode, markerPosition: number) {
  const nodeList = Array.isArray(nodes) ? nodes : [nodes];
  const markerIndex = Math.min(nodeList.length, Math.max(0, markerPosition));

  return [
    ...nodeList.slice(0, markerIndex),
    <CenterScrollCurrentMarker key="center-marker" />,
    ...nodeList.slice(markerIndex),
  ];
}

export function CenterScrollCurrentMarker() {
  return <span aria-hidden="true" className={css(styles, "center-scroll-current-marker")} />;
}
