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

import { cssSelector } from "./common";
import { CenterScrollViewportKind } from "./types";

export function CenterScrollViewport({
  children,
  kind,
  markerKey,
  markerPosition,
  startsAtLeft,
}: {
  children: ReactNode;
  kind: CenterScrollViewportKind;
  markerKey: string;
  markerPosition: number;
  startsAtLeft: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [markerTranslatePx, setMarkerTranslatePx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    let isCancelled = false;
    let animationFrameId: number | null = null;

    const updateTranslate = () => {
      if (isCancelled) {
        return;
      }

      setMarkerTranslatePx(measureCenterScrollTranslate(viewport, kind, startsAtLeft));
    };

    const scheduleUpdate = () => {
      if (isCancelled || animationFrameId !== null) {
        return;
      }

      animationFrameId = requestAnimationFrame(() => {
        animationFrameId = null;
        updateTranslate();
      });
    };

    updateTranslate();
    scheduleUpdate();

    const fontSet = document.fonts;
    void fontSet?.ready.then(scheduleUpdate);
    fontSet?.addEventListener?.("loadingdone", scheduleUpdate);

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(scheduleUpdate);
    if (resizeObserver) {
      resizeObserver.observe(viewport);

      const line = viewport.querySelector<HTMLElement>(cssSelector("center-continuous-line"));
      if (line) {
        resizeObserver.observe(line);
      }

      const marker = viewport.querySelector<HTMLElement>(centerScrollMarkerSelector);
      if (marker) {
        resizeObserver.observe(marker);
      }
    }

    return () => {
      isCancelled = true;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      fontSet?.removeEventListener?.("loadingdone", scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, [kind, markerKey, markerPosition, startsAtLeft]);

  const style = {
    "--center-marker-position": `${markerPosition}ch`,
    "--center-marker-translate":
      markerTranslatePx === null
        ? startsAtLeft
          ? "calc(-1 * max(0ch, var(--center-marker-position) - 8ch))"
          : "calc(8ch - var(--center-marker-position))"
        : `${markerTranslatePx}px`,
  } as CSSProperties;

  return (
    <div
      className={css(styles, "center-scroll-viewport", `${kind}-center-viewport`)}
      ref={viewportRef}
      style={style}
    >
      {children}
    </div>
  );
}

export const centerScrollMarkerSelector = [
  cssSelector("center-scroll-current-display"),
  cssSelector("center-scroll-current-marker"),
  cssSelector("furigana-marker-current"),
  cssSelector("kanji-marker-current"),
  `${cssSelector("char", "current")}:not(${cssSelector("correct")})`,
  cssSelector("char", "current"),
].join(", ");

export function measureCenterScrollTranslate(
  viewport: HTMLElement,
  kind: CenterScrollViewportKind,
  startsAtLeft: boolean,
) {
  const line = viewport.querySelector<HTMLElement>(cssSelector("center-continuous-line"));
  const marker = viewport.querySelector<HTMLElement>(centerScrollMarkerSelector);
  if (!marker) {
    return null;
  }

  const previousLineTransition = line?.style.transition ?? "";
  const previousLineTransform = line?.style.transform ?? "";
  if (line) {
    line.style.transition = "none";
    line.style.transform = "none";
  }

  const viewportRect = viewport.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  let targetCenter = markerRect.left - viewportRect.left + markerRect.width / 2;

  // The display (kanji) and reading (kana) lines anchor on a zero-width marker
  // placed right before the unit currently being typed. Centering that marker
  // would put the unit's LEFT EDGE on the center line, leaving the glyph half a
  // character to the right and breaking vertical alignment with the romaji line
  // (which centers the current character's midpoint). Instead, center the unit
  // itself (the element right after the marker) by its measured midpoint, so the
  // current kanji / current kana / current romaji char all stack in one column.
  // Measuring here (vs a fixed CSS offset) also keeps the first challenge flush
  // left under startsAtLeft instead of bleeding off the left edge.
  if (
    (kind === "display" || kind === "reading") &&
    marker.classList.contains(css(styles, "center-scroll-current-marker"))
  ) {
    const unit = marker.nextElementSibling as HTMLElement | null;
    const isNextChallengeText =
      unit?.classList.contains(css(styles, "center-scroll-next-text")) ?? false;
    if (unit && !isNextChallengeText) {
      const alignmentUnit =
        kind === "display"
          ? (unit.querySelector<HTMLElement>(cssSelector("display-ruby-base")) ?? unit)
          : unit;
      const unitRect = alignmentUnit.getBoundingClientRect();
      if (unitRect.width > 0) {
        targetCenter = unitRect.left - viewportRect.left + unitRect.width / 2;
      }
    }
  }

  const viewportCenter = viewportRect.width / 2;
  const nextTranslate = calculateScaledCenterScrollTranslate({
    scaleX: getElementScaleX(viewport, viewportRect),
    startsAtLeft,
    targetCenter,
    viewportCenter,
  });

  if (line) {
    line.style.transition = previousLineTransition;
    line.style.transform = previousLineTransform;
  }

  return nextTranslate;
}

export function calculateScaledCenterScrollTranslate({
  scaleX,
  startsAtLeft,
  targetCenter,
  viewportCenter,
}: {
  scaleX: number;
  startsAtLeft: boolean;
  targetCenter: number;
  viewportCenter: number;
}) {
  const visualTranslate = startsAtLeft && targetCenter <= viewportCenter ? 0 : viewportCenter - targetCenter;
  const localScaleX = Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1;

  return Math.round((visualTranslate / localScaleX) * 10) / 10;
}

export function getElementScaleX(element: HTMLElement, rect = element.getBoundingClientRect()) {
  return element.offsetWidth > 0 ? rect.width / element.offsetWidth : 1;
}

export function getCompletedGuideInput(guide: string) {
  return Array.from(guide)
    .filter((character) => !/\s/.test(character))
    .join("");
}

export function getCenterMarkerPosition(target: RomajiInputTarget | null, input: string) {
  if (!target) {
    return Array.from(input).length;
  }

  return getRomajiInputProgress(target, input).currentTokenIndex;
}

export function createCenterScrollMeasurementKey({
  englishFontFamily,
  input,
  japaneseFontFamily,
  markerPosition,
}: {
  englishFontFamily: EnglishFontFamily;
  input: string;
  japaneseFontFamily: JapaneseFontFamily;
  markerPosition: number;
}) {
  return `${markerPosition}-${input}-${japaneseFontFamily}-${englishFontFamily}`;
}
