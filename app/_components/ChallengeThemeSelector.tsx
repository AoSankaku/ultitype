"use client";

import { challengeThemes } from "@/src/lib/challenge-themes";
import { isChallengeThemeId, type ChallengeThemeId } from "../_lib/challenge-theme-schedule";
import { css } from "../_lib/css-module";
import styles from "./ChallengeThemeSelector.module.css";

type ChallengeThemeSelectorProps = {
  isDevelopment: boolean;
  isThemeOverride: boolean;
  selectedThemeId: ChallengeThemeId;
  weeklyThemeId: ChallengeThemeId;
  onSelectTheme: (themeId: ChallengeThemeId | null) => void;
};

export function ChallengeThemeSelector({
  isDevelopment,
  isThemeOverride,
  selectedThemeId,
  weeklyThemeId,
  onSelectTheme,
}: ChallengeThemeSelectorProps) {
  const selectedTheme = challengeThemes.find((theme) => theme.id === selectedThemeId);
  const weeklyTheme = challengeThemes.find((theme) => theme.id === weeklyThemeId);

  if (!isDevelopment) {
    return (
      <p className={css(styles, "weeklyTheme")}>
        今週のテーマ：<strong>{weeklyTheme?.label ?? "タイピングのコツ"}</strong>
        <span>（日本時間・毎週月曜6時に更新）</span>
      </p>
    );
  }

  return (
    <div className={css(styles, "themeSelector")}>
      <label className={css(styles, "themeLabel")}>
        課題テーマ
        <select
          className={css(styles, "themeSelect")}
          onChange={(event) => {
            const value = event.currentTarget.value;
            onSelectTheme(isChallengeThemeId(value) ? value : null);
          }}
          value={isThemeOverride ? selectedThemeId : "auto"}
        >
          <option value="auto">自動（日本時間・毎週月曜6時）</option>
          {challengeThemes.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}{weeklyThemeId === id ? "（今週）" : ""}
            </option>
          ))}
        </select>
      </label>
      <p aria-live="polite">
        {isThemeOverride ? `選択中：${selectedTheme?.label ?? "タイピングのコツ"}` :
          `今週のテーマ：${weeklyTheme?.label ?? "タイピングのコツ"}`}
      </p>
    </div>
  );
}
