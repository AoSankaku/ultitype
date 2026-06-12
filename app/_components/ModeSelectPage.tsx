"use client";

import { AppShell } from "./AppShell";
import { ModeSelectScreen } from "./ModeSelectScreen";
import { productionDurations } from "../_lib/constants";
import type { ChallengeLanguage } from "../_lib/types";

type ModeSelectPageProps = {
  challengeLanguage?: ChallengeLanguage;
};

export function ModeSelectPage({ challengeLanguage = "ja" }: ModeSelectPageProps) {
  return (
    <AppShell sessionOptions={{ initialChallengeLanguage: challengeLanguage }}>
      {(session) => (
        <ModeSelectScreen
          challengeLanguage={session.challengeLanguage}
          productionDuration={session.productionDuration}
          productionDurations={productionDurations}
          productionPlayableModes={session.productionPlayableModes}
          productionUnlocked={session.productionUnlocked}
          soundSettings={session.settings}
          onChangeChallengeLanguage={session.changeChallengeLanguage}
          onProductionDurationChange={session.setProductionDuration}
        />
      )}
    </AppShell>
  );
}
