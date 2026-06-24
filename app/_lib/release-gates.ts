import type { ModeId } from "@/src/lib/typing";

export const ALPHA_PRODUCTION_LOCK_MESSAGE =
  "Alpha版では本番モードは開発中のためプレイできません。";

export type ProductionModeId = Extract<ModeId, "production-ime-off" | "production-ime-on">;

export type ProductionModePlayability = Record<ProductionModeId, boolean>;

const productionBuildPlayableModeIds = new Set<ProductionModeId>([
  "production-ime-off",
  "production-ime-on",
]);

export function isProductionModePlayableInBuild({
  modeId,
  nodeEnv = process.env.NODE_ENV,
}: {
  modeId: ProductionModeId;
  nodeEnv?: string;
}) {
  return (
    nodeEnv === "development" ||
    (nodeEnv === "production" && productionBuildPlayableModeIds.has(modeId))
  );
}

export function canPlayProductionMode({
  modeId,
  nodeEnv = process.env.NODE_ENV,
  unlocked,
}: {
  modeId: ProductionModeId;
  nodeEnv?: string;
  unlocked: boolean;
}) {
  return unlocked && isProductionModePlayableInBuild({ modeId, nodeEnv });
}

export const PRODUCTION_MODE_PLAYABILITY = {
  "production-ime-off": isProductionModePlayableInBuild({ modeId: "production-ime-off" }),
  "production-ime-on": isProductionModePlayableInBuild({ modeId: "production-ime-on" }),
} satisfies ProductionModePlayability;
