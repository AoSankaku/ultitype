"use client";

import { useRouter } from "next/navigation";
import type { ModeId } from "@/src/lib/typing";
import { getModeSelectPath } from "../_lib/mode-routes";
import type { ChallengeLanguage } from "../_lib/types";
import { AppShell } from "./AppShell";
import { TypingPanel } from "./TypingPanel";

type ModePageProps = {
  challengeLanguage?: ChallengeLanguage;
  modeId: ModeId;
};

export function ModePage({ challengeLanguage = "ja", modeId }: ModePageProps) {
  const router = useRouter();

  return (
    <AppShell
      key={`${modeId}-${challengeLanguage}`}
      sessionOptions={{
        initialChallengeLanguage: challengeLanguage,
        initialModeId: modeId,
        initialScreen: "typing",
      }}
    >
      {(session) => (
        <TypingPanel
          {...session.typingPanelProps}
          onBackToModeSelect={() => {
            router.push(getModeSelectPath(challengeLanguage));
          }}
        />
      )}
    </AppShell>
  );
}
