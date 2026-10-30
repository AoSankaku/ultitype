"use client";

import { Settings, Star, UserRound } from "lucide-react";
import type { Rank } from "@/src/lib/typing";
import { css } from "../_lib/css-module";
import { useI18n } from "../_lib/i18n";
import type { SoundSettings } from "../_lib/typing-sounds";
import { APP_VERSION_LABEL } from "../_lib/version";
import { RankBadgeCanvas } from "./RankBadgeCanvas";
import { SelectSoundLink } from "./SelectSoundLink";
import styles from "./AppHeader.module.css";

type AppHeaderProps = {
  bestPracticeRank: Rank;
  bestPracticeScore: number;
  bestProductionRank: Rank;
  bestProductionScore: number;
  soundSettings: SoundSettings;
};

export function AppHeader({
  bestPracticeRank,
  bestPracticeScore,
  bestProductionRank,
  bestProductionScore,
  soundSettings,
}: AppHeaderProps) {
  const { t } = useI18n();
  const bestOverallRank =
    bestProductionScore > bestPracticeScore ? bestProductionRank : bestPracticeRank;

  return (
    <header className={css(styles, "app-header")} aria-label={t("UltiType header")}>
      <div className={css(styles, "brand-block")}>
        <div className={css(styles, "brand-title")}>
          <h1>UltiType</h1>
          <span className={css(styles, "app-version")}>{APP_VERSION_LABEL}</span>
        </div>
        <p>{t("Typing practice and rating")}</p>
      </div>
      <div className={css(styles, "header-status")}>
        <div className={css(styles, "rank-strip")} aria-label={t("saved ratings")}>
          <RankBadge label={t("仮")} rank={bestPracticeRank.label} score={bestPracticeScore} />
          <RankBadge label={t("本")} rank={bestProductionRank.label} score={bestProductionScore} />
        </div>
        <div className={css(styles, "header-actions")} aria-label={t("settings")}>
          <SelectSoundLink
            aria-label={t("ランクガイド（現在 {rank}）", { rank: bestOverallRank.label })}
            className={css(styles, "rank-guide-link")}
            href="/ranks"
            soundSettings={soundSettings}
            title={t("ランクガイド")}
          >
            <Star size={18} fill="currentColor" />
            <RankBadgeCanvas
              className={css(styles, "rank-link-canvas")}
              height={28}
              rank={bestOverallRank.label}
              width={58}
            />
          </SelectSoundLink>
          <SelectSoundLink
            aria-label={t("ユーザー")}
            className={css(styles, "settings-button")}
            href="/user"
            soundSettings={soundSettings}
            title={t("ユーザー")}
          >
            <UserRound size={18} />
          </SelectSoundLink>
          <SelectSoundLink
            aria-label={t("設定")}
            className={css(styles, "settings-button")}
            href="/settings"
            soundSettings={soundSettings}
            title={t("設定")}
          >
            <Settings size={18} />
          </SelectSoundLink>
        </div>
      </div>
    </header>
  );
}

function RankBadge({ label, rank, score }: { label: string; rank: string; score: number }) {
  return (
    <div className={css(styles, "rank-badge")}>
      <span>{label}</span>
      <RankBadgeCanvas className={css(styles, "rank-badge-canvas")} rank={rank} />
      <small>{Math.round(score).toLocaleString()}</small>
    </div>
  );
}
