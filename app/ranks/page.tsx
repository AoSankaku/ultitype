"use client";

import { ArrowLeft, Star } from "lucide-react";
import { css } from "../_lib/css-module";
import { AppShell } from "../_components/AppShell";
import { RankGuide } from "../_components/RankGuide";
import { SelectSoundLink } from "../_components/SelectSoundLink";
import { translate } from "../_lib/i18n";
import { getModeSelectPath } from "../_lib/mode-routes";
import styles from "./RanksPage.module.css";

export default function RanksPage() {
  return (
    <AppShell className={css(styles, "rank-guide-page")}>
      {(session) => (
        <>
          <header className={css(styles, "rank-guide-page-head")}>
            <div>
              <div className={css(styles, "panel-heading")}>
                <Star size={18} fill="currentColor" />
                <span>{translate(session.settings.appLanguage, "ランクガイド")}</span>
              </div>
                <h1>{translate(session.settings.appLanguage, "ランクガイド")}</h1>
              <p>
                {translate(session.settings.appLanguage, "500点未満はランクなし、500点から G0 が始まり、基準スコアはランクごとに90点ずつ上がります。")}
              </p>
            </div>
            <SelectSoundLink
              className={css(styles, "icon-link")}
              href={getModeSelectPath(session.challengeLanguage)}
              aria-label={translate(session.settings.appLanguage, "戻る")}
              soundKind="back"
              title={translate(session.settings.appLanguage, "戻る")}
            >
              <ArrowLeft size={20} />
            </SelectSoundLink>
          </header>
          <RankGuide />
        </>
      )}
    </AppShell>
  );
}
