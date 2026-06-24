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
  EnSpaceDisplay,
} from "../../_lib/types";
import styles from "../TypingPanel.module.css";

import { getOverwriteMistakeCharacter, getVisibleSpaceCharacter, getVisibleStrictMistakeCharacters, renderRomajiGuideTokenUnits, renderStrictMistakeCharacters } from "./guide-characters";
import { createFallbackSegment, createReadingPunctuationSegments, createRomajiPunctuationSegments, getActiveProductionSegmentIndex } from "./production-segments";
import { ProductionTextSegment } from "./types";

export function ProductionSegmentedInputStack({
  guide,
  input,
  mistakeFlash,
  nextChallengeGuide,
  nextChallengeReading,
  nextChallengeRomajiTarget,
  previewMode,
  reading,
  romajiTarget,
  showHiraganaDisplay,
  showHiraganaMarker,
  showRomajiMarker,
  romajiMarkerMode,
  strictMistakeDisplayMode,
  strictMistakeInput,
  enSpaceDisplay,
}: {
  guide: string;
  input: string;
  mistakeFlash: MistakeFlash | null;
  nextChallengeGuide: string;
  nextChallengeReading: string;
  nextChallengeRomajiTarget: RomajiInputTarget | null;
  previewMode: NextChallengePreviewMode;
  reading: string;
  romajiTarget: RomajiInputTarget | null;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
  enSpaceDisplay: EnSpaceDisplay;
}) {
  const readingSegments = createReadingPunctuationSegments(reading);
  const guideSegments = createRomajiPunctuationSegments(romajiTarget, guide);
  const currentTokenIndex = romajiTarget
    ? getRomajiInputProgress(romajiTarget, input).currentTokenIndex
    : Array.from(input).length;
  const activeIndex = getActiveProductionSegmentIndex(guideSegments, currentTokenIndex);
  const nextReadingSegments = createReadingPunctuationSegments(nextChallengeReading);
  const nextGuideSegments = createRomajiPunctuationSegments(nextChallengeRomajiTarget, nextChallengeGuide);
  const currentSegment = {
    reading: readingSegments[activeIndex] ?? createFallbackSegment(reading),
    guide: guideSegments[activeIndex] ?? createFallbackSegment(guide),
  };
  const nextSegment = {
    reading:
      readingSegments[activeIndex + 1] ??
      nextReadingSegments[0] ??
      createFallbackSegment(nextChallengeReading),
    guide:
      guideSegments[activeIndex + 1] ??
      nextGuideSegments[0] ??
      createFallbackSegment(nextChallengeGuide),
  };
  const currentLane = previewMode === "split-alternate" && activeIndex % 2 === 1 ? "bottom" : "top";
  const nextLane = currentLane === "top" ? "bottom" : "top";
  const currentContent = (
    <ProductionSegmentLaneContent
      guideSegment={currentSegment.guide}
      input={input}
      isCurrent
      mistakeFlash={mistakeFlash}
      reading={reading}
      readingSegment={currentSegment.reading}
      romajiTarget={romajiTarget}
      showHiraganaDisplay={showHiraganaDisplay}
      showHiraganaMarker={showHiraganaMarker}
      showRomajiMarker={showRomajiMarker}
      romajiMarkerMode={romajiMarkerMode}
      strictMistakeDisplayMode={strictMistakeDisplayMode}
      strictMistakeInput={strictMistakeInput}
      enSpaceDisplay={enSpaceDisplay}
    />
  );
  const nextContent = (
    <ProductionSegmentLaneContent
      guideSegment={nextSegment.guide}
      input=""
      isCurrent={false}
      mistakeFlash={null}
      reading={
        readingSegments[activeIndex + 1] ? reading : nextChallengeReading
      }
      readingSegment={nextSegment.reading}
      romajiTarget={guideSegments[activeIndex + 1] ? romajiTarget : nextChallengeRomajiTarget}
      showHiraganaDisplay={showHiraganaDisplay}
      showHiraganaMarker={false}
      showRomajiMarker={false}
      romajiMarkerMode={romajiMarkerMode}
      strictMistakeDisplayMode="none"
      strictMistakeInput=""
      enSpaceDisplay={enSpaceDisplay}
    />
  );

  if (previewMode === "none") {
    return (
      <div className={css(styles, "production-segmented-stack")}>
        <div className={css(styles, "challenge-preview-lane current-lane top-lane active-lane")}>
          {currentContent}
        </div>
      </div>
    );
  }

  const currentLaneContent = (
    <div className={css(styles, "challenge-preview-lane current-lane", `${currentLane}-lane`, "active-lane")}>
      {currentContent}
    </div>
  );
  const nextLaneContent = (
    <div className={css(styles, "challenge-preview-lane next-lane", `${nextLane}-lane`)}>
      {nextContent}
    </div>
  );

  return (
    <div className={css(styles, "production-segmented-stack", previewMode)}>
      {currentLane === "top" ? currentLaneContent : nextLaneContent}
      <div className={css(styles, "challenge-preview-separator")} aria-hidden="true" />
      {currentLane === "top" ? nextLaneContent : currentLaneContent}
    </div>
  );
}

export function ProductionSegmentLaneContent({
  guideSegment,
  input,
  isCurrent,
  mistakeFlash,
  reading,
  readingSegment,
  romajiTarget,
  showHiraganaDisplay,
  showHiraganaMarker,
  showRomajiMarker,
  romajiMarkerMode,
  strictMistakeDisplayMode,
  strictMistakeInput,
  enSpaceDisplay,
}: {
  guideSegment: ProductionTextSegment;
  input: string;
  isCurrent: boolean;
  mistakeFlash: MistakeFlash | null;
  reading: string;
  readingSegment: ProductionTextSegment;
  romajiTarget: RomajiInputTarget | null;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
  enSpaceDisplay: EnSpaceDisplay;
}) {
  return (
    <>
      {showHiraganaDisplay && readingSegment.text ? (
        <p className={css(styles, "reading-text")}>
          {isCurrent && romajiTarget
            ? renderReadingGuideSegmentCharacters(
              reading,
              readingSegment,
              romajiTarget,
              input,
              mistakeFlash,
              showHiraganaMarker,
            )
            : renderPlainSegmentCharacters(readingSegment.text, enSpaceDisplay)}
        </p>
      ) : null}
      <p className={css(styles, "input-target")} aria-label="romaji input target">
        {isCurrent && romajiTarget
          ? renderRomajiGuideSegmentCharacters(
            romajiTarget,
            guideSegment,
            input,
            mistakeFlash,
            strictMistakeInput,
            strictMistakeDisplayMode,
            showRomajiMarker,
            romajiMarkerMode,
          )
          : renderPlainSegmentCharacters(guideSegment.text, enSpaceDisplay)}
      </p>
    </>
  );
}

export function renderPlainSegmentCharacters(
  text: string,
  enSpaceDisplay: EnSpaceDisplay = "glyph",
) {
  return Array.from(text).map((character, index) => {
    if (/\s/.test(character)) {
      return (
        <span
          className={css(
            styles,
            "visual-space",
            "char",
            enSpaceDisplay === "glyph" ? "visible-space-glyph" : "",
          )}
          key={`segment-space-${index}`}
          aria-hidden="true"
        >
          {getVisibleSpaceCharacter(enSpaceDisplay)}
        </span>
      );
    }

    return (
      <span className={css(styles, "char")} key={`segment-plain-${character}-${index}`}>
        {character}
      </span>
    );
  });
}

export function renderReadingGuideSegmentCharacters(
  reading: string,
  segment: ProductionTextSegment,
  target: RomajiInputTarget,
  input: string,
  mistakeFlash: MistakeFlash | null,
  showMarker: boolean,
) {
  const progress = getRomajiInputProgress(target, input);
  const flashTokenIndex = mistakeFlash ? progress.currentTokenIndex : null;

  return createJapaneseReadingGuideParts(reading)
    .filter(
      (part) =>
        part.kind === "visual" ||
        (segment.tokenStart <= part.tokenStart && part.tokenEnd <= segment.tokenEnd),
    )
    .map((part, partIndex) => {
      if (part.kind === "visual") {
        return (
          <span className={css(styles, "visual-space")} key={`segment-reading-space-${partIndex}`} aria-hidden="true">
            {part.text}
          </span>
        );
      }

      const isCompleted = part.tokenEnd <= progress.completedTokens;
      const isCurrent =
        part.tokenStart <= progress.currentTokenIndex &&
        progress.currentTokenIndex < part.tokenEnd;
      const isMistakeFlash = flashTokenIndex !== null && isCurrent && !isCompleted;
      const className = isCompleted
        ? css(styles, "char correct")
        : isCurrent && showMarker
          ? css(styles, "char current")
          : css(styles, "char");
      const flashClassName = isMistakeFlash ? cx(className, css(styles, "mistake-flash")) : className;
      const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

      return (
        <span
          className={flashClassName}
          key={`segment-reading-${part.tokenStart}-${part.text}-${partIndex}-${flashKey}`}
        >
          {part.text}
        </span>
      );
    });
}

export function renderRomajiGuideSegmentCharacters(
  target: RomajiInputTarget,
  segment: ProductionTextSegment,
  input: string,
  mistakeFlash: MistakeFlash | null,
  strictMistakeInput: string,
  strictMistakeDisplayMode: StrictMistakeDisplayMode,
  showMarker: boolean,
  markerMode: RomajiMarkerMode,
) {
  if (markerMode === "token") {
    return renderRomajiGuideTokenUnits(
      target,
      input,
      mistakeFlash,
      strictMistakeInput,
      strictMistakeDisplayMode,
      showMarker,
      segment,
    );
  }

  const progress = getRomajiInputProgress(target, input);
  const flashTokenIndex = mistakeFlash ? progress.currentTokenIndex : null;
  const flashCharacterIndex =
    mistakeFlash && progress.currentOption ? progress.currentOptionOffset : 0;
  const mistakeCharacters = getVisibleStrictMistakeCharacters(
    strictMistakeInput,
    strictMistakeDisplayMode,
  );
  const elements: ReactNode[] = [];
  let inputCharacterIndex = 0;
  let insertedMistakes = false;

  target.parts.forEach((part, partIndex) => {
    if (part.kind === "visual") {
      if (segment.text.includes(part.text)) {
        elements.push(
          <span className={css(styles, "visual-space")} key={`segment-romaji-space-${partIndex}`} aria-hidden="true">
            {part.text}
          </span>,
        );
      }
      return;
    }

    const text =
      progress.currentTokenIndex === part.tokenIndex && progress.currentOption
        ? progress.currentOption
        : (progress.selectedOptions[part.tokenIndex] ?? part.text);
    const isInSegment = segment.tokenStart <= part.tokenIndex && part.tokenIndex < segment.tokenEnd;

    Array.from(text).forEach((character, characterIndex) => {
      if (!isInSegment) {
        inputCharacterIndex += 1;
        return;
      }

      if (
        strictMistakeDisplayMode === "insert" &&
        !insertedMistakes &&
        inputCharacterIndex === input.length
      ) {
        elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "segment-romaji-insert"));
        insertedMistakes = true;
      }

      const overwriteMistake = getOverwriteMistakeCharacter(
        mistakeCharacters,
        inputCharacterIndex,
        input.length,
        strictMistakeDisplayMode,
      );
      if (overwriteMistake) {
        elements.push(
          <span
            className={css(styles, "char wrong")}
            key={`segment-romaji-overwrite-${part.tokenIndex}-${characterIndex}`}
          >
            {overwriteMistake}
          </span>,
        );
        inputCharacterIndex += 1;
        return;
      }

      const isCompletedToken = part.tokenIndex < progress.completedTokens;
      const isCurrentToken = part.tokenIndex === progress.currentTokenIndex;
      const isTypedCurrentCharacter =
        isCurrentToken &&
        progress.currentOption !== null &&
        characterIndex < progress.currentOptionOffset;
      const isNextCurrentCharacter =
        isCurrentToken &&
        characterIndex === (progress.currentOption ? progress.currentOptionOffset : 0);
      const isMistakeFlash =
        flashTokenIndex === part.tokenIndex &&
        characterIndex === flashCharacterIndex &&
        !isTypedCurrentCharacter;
      const className = isCompletedToken
        ? css(styles, "char correct")
        : isTypedCurrentCharacter
          ? css(styles, "char correct")
          : isNextCurrentCharacter && showMarker
            ? css(styles, "char current")
            : css(styles, "char");
      const flashClassName = isMistakeFlash ? cx(className, css(styles, "mistake-flash")) : className;
      const flashKey = isMistakeFlash && mistakeFlash ? mistakeFlash.id : "idle";

      elements.push(
        <span
          className={flashClassName}
          key={`segment-romaji-${part.tokenIndex}-${character}-${characterIndex}-${flashKey}`}
        >
          {character}
        </span>,
      );
      inputCharacterIndex += 1;
    });
  });

  if (strictMistakeDisplayMode === "insert" && !insertedMistakes) {
    elements.push(...renderStrictMistakeCharacters(mistakeCharacters, "segment-romaji-insert"));
  }

  if (strictMistakeDisplayMode === "overwrite") {
    elements.push(
      ...renderStrictMistakeCharacters(
        mistakeCharacters.slice(Math.max(0, inputCharacterIndex - input.length)),
        "segment-romaji-overwrite-tail",
      ),
    );
  }

  return elements;
}
