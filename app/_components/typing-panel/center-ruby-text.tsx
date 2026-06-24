"use client";

import {
  createJapaneseFuriganaParts,
  createJapaneseReadingGuideParts,
  type JapaneseFuriganaEntry,
  type JapaneseReadingGuidePart,
} from "@/src/lib/challenges";
import { css } from "../../_lib/css-module";
import styles from "../TypingPanel.module.css";
import {
  countJapaneseReadingTokens,
  getDisplayMarkerClassName,
  renderDisplayMarkerCharacters,
  renderFuriganaMarkerCharacters,
} from "./display-text";
import type { SplitRubyPart } from "./types";

export function splitRubyPart(
  kanji: string,
  ruby: string,
  partTokenStart: number,
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

      subRubyTokenStart = partTokenStart + (starts.length > 0 ? Math.min(...starts) : 0);
      subRubyTokenEnd = partTokenStart + (ends.length > 0 ? Math.max(...ends) : 0);
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
    part.ruby
      ? splitRubyPart(part.text, part.ruby, 0).map((subRuby, subIndex) => (
          <ruby className={css(styles, "display-ruby")} key={`next-display-ruby-${part.text}-${index}-${subIndex}`}>
            {subRuby.kanji}
            <rt>{subRuby.ruby}</rt>
          </ruby>
        ))
      : [
          <span className={css(styles, "display-plain")} key={`next-display-plain-${part.text}-${index}`}>
            {part.text}
          </span>,
        ],
  );
}
