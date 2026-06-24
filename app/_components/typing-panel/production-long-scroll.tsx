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
import { ProductionLongScrollState } from "./types";

export function createProductionLongScrollContentKey({
  display,
  nextChallengeDisplay,
}: {
  display: string;
  nextChallengeDisplay: string;
}) {
  return `${display.length}:${display}\u001f${nextChallengeDisplay.length}:${nextChallengeDisplay}`;
}

export function createProductionLongChallengeHandoff({
  display,
  nextChallengeDisplay,
  previousDisplay,
  previousNextChallengeDisplay,
}: {
  display: string;
  nextChallengeDisplay: string;
  previousDisplay: string;
  previousNextChallengeDisplay: string;
}) {
  if (!display || previousDisplay === display || previousNextChallengeDisplay !== display) {
    return null;
  }

  return {
    id: `${previousDisplay.length}:${previousDisplay}\u001f${display.length}:${display}`,
    resetContentKey: createProductionLongScrollContentKey({ display, nextChallengeDisplay }),
    scrollContentKey: createProductionLongScrollContentKey({
      display: previousDisplay,
      nextChallengeDisplay: previousNextChallengeDisplay,
    }),
  };
}

export function getProductionLongEffectiveScrollLines(
  state: ProductionLongScrollState,
  contentKey: string,
) {
  return state.contentKey === contentKey ? state.scrollLines : 0;
}

export function useProductionLongBodyScroll(
  markerKey: string,
  scrollAnchorLine: number,
  scrollContentKey: string,
) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [scrollState, setScrollState] = useState<ProductionLongScrollState>({
    contentKey: scrollContentKey,
    scrollLines: 0,
  });
  const scrollLines = getProductionLongEffectiveScrollLines(scrollState, scrollContentKey);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) {
      return;
    }

    let animationFrameId: number | null = null;

    const updateScrollLines = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(() => {
        const content = body.querySelector<HTMLElement>(cssSelector("production-long-scroll-content"));
        const textLine = content?.querySelector<HTMLElement>(
          cssSelector("production-long-display-text"),
        );
        const marker = content?.querySelector<HTMLElement>(
          cssSelector("production-long-scroll-target"),
        );

        if (!content || !textLine || !marker) {
          setScrollState((current) =>
            current.contentKey === scrollContentKey && current.scrollLines === 0
              ? current
              : { contentKey: scrollContentKey, scrollLines: 0 },
          );
          animationFrameId = null;
          return;
        }

        const lineHeight = getProductionLongLineHeight(textLine);
        const markerTop = marker.getBoundingClientRect().top - content.getBoundingClientRect().top;
        const spacerOffsetLines = getProductionLongSpacerOffsetLines(marker, lineHeight);
        const nextScrollLines = calculateProductionLongScrollLines(
          markerTop,
          lineHeight,
          scrollAnchorLine,
          spacerOffsetLines,
        );
        setScrollState((current) =>
          current.contentKey === scrollContentKey && current.scrollLines === nextScrollLines
            ? current
            : { contentKey: scrollContentKey, scrollLines: nextScrollLines },
        );
        animationFrameId = null;
      });
    };

    updateScrollLines();

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateScrollLines);
    const content = body.querySelector<HTMLElement>(".production-long-scroll-content");
    resizeObserver?.observe(body);
    if (content) {
      resizeObserver?.observe(content);
    }
    window.addEventListener("resize", updateScrollLines);

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateScrollLines);
    };
  }, [markerKey, scrollAnchorLine, scrollContentKey]);

  return { bodyRef, scrollLines };
}

export function getProductionLongLineHeight(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(style.lineHeight);
  if (Number.isFinite(lineHeight) && lineHeight > 0) {
    return lineHeight;
  }

  const fontSize = Number.parseFloat(style.fontSize);
  return Number.isFinite(fontSize) && fontSize > 0 ? fontSize * 1.45 : 0;
}

export function getProductionLongSpacerOffsetLines(marker: HTMLElement, lineHeight: number) {
  if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
    return 0;
  }

  const spacer = marker.closest<HTMLElement>(cssSelector("production-long-next-spacer"));
  if (!spacer) {
    return 0;
  }

  const marginTop = Number.parseFloat(window.getComputedStyle(spacer).marginTop);
  if (!Number.isFinite(marginTop) || marginTop <= 0) {
    return 0;
  }

  const marginLines = marginTop / lineHeight;
  return marginLines - Math.floor(marginLines);
}

export function calculateProductionLongScrollLines(
  markerTop: number,
  lineHeight: number,
  scrollAnchorLine = 0,
  spacerOffsetLines = 0,
) {
  if (!Number.isFinite(markerTop) || !Number.isFinite(lineHeight) || markerTop <= 0 || lineHeight <= 0) {
    return 0;
  }

  const anchorLine =
    Number.isFinite(scrollAnchorLine) && scrollAnchorLine > 0 ? Math.floor(scrollAnchorLine) : 0;
  const normalizedSpacerOffsetLines =
    Number.isFinite(spacerOffsetLines) && spacerOffsetLines > 0 ? spacerOffsetLines : 0;
  const nextScrollLines =
    Math.floor(markerTop / lineHeight) - anchorLine + normalizedSpacerOffsetLines;

  return Math.max(0, Math.round(nextScrollLines * 1000) / 1000);
}
