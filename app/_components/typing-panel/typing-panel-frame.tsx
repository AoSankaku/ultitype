"use client";

import { ArrowLeft, CheckCircle2, Lock, RotateCcw, Timer, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { css } from "../../_lib/css-module";
import styles from "../TypingPanel.module.css";
import { Metric } from "./session-summary";

type TopDisplayMetric = {
  id: string;
  label: string;
  value: ReactNode;
};

type VisibleRank = {
  isConcealed: boolean;
  label: string;
};

export function TypingPanelMeters({
  progress,
  topDisplayMetrics,
}: {
  progress: number;
  topDisplayMetrics: TopDisplayMetric[];
}) {
  return (
    <>
      <div className={css(styles, "meter-row")}>
        {topDisplayMetrics.map((metric) => (
          <Metric
            icon={metric.id === "remainingTime" ? <Timer size={17} /> : undefined}
            key={metric.id}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>

      <div className={css(styles, "progress-track")} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
    </>
  );
}

export function TypingPanelHeader({
  PrepareActionIcon,
  SessionModeIcon,
  onBackToModeSelect,
  onPrepareSession,
  onResetSession,
  scoreLabel,
  visibleModeLabel,
  visiblePrepareActionTitle,
  visibleRank,
}: {
  PrepareActionIcon: LucideIcon;
  SessionModeIcon: LucideIcon | null;
  onBackToModeSelect: () => void;
  onPrepareSession: () => void;
  onResetSession: () => void;
  scoreLabel: string;
  visibleModeLabel: string;
  visiblePrepareActionTitle: string;
  visibleRank: VisibleRank;
}) {
  return (
    <div className={css(styles, "session-head")}>
      <div>
        <p className={css(styles, "mode-label")}>{visibleModeLabel}</p>
        <h2 className={css(styles, "session-title")}>
          {SessionModeIcon ? (
            <span className={css(styles, "session-mode-symbol")} aria-label={visibleModeLabel}>
              <SessionModeIcon size={72} strokeWidth={1.6} aria-hidden="true" />
            </span>
          ) : null}
          <span
            aria-label={visibleRank.isConcealed ? "Rank hidden for the first 30 seconds" : undefined}
            className={css(styles, "session-rank-value", visibleRank.isConcealed ? "concealed" : "")}
          >
            {visibleRank.label}
          </span>
          <span>{scoreLabel}</span>
        </h2>
      </div>
      <div className={css(styles, "actions")}>
        <button
          className={css(styles, "icon-button")}
          onClick={onBackToModeSelect}
          title="モード選択"
          type="button"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          className={css(styles, "icon-button primary")}
          onClick={onPrepareSession}
          title={visiblePrepareActionTitle}
          type="button"
        >
          <PrepareActionIcon size={18} />
        </button>
        <button
          className={css(styles, "icon-button")}
          onClick={onResetSession}
          title="リセット"
          type="button"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}

export function LockedPanel({ productionBlockReason }: { productionBlockReason: string }) {
  return (
    <div className={css(styles, "locked-panel")}>
      <Lock size={28} />
      <p>{productionBlockReason}</p>
    </div>
  );
}

export function TypingPanelResultBand({
  currentRankLabel,
  finishReason,
  scoreLabel,
}: {
  currentRankLabel: string;
  finishReason: string | null;
  scoreLabel: string;
}) {
  if (!finishReason) {
    return null;
  }

  return (
    <div className={css(styles, "result-band", finishReason === "retired" ? "retired" : "")}>
      <CheckCircle2 size={20} />
      <span>
        {finishReason === "retired"
          ? "無入力が続いたためリタイアしました"
          : `セッション終了: ${currentRankLabel} / ${scoreLabel}`}
      </span>
    </div>
  );
}
