"use client";

import { AppShell } from "./_components/AppShell";
import { LowerStats } from "./_components/LowerStats";
import { ModeSelectScreen } from "./_components/ModeSelectScreen";
import { TypingPanel } from "./_components/TypingPanel";
import { productionDurations } from "./_lib/constants";

export default function Home() {
  return (
    <AppShell>
      {(session) => (
        <>
          {session.screen === "mode-select" ? (
            <ModeSelectScreen
              productionDuration={session.productionDuration}
              productionDurations={productionDurations}
              productionUnlocked={session.productionUnlocked}
              soundSettings={session.settings}
              onProductionDurationChange={session.setProductionDuration}
              onSelectMode={session.selectMode}
            />
          ) : (
            <TypingPanel {...session.typingPanelProps} />
          )}

          {session.screen === "typing" ? (
            <LowerStats
              currentAccuracy={session.currentAccuracy}
              metrics={session.metrics}
              sessions={session.sessions}
              stats={session.stats}
            />
          ) : null}
        </>
      )}
    </AppShell>
  );
}
