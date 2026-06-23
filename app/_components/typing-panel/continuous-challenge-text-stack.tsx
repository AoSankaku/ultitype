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

import { PreviousCenterDisplayText, getReadingMarkerNodeIndex, insertCenterMarker, renderCenterDisplayText, renderCenterInputProgressText, renderCenterNextDisplayText, renderCenterTextWithMarker } from "./center-display-text";
import { CenterScrollViewport, createCenterScrollMeasurementKey, getCenterMarkerPosition, getCompletedGuideInput } from "./center-scroll-viewport";
import { renderCompletedReadingCharacters, renderGuideCharacters, renderReadingGuideCharacters, renderRomajiGuideCharacters } from "./guide-characters";
import { InputProgress } from "./types";

export function ContinuousChallengeTextStack({
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
}) {
  const hasSeparateDisplay = display !== guide;
  const centerMarkerPosition = getCenterMarkerPosition(romajiTarget, input);
  const centerMarkerKey = createCenterScrollMeasurementKey({
    englishFontFamily,
    input,
    japaneseFontFamily,
    markerPosition: centerMarkerPosition,
  });
  const rows: Partial<Record<TargetDisplayElementId, ReactNode>> = {
    kanji:
      showDisplayText && hasSeparateDisplay ? (
        <CenterScrollViewport
          kind="display"
          key="kanji"
          markerKey={centerMarkerKey}
          markerPosition={centerMarkerPosition}
          startsAtLeft={startsAtLeft}
        >
          <p className={css(styles, "display-text center-continuous-line")}>
            <PreviousCenterDisplayText
              display={previousChallengeDisplay}
              furigana={previousChallengeFurigana}
              showFurigana={showFuriganaDisplay}
              showFuriganaMarker={showFuriganaMarker}
              showKanjiMarker={showKanjiMarker}
            />
            {renderCenterDisplayText(
              display,
              furigana,
              centerMarkerPosition,
              showFuriganaDisplay,
              showFuriganaMarker,
              showKanjiMarker,
              renderCenterNextDisplayText(
                nextChallengeDisplay,
                nextChallengeFurigana,
                showFuriganaDisplay,
              ),
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
      showHiraganaDisplay && (reading || nextChallengeReading) ? (
        <CenterScrollViewport
          kind="reading"
          key="hiragana"
          markerKey={centerMarkerKey}
          markerPosition={centerMarkerPosition}
          startsAtLeft={startsAtLeft}
        >
          <p className={css(styles, "reading-text center-continuous-line")}>
            {previousChallengeReading ? (
              <span className={css(styles, "center-scroll-previous-text")}>
                {showHiraganaMarker
                  ? renderCompletedReadingCharacters(previousChallengeReading)
                  : previousChallengeReading}
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
            <span className={css(styles, "center-scroll-next-text")}>{nextChallengeReading}</span>
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
          {previousChallengeGuide ? (
            <span className={css(styles, "center-scroll-previous-text")}>
              {renderGuideCharacters(
                previousChallengeGuide,
                getCompletedGuideInput(previousChallengeGuide),
                null,
                "",
                "none",
                false,
              )}
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
            )
            : renderGuideCharacters(
              guide,
              input,
              mistakeFlash,
              strictMistakeInput,
              strictMistakeDisplayMode,
              showRomajiMarker,
            )}
          <span className={css(styles, "center-scroll-next-text")}>
            {renderGuideCharacters(nextChallengeGuide, "", null, "", "none", false)}
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
