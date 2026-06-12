import type { ModeId, ModeGroup } from "@/src/lib/typing";
import type { ChallengeLanguage } from "./types";

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

export function getModePath(modeId: ModeId, language: ChallengeLanguage = "ja"): string {
  const path = modeRoutes.find((route) => route.modeId === modeId)?.path ?? "/";

  return language === "en" && path !== "/" ? `/en${path}` : path;
}

export function getModeSelectPath(language: ChallengeLanguage = "ja"): string {
  return language === "en" ? "/en" : "/";
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
