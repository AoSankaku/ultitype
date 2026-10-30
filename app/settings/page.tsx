"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "../_components/AppShell";
import { SettingsScreen } from "../_components/SettingsScreen";
import { getModeSelectPath } from "../_lib/mode-routes";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <AppShell>
      {(session) => (
        <SettingsScreen
          onBack={() => router.push(getModeSelectPath(session.challengeLanguage))}
          onChange={session.updateSettings}
          onClearLocalData={session.clearLocalData}
          settings={session.settings}
        />
      )}
    </AppShell>
  );
}
