"use client";

import { useSearchParams } from "next/navigation";
import { parseProductionDurationParam } from "../_lib/mode-routes";
import type { ChallengeLanguage } from "../_lib/types";
import { ModeSelectPage } from "./ModeSelectPage";

type ModeSelectPageViewProps = {
  challengeLanguage?: ChallengeLanguage;
};

export function ModeSelectPageView({
  challengeLanguage = "ja",
}: ModeSelectPageViewProps) {
  const searchParams = useSearchParams();
  const productionDuration = parseProductionDurationParam(
    searchParams.get("duration") ?? undefined,
  );

  return (
    <ModeSelectPage
      challengeLanguage={challengeLanguage}
      productionDuration={productionDuration}
    />
  );
}
