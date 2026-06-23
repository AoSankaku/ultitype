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

import { DisplayText } from "./display-text";
import { renderGuideCharacters, renderReadingGuideCharacters, renderRomajiGuideCharacters } from "./guide-characters";
import { InputProgress } from "./types";

export function ChallengeTextStack({
  display,
  furigana,
  guide,
  input,
  mistakeFlash,
  reading,
  renderMarkers,
  romajiTarget,
  inputProgress,
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
}: {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  guide: string;
  input: string;
  mistakeFlash: MistakeFlash | null;
  reading: string;
  renderMarkers: boolean;
  romajiTarget: RomajiInputTarget | null;
  inputProgress: InputProgress;
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
}) {
  const hasSeparateDisplay = display !== guide;
  const markerProgress = romajiTarget ? getRomajiInputProgress(romajiTarget, input) : null;
  const elements: Partial<Record<TargetDisplayElementId, ReactNode>> = {
    kanji:
      showDisplayText && hasSeparateDisplay ? (
        <DisplayText
          display={display}
          furigana={furigana}
          key="kanji"
          markerProgress={showKanjiMarker || showFuriganaMarker ? markerProgress : null}
          showFurigana={showFuriganaDisplay}
          showFuriganaMarker={showFuriganaMarker}
          showKanjiMarker={showKanjiMarker}
        />
      ) : null,
    kanjiInputProgress:
      showDisplayText && showKanjiInputProgress && inputProgress.kanji ? (
        <p
          className={css(styles, "input-progress-text", "kanji-input-progress-text")}
          aria-label="kanji input progress"
          key="kanjiInputProgress"
        >
          {inputProgress.kanji}
        </p>
      ) : null,
    hiragana:
      showHiraganaDisplay && reading ? (
        <p className={css(styles, "reading-text")} key="hiragana">
          {romajiTarget && renderMarkers
            ? renderReadingGuideCharacters(
              reading,
              romajiTarget,
              input,
              mistakeFlash,
              showHiraganaMarker,
            )
            : reading}
        </p>
      ) : null,
    hiraganaInputProgress:
      showHiraganaDisplay && showHiraganaInputProgress && inputProgress.hiragana ? (
        <p
          className={css(styles, "input-progress-text", "hiragana-input-progress-text")}
          aria-label="hiragana input progress"
          key="hiraganaInputProgress"
        >
          {inputProgress.hiragana}
        </p>
      ) : null,
    romaji: (
      <p
        className={css(styles, "input-target")}
        aria-label={hasSeparateDisplay ? "romaji input target" : "input target"}
        key="romaji"
      >
        {romajiTarget
          ? renderMarkers
            ? renderRomajiGuideCharacters(
              romajiTarget,
              input,
              mistakeFlash,
              strictMistakeInput,
              strictMistakeDisplayMode,
              showRomajiMarker,
              romajiMarkerMode,
            )
            : renderGuideCharacters(guide, "", null, "", "none", false)
          : renderGuideCharacters(
            guide,
            input,
            mistakeFlash,
            strictMistakeInput,
            strictMistakeDisplayMode,
            showRomajiMarker,
          )}
      </p>
    ),
  };

  return <>{targetDisplayOrder.map((id) => elements[id] ?? null)}</>;
}
