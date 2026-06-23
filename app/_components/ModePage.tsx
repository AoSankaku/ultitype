"use client";

import { useRouter } from "next/navigation";
import type { ModeId } from "@/src/lib/typing";
import { getModeSelectPath } from "../_lib/mode-routes";
import type { ChallengeLanguage, ProductionDuration } from "../_lib/types";
import { AppShell } from "./AppShell";
import { TypingPanel } from "./TypingPanel";

type ModePageProps = {
  challengeLanguage?: ChallengeLanguage;
  modeId: ModeId;
  productionDuration?: ProductionDuration;
};

export function ModePage({
  challengeLanguage = "ja",
  modeId,
  productionDuration,
}: ModePageProps) {
  const router = useRouter();

  return (
    <AppShell
      key={`${modeId}-${challengeLanguage}-${productionDuration ?? 300}`}
      sessionOptions={{
        initialChallengeLanguage: challengeLanguage,
        initialModeId: modeId,
        initialProductionDuration: productionDuration,
        initialScreen: "typing",
      }}
    >
      {(session) => (
        <TypingPanel
          {...session.typingPanelProps}
          onBackToModeSelect={() => {
            router.push(getModeSelectPath(challengeLanguage, productionDuration));
          }}
        />
      )}
    </AppShell>
  );
}
