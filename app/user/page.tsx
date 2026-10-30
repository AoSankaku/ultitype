"use client";

import { ArrowLeft, UserRound } from "lucide-react";
import { modes } from "@/src/lib/typing";
import { css } from "../_lib/css-module";
import { AppShell } from "../_components/AppShell";
import { RankBadgeCanvas } from "../_components/RankBadgeCanvas";
import { SelectSoundLink } from "../_components/SelectSoundLink";
import styles from "./UserPage.module.css";
import { translate } from "../_lib/i18n";
import { getModeSelectPath } from "../_lib/mode-routes";

export default function UserPage() {
  return (
    <AppShell className={css(styles, "user-page")}>
      {(session) => (
        <>
          <header className={css(styles, "user-page-head")}>
            <div>
              <div className={css(styles, "panel-heading")}>
                <UserRound size={18} />
                <span>{translate(session.settings.appLanguage, "User")}</span>
              </div>
                <h1>{translate(session.settings.appLanguage, "ローカルユーザー")}</h1>
              <p>{translate(session.settings.appLanguage, "Keybase連携は未設定です。")}</p>
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

          <section className={css(styles, "user-summary")} aria-label={translate(session.settings.appLanguage, "ユーザー概要")}>
            <div>
              <span>{translate(session.settings.appLanguage, "仮ランク")}</span>
              <RankBadgeCanvas
                className={css(styles, "user-summary-rank-canvas")}
                rank={session.bestPracticeRank.label}
              />
              <strong>{Math.round(session.bestPracticeScore).toLocaleString()}</strong>
            </div>
            <div>
              <span>{translate(session.settings.appLanguage, "本番ランク")}</span>
              <RankBadgeCanvas
                className={css(styles, "user-summary-rank-canvas")}
                rank={session.bestProductionRank.label}
              />
              <strong>{Math.round(session.bestProductionScore).toLocaleString()}</strong>
            </div>
          </section>

          <section className={css(styles, "user-sessions-panel")}>
            <div className={css(styles, "panel-heading")}>
              <UserRound size={18} />
              <span>{translate(session.settings.appLanguage, "Recent Sessions")}</span>
            </div>
            {session.sessions.length === 0 ? (
              <p className={css(styles, "empty")}>{translate(session.settings.appLanguage, "まだ保存されたセッションはありません。")}</p>
            ) : (
              <ol className={css(styles, "user-session-list")}>
                {session.sessions.map((storedSession) => (
                  <li key={`${storedSession.createdAt}-${storedSession.modeId}`}>
                    <RankBadgeCanvas
                      className={css(styles, "history-rank-canvas")}
                      height={32}
                      rank={storedSession.rank}
                      width={68}
                    />
                    <strong>{Math.round(storedSession.score).toLocaleString()}</strong>
                    <small>{translate(session.settings.appLanguage, modes.find((item) => item.id === storedSession.modeId)?.label ?? "")}</small>
                    <em>{translate(session.settings.appLanguage, storedSession.challengeLanguage === "en" ? "English" : "日本語")}</em>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
