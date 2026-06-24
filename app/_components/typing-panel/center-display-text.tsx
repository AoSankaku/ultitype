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

import { splitRubyPart } from "./center-ruby-text";
import { countJapaneseReadingTokens, getDisplayMarkerClassName, normalizeKana, renderDisplayMarkerCharacters, renderFuriganaMarkerCharacters } from "./display-text";
export { PreviousCenterDisplayText, renderCenterNextDisplayText, splitRubyPart } from "./center-ruby-text";

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
