"use client";

import { useSearchParams } from "next/navigation";
import type { ModeId } from "@/src/lib/typing";
import { parseProductionDurationParam } from "../_lib/mode-routes";
import type { ChallengeLanguage } from "../_lib/types";
import { ModePage } from "./ModePage";

type ProductionModePageViewProps = {
  challengeLanguage?: ChallengeLanguage;
  modeId: ModeId;
};

export function ProductionModePageView({
  challengeLanguage = "ja",
  modeId,
}: ProductionModePageViewProps) {
  const searchParams = useSearchParams();
  const productionDuration = parseProductionDurationParam(
    searchParams.get("duration") ?? undefined,
  );

  return (
    <ModePage
      challengeLanguage={challengeLanguage}
      modeId={modeId}
      productionDuration={productionDuration}
    />
  );
}
