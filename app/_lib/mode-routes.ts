import type { ModeId, ModeGroup } from "@/src/lib/typing";
import type { ChallengeLanguage, ProductionDuration } from "./types";

type ModeRoute = {
  group: ModeGroup;
  mode: string;
  modeId: ModeId;
  path: string;
};

export const modeRoutes = [
  {
    group: "practice",
    mode: "accuracy",
    modeId: "practice-accuracy",
    path: "/practice/accuracy",
  },
  {
    group: "practice",
    mode: "flow",
    modeId: "practice-flow",
    path: "/practice/flow",
  },
  {
    group: "practice",
    mode: "speed",
    modeId: "practice-speed",
    path: "/practice/speed",
  },
  {
    group: "production",
    mode: "ime-off",
    modeId: "production-ime-off",
    path: "/production/ime-off",
  },
  {
    group: "production",
    mode: "ime-on",
    modeId: "production-ime-on",
    path: "/production/ime-on",
  },
] as const satisfies readonly ModeRoute[];

const defaultProductionDuration = 300 satisfies ProductionDuration;
const supportedProductionDurations = new Set<ProductionDuration>([300, 600]);

export function getModePath(
  modeId: ModeId,
  language: ChallengeLanguage = "ja",
  productionDuration?: ProductionDuration,
): string {
  const path = modeRoutes.find((route) => route.modeId === modeId)?.path ?? "/";
  const localizedPath = language === "en" && path !== "/" ? `/en${path}` : path;
  const route = modeRoutes.find((item) => item.modeId === modeId);

  if (
    route?.group !== "production" ||
    productionDuration === undefined ||
    productionDuration === defaultProductionDuration
  ) {
    return localizedPath;
  }

  return `${localizedPath}?duration=${productionDuration}`;
}

export function getModeSelectPath(
  language: ChallengeLanguage = "ja",
  productionDuration?: ProductionDuration,
): string {
  const path = language === "en" ? "/en" : "/";

  return productionDuration === undefined || productionDuration === defaultProductionDuration
    ? path
    : `${path}?duration=${productionDuration}`;
}

export function getRouteModeId(group: string, mode: string): ModeId | null {
  return (
    modeRoutes.find((route) => route.group === group && route.mode === mode)?.modeId ?? null
  );
}

export function getRouteParams(group: ModeGroup) {
  return modeRoutes
    .filter((route) => route.group === group)
    .map((route) => ({
      mode: route.mode,
    }));
}

export function parseProductionDurationParam(
  value: string | string[] | undefined,
): ProductionDuration {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(rawValue ?? "", 10);

  return supportedProductionDurations.has(parsed as ProductionDuration)
    ? (parsed as ProductionDuration)
    : defaultProductionDuration;
}
