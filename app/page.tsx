"use client";

import { AppShell } from "./_components/AppShell";
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
        </>
      )}
    </AppShell>
  );
}
