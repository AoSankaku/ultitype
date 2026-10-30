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
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

import { PreviousCenterDisplayText, getReadingMarkerNodeIndex, insertCenterMarker, renderCenterDisplayText, renderCenterInputProgressText, renderCenterNextDisplayText, renderCenterTextWithMarker } from "./center-display-text";
import { CenterScrollViewport, createCenterScrollMeasurementKey, getCenterMarkerPosition } from "./center-scroll-viewport";
import { renderGuideCharacters, renderReadingGuideCharacters, renderRomajiGuideCharacters } from "./guide-characters";
import { renderCompactCompletedReading, renderStaticGuideText } from "./static-context-text";
import { InputProgress } from "./types";
import type { CenterScrollContext } from "../../_lib/center-scroll-context";

export function ContinuousChallengeTextStack({
  centerScrollContext,
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
  nextChallengeReading,
  previousChallengeDisplay,
  previousChallengeFurigana,
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
  startsAtLeft,
  strictMistakeDisplayMode,
  strictMistakeInput,
  enSpaceDisplay,
}: {
  centerScrollContext?: CenterScrollContext;
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
  nextChallengeReading: string;
  previousChallengeDisplay: string;
  previousChallengeFurigana: JapaneseFuriganaEntry[];
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
  startsAtLeft: boolean;
  strictMistakeDisplayMode: StrictMistakeDisplayMode;
  strictMistakeInput: string;
  enSpaceDisplay: EnSpaceDisplay;
}) {
  const fallbackPreviousChallenge = useMemo(() => [{
    display: previousChallengeDisplay,
    furigana: previousChallengeFurigana,
    guide: previousChallengeGuide,
    reading: previousChallengeReading,
  }], [previousChallengeDisplay, previousChallengeFurigana, previousChallengeGuide, previousChallengeReading]);
  const fallbackNextChallenge = useMemo(() => [{
    display: nextChallengeDisplay,
    furigana: nextChallengeFurigana,
    guide: nextChallengeGuide,
    reading: nextChallengeReading,
  }], [nextChallengeDisplay, nextChallengeFurigana, nextChallengeGuide, nextChallengeReading]);
  const previousChallenges = centerScrollContext?.previous ?? fallbackPreviousChallenge;
  const nextChallenges = centerScrollContext?.next ?? fallbackNextChallenge;
  const previousReading = useMemo(
    () => previousChallenges.map((challenge) => challenge.reading).join(""),
    [previousChallenges],
  );
  const previousGuide = useMemo(
    () => previousChallenges.map((challenge) => challenge.guide).join(""),
    [previousChallenges],
  );
  const nextReading = useMemo(
    () => nextChallenges.map((challenge) => challenge.reading).join(""),
    [nextChallenges],
  );
  const nextGuide = useMemo(
    () => nextChallenges.map((challenge) => challenge.guide).join(""),
    [nextChallenges],
  );
  const hasSeparateDisplay = display !== guide;
  const showDisplayRow = showDisplayText && hasSeparateDisplay;
  const showReadingRow = showHiraganaDisplay && Boolean(reading || nextReading);
  const previousDisplayNodes = useMemo(
    () => showDisplayRow
      ? previousChallenges.map((challenge, index) => (
          <PreviousCenterDisplayText
            key={index}
            display={challenge.display}
            furigana={challenge.furigana}
            showFurigana={showFuriganaDisplay}
            showFuriganaMarker={showFuriganaMarker}
            showKanjiMarker={showKanjiMarker}
          />
        ))
      : [],
    [previousChallenges, showDisplayRow, showFuriganaDisplay, showFuriganaMarker, showKanjiMarker],
  );
  const nextDisplayNodes = useMemo(
    () => showDisplayRow
      ? nextChallenges.map((challenge, index) => (
          <Fragment key={index}>
            {renderCenterNextDisplayText(challenge.display, challenge.furigana, showFuriganaDisplay)}
          </Fragment>
        ))
      : [],
    [nextChallenges, showDisplayRow, showFuriganaDisplay],
  );
  const previousReadingNodes = useMemo(
    () => showReadingRow && showHiraganaMarker
      ? renderCompactCompletedReading(previousReading)
      : showReadingRow ? previousReading : null,
    [previousReading, showHiraganaDisplay, showHiraganaMarker, showReadingRow],
  );
  const previousGuideNodes = useMemo(
    () => renderStaticGuideText(previousGuide, true, enSpaceDisplay),
    [previousGuide, enSpaceDisplay],
  );
  const nextGuideNodes = useMemo(
    () => renderStaticGuideText(nextGuide, false, enSpaceDisplay),
    [nextGuide, enSpaceDisplay],
  );
  const centerMarkerPosition = getCenterMarkerPosition(romajiTarget, input);
  const preserveHiddenRomajiAnchor = !showRomajiMarker;
  const inputMarkerKey = createCenterScrollMeasurementKey({
    englishFontFamily,
    input,
    japaneseFontFamily,
    markerPosition: centerMarkerPosition,
  });
  // The current input can be identical across prompts while its context moves.
  const centerMarkerKey = `${inputMarkerKey}-${display}-${reading}-${previousChallenges
    .map((challenge) => `${challenge.display}\u001f${challenge.guide}`)
    .join("\u001e")}`;
  const rows: Partial<Record<TargetDisplayElementId, ReactNode>> = {
    kanji:
      showDisplayRow ? (
        <CenterScrollViewport
          kind="display"
          key="kanji"
          markerKey={centerMarkerKey}
          markerPosition={centerMarkerPosition}
          startsAtLeft={startsAtLeft}
        >
          <p className={css(styles, "display-text center-continuous-line")}>
            {previousDisplayNodes}
            {renderCenterDisplayText(
              display,
              furigana,
              centerMarkerPosition,
              showFuriganaDisplay,
              showFuriganaMarker,
              showKanjiMarker,
              nextDisplayNodes,
            )}
          </p>
        </CenterScrollViewport>
      ) : null,
    kanjiInputProgress:
      showDisplayText && showKanjiInputProgress && (previousInputProgress.kanji || inputProgress.kanji) ? (
        <CenterScrollViewport
          kind="kanji-progress"
          key="kanjiInputProgress"
          markerKey={centerMarkerKey}
          markerPosition={centerMarkerPosition}
          startsAtLeft={startsAtLeft}
        >
          <p
            className={css(styles, "input-progress-text kanji-input-progress-text center-continuous-line")}
            aria-label="kanji input progress"
          >
            {renderCenterInputProgressText(inputProgress.kanji, previousInputProgress.kanji)}
          </p>
        </CenterScrollViewport>
      ) : null,
    hiraganaInputProgress:
      showHiraganaDisplay &&
      showHiraganaInputProgress &&
      (previousInputProgress.hiragana || inputProgress.hiragana) ? (
        <CenterScrollViewport
          kind="hiragana-progress"
          key="hiraganaInputProgress"
          markerKey={centerMarkerKey}
          markerPosition={centerMarkerPosition}
          startsAtLeft={startsAtLeft}
        >
          <p
            className={css(styles, "input-progress-text hiragana-input-progress-text center-continuous-line")}
            aria-label="hiragana input progress"
          >
            {renderCenterInputProgressText(inputProgress.hiragana, previousInputProgress.hiragana)}
          </p>
        </CenterScrollViewport>
      ) : null,
    hiragana:
      showReadingRow ? (
        <CenterScrollViewport
          kind="reading"
          key="hiragana"
          markerKey={centerMarkerKey}
          markerPosition={centerMarkerPosition}
          startsAtLeft={startsAtLeft}
        >
          <p className={css(styles, "reading-text center-continuous-line")}>
            {previousReading ? (
              <span className={css(styles, "center-scroll-previous-text")}>
                {previousReadingNodes}
              </span>
            ) : null}
            {romajiTarget
              ? insertCenterMarker(
                renderReadingGuideCharacters(
                  reading,
                  romajiTarget,
                  input,
                  mistakeFlash,
                  showHiraganaMarker,
                ),
                getReadingMarkerNodeIndex(reading, centerMarkerPosition),
              )
              : renderCenterTextWithMarker(reading, centerMarkerPosition, "")}
            <span className={css(styles, "center-scroll-next-text")}>{nextReading}</span>
          </p>
        </CenterScrollViewport>
      ) : null,
    romaji: (
      <CenterScrollViewport
        kind="input"
        key="romaji"
        markerKey={centerMarkerKey}
        markerPosition={centerMarkerPosition}
        startsAtLeft={startsAtLeft}
      >
        <p
          className={css(styles, "input-target center-continuous-line")}
          aria-label={hasSeparateDisplay ? "romaji input target" : "input target"}
        >
          {previousGuide ? (
            <span className={css(styles, "center-scroll-previous-text")}>
              {previousGuideNodes}
            </span>
          ) : null}
          {romajiTarget
            ? renderRomajiGuideCharacters(
              romajiTarget,
              input,
              mistakeFlash,
              strictMistakeInput,
              strictMistakeDisplayMode,
              showRomajiMarker,
              romajiMarkerMode,
              enSpaceDisplay,
              preserveHiddenRomajiAnchor,
            )
            : renderGuideCharacters(
              guide,
              input,
              mistakeFlash,
              strictMistakeInput,
              strictMistakeDisplayMode,
              showRomajiMarker,
              enSpaceDisplay,
            )}
          <span className={css(styles, "center-scroll-next-text")}>
            {nextGuideNodes}
          </span>
        </p>
      </CenterScrollViewport>
    ),
  };

  return (
    <div className={css(styles, "center-continuous-stack")}>
      {targetDisplayOrder.map((id) => rows[id] ?? null)}
    </div>
  );
}
