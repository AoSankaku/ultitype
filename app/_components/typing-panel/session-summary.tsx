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

import { challengeTipFadeMs } from "./common";
import { CorrectnessTile } from "./types";

export function ChallengeTip({
  completedPrompts,
  isFinished,
  startedAt,
}: {
  completedPrompts: number;
  isFinished: boolean;
  startedAt: number | null;
}) {
  const phase = isFinished ? "post" : startedAt === null ? "pre" : "running";
  const fallbackTip =
    phase === "post"
      ? postSessionTips[completedPrompts % postSessionTips.length]
      : preSessionTips[completedPrompts % preSessionTips.length];
  const [tipState, setTipState] = useState<{
    isExiting: boolean;
    phase: "pre" | "post";
    text: string;
  } | null>(
    phase === "running"
      ? null
      : {
          isExiting: false,
          phase,
          text: fallbackTip,
        },
  );

  useEffect(() => {
    if (phase === "pre") {
      setTipState({
        isExiting: false,
        phase: "pre",
        text: getRandomPreSessionTip(),
      });
      return;
    }

    if (phase === "post") {
      setTipState({
        isExiting: false,
        phase: "post",
        text: getRandomPostSessionTip(),
      });
      return;
    }

    setTipState((previous) => previous && { ...previous, isExiting: true });
    const fadeTimer = window.setTimeout(() => setTipState(null), challengeTipFadeMs);

    return () => window.clearTimeout(fadeTimer);
  }, [phase]);

  if (!tipState) {
    return null;
  }

  return (
    <p
      className={css(styles, "challenge-tip", tipState.isExiting ? "exiting" : "")}
      aria-label={tipState.phase === "pre" ? "pre-session tip" : "post-session tip"}
    >
      <strong>Tips</strong>
      <span>{tipState.text}</span>
    </p>
  );
}

export function ChallengeAnalysis({
  acceptsTextInput,
  currentAccuracy,
  currentDisplay,
  input,
  metrics,
  stats,
}: {
  acceptsTextInput: boolean;
  currentAccuracy: number;
  currentDisplay: string;
  input: string;
  metrics: Metrics;
  stats: RuntimeStats;
}) {
  const tiles = acceptsTextInput ? [] : getDirectCorrectnessTiles(stats.keyStabilityHistory);
  const correctnessEmptyLabel =
    acceptsTextInput && input.length > 0 ? "課題終了まで非表示" : "入力待ち";
  const speedMetric = getSpeedMetric(metrics.keysPerSecond);
  const driftMs = getAverageAbsoluteDrift(stats.keyStabilityHistory, metrics.paceMs);

  return (
    <section className={css(styles, "challenge-analysis")} aria-label="Live Analysis">
      <div className={css(styles, "challenge-analysis-title")}>Live Analysis</div>
      <div className={css(styles, "analysis-column correctness-column")}>
        <div className={css(styles, "analysis-heading")}>
          <span>正誤率</span>
          <strong>{(currentAccuracy * 100).toFixed(1)}%</strong>
          <small>ミス {stats.mistakes}</small>
        </div>
        <div className={css(styles, "correctness-tiles")} aria-label="正誤履歴">
          {tiles.length === 0 ? (
            <span className={css(styles, "analysis-empty")}>{correctnessEmptyLabel}</span>
          ) : (
            tiles.map((tile) => (
              <span className={css(styles, "correctness-tile", tile.state)} key={tile.id} title={tile.title}>
                {tile.label}
              </span>
            ))
          )}
        </div>
      </div>

      <div className={css(styles, "analysis-column stability-column")}>
        <div className={css(styles, "analysis-heading")}>
          <span>安定度</span>
          <strong>{(metrics.consistency * 100).toFixed(0)}%</strong>
          <small>{speedMetric.label} {speedMetric.value}</small>
        </div>
        <div className={css(styles, "analysis-metrics")}>
          <div>
            <span>平均打鍵間隔</span>
            <strong>{metrics.paceMs ? `${metrics.paceMs.toFixed(0)} ms` : "--"}</strong>
          </div>
          <div>
            <span>ズレ平均</span>
            <strong>{driftMs ? `${driftMs.toFixed(0)} ms` : "--"}</strong>
          </div>
          <div>
            <span>物理打鍵</span>
            <strong>{stats.physicalKeystrokes}</strong>
          </div>
        </div>
        <div className={css(styles, "stability-mini-chart")} aria-label="打鍵間隔の安定度グラフ">
          {stats.keyStabilityHistory.slice(-48).length === 0 ? (
            <span className={css(styles, "analysis-empty")}>入力待ち</span>
          ) : (
            stats.keyStabilityHistory.slice(-48).map((sample) => (
              <span
                className={getStabilityBarClass(sample, metrics.paceMs)}
                key={sample.id}
                style={{ height: `${getBarHeight(sample.intervalMs, metrics.paceMs)}%` }}
                title={formatSampleTitle(sample)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export function getSessionModeIcon(mode: TypingMode) {
  if (mode.group !== "practice") {
    return null;
  }

  switch (mode.id) {
    case "practice-accuracy":
      return Crosshair;
    case "practice-flow":
      return Waves;
    case "practice-speed":
      return Zap;
    default:
      return null;
  }
}

export function CorrectionDebtIndicator({ debt }: { debt: number }) {
  if (debt <= 0) {
    return null;
  }

  const visibleDots = Math.min(debt, 12);

  return (
    <div aria-live="polite" className={css(styles, "correction-debt")} role="status">
      <span className={css(styles, "keycap")}>Backspace</span>
      <span className={css(styles, "debt-count")}>あと {debt} 回</span>
      <span className={css(styles, "debt-dots")} aria-hidden="true">
        {Array.from({ length: visibleDots }, (_, index) => (
          <span key={index} />
        ))}
        {debt > visibleDots ? <em>+{debt - visibleDots}</em> : null}
      </span>
    </div>
  );
}

export function createTopDisplayMetrics({
  metrics,
  mode,
  progress,
  remainingSeconds,
  stats,
  topDisplayMetricIds,
}: {
  metrics: Metrics;
  mode: TypingMode;
  progress: number;
  remainingSeconds: number;
  stats: RuntimeStats;
  topDisplayMetricIds: TopDisplayMetricId[];
}) {
  const selectedIds = new Set(topDisplayMetricIds);
  return topDisplayMetricOptions
    .map((option) => option.id)
    .filter((id) => selectedIds.has(id))
    .map((id) => {
      switch (id) {
        case "remainingTime":
          return {
            id,
            label: "残り時間",
            value: formatTimer(remainingSeconds),
          };
        case "remainingPercent":
          return {
            id,
            label: "残り時間（％）",
            value: `${Math.round(clampPercent(100 - progress))}%`,
          };
        case "keysPerSecond":
          return {
            id,
            label: "打鍵/秒",
            value: metrics.keysPerSecond.toFixed(2),
          };
        case "keysPerMinute":
          return {
            id,
            label: "打鍵/分",
            value: Math.round(metrics.keysPerSecond * 60).toLocaleString(),
          };
        case "kanaCharactersPerSecond":
          return {
            id,
            label: "かな文字/秒",
            value: metrics.kanaCharactersPerSecond.toFixed(2),
          };
        case "promptCharactersPerSecond":
          return mode.id === "production-ime-on"
            ? {
                id,
                label: "課題文字/秒",
                value: metrics.promptCharactersPerSecond.toFixed(2),
              }
            : null;
        case "accuracy":
          return {
            id,
            label: "正確率",
            value: `${(metrics.accuracy * 100).toFixed(1)}%`,
          };
        case "mistakes":
          return {
            id,
            label: "ミス数",
            value: stats.mistakes.toString(),
          };
        case "physicalKeystrokes":
          return {
            id,
            label: "物理打鍵",
            value: stats.physicalKeystrokes.toString(),
          };
        case "completedPrompts":
          return {
            id,
            label: "完了課題",
            value: stats.completedPrompts.toString(),
          };
        case "mistakeRate":
          return {
            id,
            label: "ミス/物理打鍵",
            value: <MetricSplitValue left={stats.mistakes} right={stats.physicalKeystrokes} />,
          };
        case "correctRate":
          return {
            id,
            label: "正解/物理打鍵",
            value: <MetricSplitValue left={stats.correctCharacters} right={stats.physicalKeystrokes} />,
          };
      }
    })
    .filter((metric) => metric !== null && metric !== undefined);
}

export function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

export function getSpeedMetric(keysPerSecond: number) {
  return {
    label: "打鍵/秒",
    value: keysPerSecond.toFixed(2),
  };
}

export function getDirectCorrectnessTiles(history: KeyStabilitySample[]): CorrectnessTile[] {
  return history.slice(-48).map((sample) => {
    const state = sample.kind === "correction" ? "correction" : sample.isCorrect ? "correct" : "wrong";
    const label = formatKeyLabel(sample.key);

    return {
      id: `direct-${sample.id}`,
      label,
      state,
      title: formatSampleTitle(sample),
    };
  });
}

export function getAverageAbsoluteDrift(history: KeyStabilitySample[], averageMs: number) {
  const intervals = history
    .map((sample) => sample.intervalMs)
    .filter((interval): interval is number => interval !== null);

  if (intervals.length === 0 || averageMs === 0) {
    return 0;
  }

  return intervals.reduce((sum, interval) => sum + Math.abs(interval - averageMs), 0) / intervals.length;
}

export function getStabilityBarClass(sample: KeyStabilitySample, averageMs: number) {
  if (!sample.isCorrect) {
    return css(styles, "stability-mini-bar wrong");
  }

  if (sample.kind === "correction") {
    return css(styles, "stability-mini-bar correction");
  }

  if (sample.intervalMs === null || averageMs === 0) {
    return css(styles, "stability-mini-bar neutral");
  }

  const ratio = sample.intervalMs / averageMs;
  if (ratio < 0.72) {
    return css(styles, "stability-mini-bar fast");
  }
  if (ratio > 1.42) {
    return css(styles, "stability-mini-bar slow");
  }
  return css(styles, "stability-mini-bar stable");
}

export function getBarHeight(intervalMs: number | null, averageMs: number) {
  if (intervalMs === null || averageMs === 0) {
    return 34;
  }

  return Math.max(16, Math.min(100, (intervalMs / averageMs) * 54));
}

export function formatKeyLabel(key: string) {
  if (key === " ") {
    return "SP";
  }

  if (key === "Backspace") {
    return "BS";
  }

  if (key.length > 2) {
    return "IME";
  }

  return key;
}

export function formatSampleTitle(sample: KeyStabilitySample) {
  const interval = sample.intervalMs === null ? "開始" : `${sample.intervalMs} ms`;
  const state = sample.kind === "correction" ? "修正" : sample.isCorrect ? "正打" : "ミス";
  return `${formatKeyLabel(sample.key)} / ${interval} / ${state}`;
}

export function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className={css(styles, "metric")}>
      <span>
        {icon}
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

export function MetricSplitValue({ left, right }: { left: number; right: number }) {
  return (
    <span className={css(styles, "metric-split-value")}>
      <span>{left.toLocaleString()}</span>
      <span>/</span>
      <span>{right.toLocaleString()}</span>
    </span>
  );
}
