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
  EnSpaceDisplay,
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

import { ChallengeTextStack } from "./challenge-text-stack";
import { ContinuousChallengeTextStack } from "./continuous-challenge-text-stack";
import { useStableProductionImePromptScrollMarkerPosition } from "./production-ime-scroll";
import { ProductionLongDisplay } from "./production-long-display";
import { ProductionSegmentedInputStack } from "./production-segmented-input";
import { InputProgress } from "./types";

export function DirectChallengeView({
  display,
  englishFontFamily,
  furigana,
  guide,
  input,
  japaneseFontFamily,
  mistakeFlash,
  nextChallengeDisplay,
  nextChallengeFurigana,
  nextChallengeGuide,
  nextChallengePreview,
  nextChallengePreviewMode,
  nextChallengeReading,
  nextChallengeRomajiTarget,
  previousChallengeDisplay,
  previousChallengeFurigana,
  previousChallengeGuide,
  previousChallengeReading,
  inputProgress,
  previousInputProgress,
  reading,
  romajiTarget,
  showFuriganaDisplay,
  showFuriganaMarker,
  showHiraganaDisplay,
  showHiraganaMarker,
  showDisplayText,
  showKanjiInputProgress,
  showHiraganaInputProgress,
  isProductionDirect,
  currentChallengeLane,
  completedPrompts,
  showKanjiMarker,
  showRomajiMarker,
  romajiMarkerMode,
  targetDisplayOrder,
  strictMistakeDisplayMode,
  strictMistakeInput,
  enSpaceDisplay,
}: {
  display: string;
  englishFontFamily: EnglishFontFamily;
  furigana: JapaneseFuriganaEntry[];
  guide: string;
  input: string;
  japaneseFontFamily: JapaneseFontFamily;
  mistakeFlash: MistakeFlash | null;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  nextChallengeGuide: string;
  nextChallengePreview: string;
  nextChallengePreviewMode: NextChallengePreviewMode;
  nextChallengeReading: string;
  nextChallengeRomajiTarget: RomajiInputTarget | null;
  previousChallengeDisplay: string;
  previousChallengeFurigana: JapaneseFuriganaEntry[];
  previousChallengeGuide: string;
  previousChallengeReading: string;
  inputProgress: InputProgress;
  previousInputProgress: InputProgress;
  reading: string;
  romajiTarget: RomajiInputTarget | null;
  showFuriganaDisplay: boolean;
  showFuriganaMarker: boolean;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showDisplayText: boolean;
  showKanjiInputProgress: boolean;
  showHiraganaInputProgress: boolean;
  isProductionDirect: boolean;
  currentChallengeLane: "top" | "bottom";
  completedPrompts: number;
  showKanjiMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  targetDisplayOrder: TargetDisplayElementId[];
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
  enSpaceDisplay: EnSpaceDisplay;
}) {
  const challengeContent = (
    <ChallengeTextStack
      display={display}
      furigana={furigana}
      guide={guide}
      input={input}
      mistakeFlash={mistakeFlash}
      reading={reading}
      renderMarkers={true}
      romajiTarget={romajiTarget}
      inputProgress={inputProgress}
      showDisplayText={showDisplayText}
      showFuriganaDisplay={showFuriganaDisplay}
      showFuriganaMarker={showFuriganaMarker}
      showHiraganaDisplay={showHiraganaDisplay}
      showHiraganaMarker={showHiraganaMarker}
      showKanjiInputProgress={showKanjiInputProgress}
      showHiraganaInputProgress={showHiraganaInputProgress}
      showKanjiMarker={showKanjiMarker}
      showRomajiMarker={showRomajiMarker}
      romajiMarkerMode={romajiMarkerMode}
      targetDisplayOrder={targetDisplayOrder}
      strictMistakeDisplayMode={strictMistakeDisplayMode}
      strictMistakeInput={strictMistakeInput}
      enSpaceDisplay={enSpaceDisplay}
    />
  );
  const nextChallengeContent = (
    <ChallengeTextStack
      display={nextChallengeDisplay}
      furigana={nextChallengeFurigana}
      guide={nextChallengeGuide}
      input=""
      mistakeFlash={null}
      reading={nextChallengeReading}
      renderMarkers={false}
      romajiTarget={nextChallengeRomajiTarget}
      inputProgress={{ hiragana: "", kanji: "" }}
      showDisplayText={showDisplayText}
      showFuriganaDisplay={showFuriganaDisplay}
      showFuriganaMarker={false}
      showHiraganaDisplay={showHiraganaDisplay}
      showHiraganaMarker={false}
      showKanjiInputProgress={false}
      showHiraganaInputProgress={false}
      showKanjiMarker={false}
      showRomajiMarker={false}
      romajiMarkerMode={romajiMarkerMode}
      targetDisplayOrder={targetDisplayOrder}
      strictMistakeDisplayMode="none"
      strictMistakeInput=""
      enSpaceDisplay={enSpaceDisplay}
    />
  );

  if (isProductionDirect) {
    return (
      <ProductionDirectChallengeView
        display={display}
        englishFontFamily={englishFontFamily}
        furigana={furigana}
        guide={guide}
        input={input}
        japaneseFontFamily={japaneseFontFamily}
        mistakeFlash={mistakeFlash}
        nextChallengeDisplay={nextChallengeDisplay}
        nextChallengeFurigana={nextChallengeFurigana}
        nextChallengeGuide={nextChallengeRomajiTarget?.guide ?? nextChallengeGuide}
        nextChallengePreviewMode={nextChallengePreviewMode}
        nextChallengeReading={nextChallengeReading}
        nextChallengeRomajiTarget={nextChallengeRomajiTarget}
        completedPrompts={completedPrompts}
        previousChallengeGuide={previousChallengeGuide}
        previousChallengeReading={previousChallengeReading}
        inputProgress={inputProgress}
        previousInputProgress={previousInputProgress}
        reading={reading}
        romajiTarget={romajiTarget}
        showDisplayText={showDisplayText}
        showFuriganaDisplay={showFuriganaDisplay}
        showFuriganaMarker={showFuriganaMarker}
        showHiraganaDisplay={showHiraganaDisplay}
        showHiraganaMarker={showHiraganaMarker}
        showKanjiInputProgress={showKanjiInputProgress}
        showHiraganaInputProgress={showHiraganaInputProgress}
        showKanjiMarker={showKanjiMarker}
        showRomajiMarker={showRomajiMarker}
        romajiMarkerMode={romajiMarkerMode}
        targetDisplayOrder={targetDisplayOrder}
        strictMistakeDisplayMode={strictMistakeDisplayMode}
        strictMistakeInput={strictMistakeInput}
        enSpaceDisplay={enSpaceDisplay}
      />
    );
  }

  if (!nextChallengePreview || nextChallengePreviewMode === "none") {
    return challengeContent;
  }

  if (nextChallengePreviewMode === "center-scroll") {
    return (
      <div className={css(styles, "challenge-preview-layout center-scroll")}>
        <ContinuousChallengeTextStack
          display={display}
          englishFontFamily={englishFontFamily}
          furigana={furigana}
          guide={guide}
          input={input}
          japaneseFontFamily={japaneseFontFamily}
          mistakeFlash={mistakeFlash}
          nextChallengeDisplay={nextChallengeDisplay}
          nextChallengeFurigana={nextChallengeFurigana}
          nextChallengeGuide={nextChallengeRomajiTarget?.guide ?? nextChallengeGuide}
          nextChallengeReading={nextChallengeReading}
          previousChallengeDisplay={previousChallengeDisplay}
          previousChallengeFurigana={previousChallengeFurigana}
          previousChallengeGuide={previousChallengeGuide}
          previousChallengeReading={previousChallengeReading}
          inputProgress={inputProgress}
          previousInputProgress={previousInputProgress}
          reading={reading}
          romajiTarget={romajiTarget}
          showDisplayText={showDisplayText}
          showFuriganaDisplay={showFuriganaDisplay}
          showFuriganaMarker={showFuriganaMarker}
          showHiraganaDisplay={showHiraganaDisplay}
          showHiraganaMarker={showHiraganaMarker}
          showKanjiInputProgress={showKanjiInputProgress}
          showHiraganaInputProgress={showHiraganaInputProgress}
          showKanjiMarker={showKanjiMarker}
          showRomajiMarker={showRomajiMarker}
          romajiMarkerMode={romajiMarkerMode}
          targetDisplayOrder={targetDisplayOrder}
          startsAtLeft={completedPrompts === 0}
          strictMistakeDisplayMode={strictMistakeDisplayMode}
          strictMistakeInput={strictMistakeInput}
          enSpaceDisplay={enSpaceDisplay}
        />
      </div>
    );
  }

  if (nextChallengePreviewMode === "split-alternate") {
    const nextChallengeLane = currentChallengeLane === "top" ? "bottom" : "top";
    const currentLaneContent = (
      <div
        className={css(styles, "challenge-preview-lane current-lane", `${currentChallengeLane}-lane`, "active-lane")}
      >
        {challengeContent}
      </div>
    );
    const nextLaneContent = (
      <NextChallengePreviewLane
        lane={nextChallengeLane}
        nextChallengeContent={nextChallengeContent}
      />
    );

    return (
      <div className={css(styles, "challenge-preview-layout split-alternate")}>
        {currentChallengeLane === "top" ? currentLaneContent : nextLaneContent}
        <div className={css(styles, "challenge-preview-separator")} aria-hidden="true" />
        {currentChallengeLane === "top" ? nextLaneContent : currentLaneContent}
      </div>
    );
  }

  return (
    <div className={css(styles, "challenge-preview-layout split-slide")}>
      <div className={css(styles, "challenge-preview-lane current-lane top-lane")}>{challengeContent}</div>
      <div className={css(styles, "challenge-preview-separator")} aria-hidden="true" />
      <NextChallengePreviewLane lane="bottom" nextChallengeContent={nextChallengeContent} />
    </div>
  );
}

export function NextChallengePreviewLane({
  lane,
  nextChallengeContent,
}: {
  lane: "top" | "bottom";
  nextChallengeContent: ReactNode;
}) {
  return (
    <div className={css(styles, "challenge-preview-lane next-lane", `${lane}-lane`)}>
      {nextChallengeContent}
    </div>
  );
}

export function ProductionDirectChallengeView({
  display,
  englishFontFamily,
  furigana,
  guide,
  input,
  japaneseFontFamily,
  mistakeFlash,
  nextChallengeDisplay,
  nextChallengeFurigana,
  nextChallengeGuide,
  nextChallengePreviewMode,
  nextChallengeReading,
  nextChallengeRomajiTarget,
  completedPrompts,
  previousChallengeGuide,
  previousChallengeReading,
  inputProgress,
  previousInputProgress,
  reading,
  romajiTarget,
  showDisplayText,
  showFuriganaDisplay,
  showFuriganaMarker,
  showHiraganaDisplay,
  showHiraganaMarker,
  showKanjiInputProgress,
  showHiraganaInputProgress,
  showKanjiMarker,
  showRomajiMarker,
  romajiMarkerMode,
  targetDisplayOrder,
  strictMistakeDisplayMode,
  strictMistakeInput,
  enSpaceDisplay,
}: {
  display: string;
  englishFontFamily: EnglishFontFamily;
  furigana: JapaneseFuriganaEntry[];
  guide: string;
  input: string;
  japaneseFontFamily: JapaneseFontFamily;
  mistakeFlash: MistakeFlash | null;
  nextChallengeDisplay: string;
  nextChallengeFurigana: JapaneseFuriganaEntry[];
  nextChallengeGuide: string;
  nextChallengePreviewMode: NextChallengePreviewMode;
  nextChallengeReading: string;
  nextChallengeRomajiTarget: RomajiInputTarget | null;
  completedPrompts: number;
  previousChallengeGuide: string;
  previousChallengeReading: string;
  inputProgress: InputProgress;
  previousInputProgress: InputProgress;
  reading: string;
  romajiTarget: RomajiInputTarget | null;
  showDisplayText: boolean;
  showFuriganaDisplay: boolean;
  showFuriganaMarker: boolean;
  showHiraganaDisplay: boolean;
  showHiraganaMarker: boolean;
  showKanjiInputProgress: boolean;
  showHiraganaInputProgress: boolean;
  showKanjiMarker: boolean;
  showRomajiMarker: boolean;
  romajiMarkerMode: RomajiMarkerMode;
  targetDisplayOrder: TargetDisplayElementId[];
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
  enSpaceDisplay: EnSpaceDisplay;
}) {
  return (
    <div className={css(styles, "production-direct-layout")}>
      {showDisplayText ? (
        <ProductionLongDisplay
          display={display}
          furigana={furigana}
          input={input}
          nextChallengeDisplay={nextChallengeDisplay}
          nextChallengeFurigana={nextChallengeFurigana}
          romajiTarget={romajiTarget}
          showFurigana={showFuriganaDisplay}
          showFuriganaMarker={showFuriganaMarker}
          showKanjiMarker={showKanjiMarker}
        />
      ) : null}
      {nextChallengePreviewMode === "center-scroll" ? (
        <div className={css(styles, "challenge-preview-layout center-scroll production-direct-inputs")}>
          <ContinuousChallengeTextStack
            display=""
            englishFontFamily={englishFontFamily}
            furigana={[]}
            guide={guide}
            input={input}
            japaneseFontFamily={japaneseFontFamily}
            mistakeFlash={mistakeFlash}
            nextChallengeDisplay=""
            nextChallengeFurigana={[]}
            nextChallengeGuide={nextChallengeGuide}
            nextChallengeReading={nextChallengeReading}
            previousChallengeDisplay=""
            previousChallengeFurigana={[]}
            previousChallengeGuide={previousChallengeGuide}
            previousChallengeReading={previousChallengeReading}
            inputProgress={inputProgress}
            previousInputProgress={previousInputProgress}
            reading={reading}
            romajiTarget={romajiTarget}
            showDisplayText={false}
            showFuriganaDisplay={false}
            showFuriganaMarker={false}
            showHiraganaDisplay={showHiraganaDisplay}
            showHiraganaMarker={showHiraganaMarker}
            showKanjiInputProgress={showKanjiInputProgress}
            showHiraganaInputProgress={showHiraganaInputProgress}
            showKanjiMarker={false}
            showRomajiMarker={showRomajiMarker}
            romajiMarkerMode={romajiMarkerMode}
            targetDisplayOrder={targetDisplayOrder}
            startsAtLeft={completedPrompts === 0}
            strictMistakeDisplayMode={strictMistakeDisplayMode}
            strictMistakeInput={strictMistakeInput}
            enSpaceDisplay={enSpaceDisplay}
          />
        </div>
      ) : (
        <ProductionSegmentedInputStack
          guide={guide}
          input={input}
          mistakeFlash={mistakeFlash}
          nextChallengeGuide={nextChallengeGuide}
          nextChallengeReading={nextChallengeReading}
          nextChallengeRomajiTarget={nextChallengeRomajiTarget}
          previewMode={nextChallengePreviewMode}
          reading={reading}
          romajiTarget={romajiTarget}
          showHiraganaDisplay={showHiraganaDisplay}
          showHiraganaMarker={showHiraganaMarker}
          showRomajiMarker={showRomajiMarker}
          romajiMarkerMode={romajiMarkerMode}
          strictMistakeDisplayMode={strictMistakeDisplayMode}
          strictMistakeInput={strictMistakeInput}
          enSpaceDisplay={enSpaceDisplay}
        />
      )}
    </div>
  );
}
