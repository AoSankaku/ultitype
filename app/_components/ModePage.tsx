"use client";

import { useRouter } from "next/navigation";
import type { ModeId } from "@/src/lib/typing";
import { AppShell } from "./AppShell";
import { TypingPanel } from "./TypingPanel";

type ModePageProps = {
  modeId: ModeId;
};

export function ModePage({ modeId }: ModePageProps) {
  const router = useRouter();

  return (
    <AppShell sessionOptions={{ initialModeId: modeId, initialScreen: "typing" }}>
      {(session) => (
        <TypingPanel
          {...session.typingPanelProps}
          onBackToModeSelect={() => {
            router.push("/");
          }}
        />
      )}
    </AppShell>
  );
}
