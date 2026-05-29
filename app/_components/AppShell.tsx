"use client";

import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { useTypingSession } from "../_lib/useTypingSession";

type AppShellProps = {
  children: (session: ReturnType<typeof useTypingSession>) => ReactNode;
  className?: string;
};

export function AppShell({ children, className = "shell" }: AppShellProps) {
  const session = useTypingSession();

  return (
    <main className={className}>
      <AppHeader
        bestPracticeRank={session.bestPracticeRank}
        bestPracticeScore={session.bestPracticeScore}
        bestProductionRank={session.bestProductionRank}
        bestProductionScore={session.bestProductionScore}
        challengeLanguage={session.challengeLanguage}
        soundSettings={session.settings}
        onChangeChallengeLanguage={session.changeChallengeLanguage}
      />
      {children(session)}
    </main>
  );
}
