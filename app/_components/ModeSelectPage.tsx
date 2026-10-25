"use client";

import { AppShell } from "./AppShell";
import { ModeSelectScreen } from "./ModeSelectScreen";
import { productionDurations } from "../_lib/constants";
import type { ChallengeLanguage, ProductionDuration } from "../_lib/types";

type ModeSelectPageProps = {
  challengeLanguage?: ChallengeLanguage;
  productionDuration?: ProductionDuration;
};

export function ModeSelectPage({
  challengeLanguage = "ja",
  productionDuration,
}: ModeSelectPageProps) {
  return (
    <AppShell
      key={`${challengeLanguage}-${productionDuration ?? 300}`}
      sessionOptions={{
        initialChallengeLanguage: challengeLanguage,
        initialProductionDuration: productionDuration,
      }}
    >
      {(session) => (
        <ModeSelectScreen
          challengeLanguage={session.challengeLanguage}
          productionDuration={session.productionDuration}
          productionDurations={productionDurations}
          productionPlayableModes={session.productionPlayableModes}
          productionUnlocked={session.productionUnlocked}
          selectedChallengeThemeId={session.selectedChallengeThemeId}
          weeklyChallengeThemeId={session.weeklyChallengeThemeId}
          challengeThemeOverride={session.challengeThemeOverride}
          challengeThemeSelectorEnabled={session.challengeThemeSelectorEnabled}
          soundSettings={session.settings}
          onChangeChallengeLanguage={session.changeChallengeLanguage}
          onProductionDurationChange={session.setProductionDuration}
          onSelectChallengeTheme={session.selectChallengeTheme}
        />
      )}
    </AppShell>
  );
}
