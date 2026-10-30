"use client";

import type { ReactNode } from "react";
import { cx, css } from "../_lib/css-module";
import { AppHeader } from "./AppHeader";
import { MobileViewportWarning } from "./MobileViewportWarning";
import styles from "./AppShell.module.css";
import {
  type UseTypingSessionOptions,
  useTypingSession,
} from "../_lib/useTypingSession";
import { LocaleProvider } from "../_lib/i18n";

type AppShellProps = {
  children: (session: ReturnType<typeof useTypingSession>) => ReactNode;
  className?: string;
  sessionOptions?: UseTypingSessionOptions;
};

export function AppShell({ children, className, sessionOptions }: AppShellProps) {
  const session = useTypingSession(sessionOptions);

  return (
    <LocaleProvider language={session.settings.appLanguage} ready={session.settingsReady}>
      <main data-app-shell className={cx(css(styles, "shell"), className)}>
        <AppHeader
          bestPracticeRank={session.bestPracticeRank}
          bestPracticeScore={session.bestPracticeScore}
          bestProductionRank={session.bestProductionRank}
          bestProductionScore={session.bestProductionScore}
          soundSettings={session.settings}
        />
        <MobileViewportWarning />
        {children(session)}
      </main>
    </LocaleProvider>
  );
}
