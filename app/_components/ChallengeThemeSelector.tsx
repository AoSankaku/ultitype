"use client";

import { challengeThemes } from "@/src/lib/challenge-themes";
import { isChallengeThemeId, type ChallengeThemeId } from "../_lib/challenge-theme-schedule";
import { css } from "../_lib/css-module";
import { useI18n } from "../_lib/i18n";
import { getThemeLabel, getThemeOptionLabel } from "../_lib/theme-labels";
import type { ChallengeLanguage } from "../_lib/types";
import styles from "./ChallengeThemeSelector.module.css";

type ChallengeThemeSelectorProps = {
  challengeLanguage?: ChallengeLanguage;
  isDevelopment: boolean;
  isThemeOverride: boolean;
  selectedThemeId: ChallengeThemeId;
  weeklyThemeId: ChallengeThemeId;
  onSelectTheme: (themeId: ChallengeThemeId | null) => void;
};

export function ChallengeThemeSelector({
  challengeLanguage = "ja",
  isDevelopment,
  isThemeOverride,
  selectedThemeId,
  weeklyThemeId,
  onSelectTheme,
}: ChallengeThemeSelectorProps) {
  const { language, t } = useI18n();
  const selectedTheme = challengeThemes.find((theme) => theme.id === selectedThemeId);
  const weeklyTheme = challengeThemes.find((theme) => theme.id === weeklyThemeId);

  if (challengeLanguage === "en") {
    return (
      <div className={css(styles, "themeSelector")}>
        <label className={css(styles, "themeLabel")}>
          {t("課題テーマ")}
          <select aria-label={t("課題テーマ")} className={css(styles, "themeSelect")} value="typing-tips" disabled>
            <option value="typing-tips">{t("タイピングのコツ")}</option>
          </select>
        </label>
      </div>
    );
  }

  if (!isDevelopment) {
    return (
      <p className={css(styles, "weeklyTheme")}>
        {t("今週のテーマ：")}<strong>{getThemeLabel(weeklyTheme, language)}</strong>
        <span>{t("（日本時間・毎週月曜6時に更新）")}</span>
      </p>
    );
  }

  return (
    <div className={css(styles, "themeSelector")}>
      <label className={css(styles, "themeLabel")}>
        {t("課題テーマ")}
        <select
          aria-label={t("課題テーマ")}
          className={css(styles, "themeSelect")}
          onChange={(event) => {
            const value = event.currentTarget.value;
            onSelectTheme(isChallengeThemeId(value) ? value : null);
          }}
          value={isThemeOverride ? selectedThemeId : "auto"}
        >
          <option value="auto">{t("自動（日本時間・毎週月曜6時）")}</option>
          {challengeThemes.map(({ id, label }) => (
            <option key={id} value={id}>
              {getThemeOptionLabel({ id, label }, language)}{weeklyThemeId === id ? t("（今週）") : ""}
            </option>
          ))}
        </select>
      </label>
      <p aria-live="polite">
        {t(isThemeOverride ? "選択中：{theme}" : "今週のテーマ：{theme}", {
          theme: getThemeLabel(isThemeOverride ? selectedTheme : weeklyTheme, language),
        })}
      </p>
    </div>
  );
}
