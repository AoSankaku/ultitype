"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getRank,
  getRankProgression,
  modes,
  type RankProgressionItem,
} from "@/src/lib/typing";
import {
  formatRankGuideScore,
  getRankGuideStatusLabel,
  splitRankGuideColumns,
} from "../_lib/rank-guide";
import { css } from "../_lib/css-module";
import { cacheStoredState, getInitialStoredState, readStoredState } from "../_lib/stored-state";
import { getBrowserLocalStorage } from "../_lib/browser-storage";
import type { StoredState } from "../_lib/types";
import { RankBadgeCanvas } from "./RankBadgeCanvas";
import styles from "./RankGuide.module.css";

export function RankGuide() {
  const [stored, setStored] = useState<StoredState>(getInitialStoredState);

  useEffect(() => {
    const nextStored = readStoredState(getBrowserLocalStorage());
    cacheStoredState(nextStored);
    setStored(nextStored);
  }, []);

  const bestScore = Math.max(stored.bestPracticeScore, stored.bestProductionScore);
  const currentRank = getRank(bestScore);
  const progression = useMemo(() => getRankProgression(), []);
  const columns = useMemo(() => splitRankGuideColumns(progression), [progression]);

  return (
    <section className={css(styles, "rank-guide")} aria-label="ランク到達状況">
      <section className={css(styles, "score-guide")} aria-label="スコア計算式">
        <div className={css(styles, "score-formula")}>
          <span>基本のスコア計算式</span>
          <strong>打鍵/秒 × 1000 × 正確率^モード係数 × 補正</strong>
          <p>
            正確率は正しく入力した文字数 ÷ 入力を試みた文字数です。均等モードのみ、打鍵間隔の安定度が補正として加わります。
          </p>
        </div>
        <div className={css(styles, "practice-score-modes")}>
          {modes
            .filter((mode) => mode.group === "practice")
            .map((mode) => (
              <article className={css(styles, "practice-score-mode")} key={mode.id}>
                <span>{mode.shortLabel}</span>
                <strong>{mode.label}</strong>
                <dl>
                  <div>
                    <dt>正確率係数</dt>
                    <dd>{mode.accuracyExponent}</dd>
                  </div>
                  <div>
                    <dt>補正</dt>
                    <dd>{mode.id === "practice-flow" ? "安定度" : "なし"}</dd>
                  </div>
                </dl>
                <p>{mode.description}</p>
              </article>
            ))}
        </div>
      </section>

      <div className={css(styles, "rank-guide-summary")}>
        <div>
          <span>現在ランク</span>
          <RankBadgeCanvas
            className={css(styles, "rank-guide-current-canvas")}
            height={52}
            rank={currentRank.label}
            width={112}
          />
        </div>
        <div>
          <span>最高スコア</span>
          <strong>{formatRankGuideScore(bestScore)}</strong>
        </div>
        <div>
          <span>次の目標</span>
          <strong>
            {getNextTargetLabel(currentRank.level, currentRank.label, bestScore, progression)}
          </strong>
        </div>
      </div>

      <div className={css(styles, "rank-guide-columns")}>
        <RankGuideColumn
          bestScore={bestScore}
          currentRankLevel={currentRank.level}
          ranks={columns.standard}
          title="G0～S6"
        />
        <RankGuideColumn
          bestScore={bestScore}
          currentRankLevel={currentRank.level}
          ranks={columns.master}
          title="M0～"
        />
      </div>
    </section>
  );
}

function RankGuideColumn({
  bestScore,
  currentRankLevel,
  ranks,
  title,
}: {
  bestScore: number;
  currentRankLevel: number;
  ranks: RankProgressionItem[];
  title: string;
}) {
  return (
    <section className={css(styles, "rank-guide-column")} aria-label={`${title} ランク`}>
      <h2>{title}</h2>
      <div className={css(styles, "rank-guide-table-head")} aria-hidden="true">
        <span>ランク帯</span>
        <span>基準スコア</span>
        <span>到達状況</span>
      </div>
      <ol className={css(styles, "rank-guide-list")}>
        {ranks.map((rank) => {
          const reached = currentRankLevel >= rank.level;
          const current = currentRankLevel === rank.level;

          return (
            <li
              className={css(styles, "rank-guide-row", reached ? "reached" : "", current ? "current" : "")}
              key={rank.label}
            >
              <span className={css(styles, "rank-guide-band")}>
                <RankBadgeCanvas
                  className={css(styles, "rank-guide-band-canvas")}
                  height={34}
                  rank={rank.label}
                  width={72}
                />
                <small>{rank.colorName}</small>
              </span>
              <span className={css(styles, "rank-guide-score")}>
                {formatRankGuideScore(rank.requiredScore)}
              </span>
              <span className={css(styles, "rank-guide-state")}>
                {reached ? "達成" : getRankGuideStatusLabel(rank.requiredScore, bestScore)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function getNextTargetLabel(
  currentRankLevel: number,
  currentRankLabel: string,
  currentScore: number,
  progression: RankProgressionItem[],
) {
  const next = progression.find((rank) => rank.level > currentRankLevel);
  if (!next) {
    return currentRankLabel;
  }

  return `${next.label} あと ${formatRankGuideScore(next.requiredScore - currentScore)}`;
}
