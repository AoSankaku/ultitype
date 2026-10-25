export const challengeThemeIds = [
  "english-learning",
  "fish-types",
  "conveyor-sushi",
  "luxury-sushi",
  "ramen-history",
  "ramen-types",
  "music-genres",
  "commuter-trains",
  "typing-tips",
] as const;

export type ChallengeThemeId = (typeof challengeThemeIds)[number];

const themeIdSet = new Set<string>(challengeThemeIds);
const weekMilliseconds = 7 * 24 * 60 * 60 * 1000;
const japanOffsetMilliseconds = 9 * 60 * 60 * 1000;
export const firstWeeklyThemeAt = new Date("2026-10-26T06:00:00+09:00");

export function isChallengeThemeId(value: unknown): value is ChallengeThemeId {
  return typeof value === "string" && themeIdSet.has(value);
}

export function canApplyChallengeTheme(language: "ja" | "en", hasStartedSession: boolean) {
  return language === "ja" && !hasStartedSession;
}

function positiveModulo(value: number, modulus: number) {
  return ((value % modulus) + modulus) % modulus;
}

export function getWeeklyChallengeThemeId(date: Date): ChallengeThemeId {
  const weeksSinceAnchor = Math.floor((date.getTime() - firstWeeklyThemeAt.getTime()) / weekMilliseconds);
  const index = positiveModulo(weeksSinceAnchor, challengeThemeIds.length);

  return challengeThemeIds[index] ?? "typing-tips";
}

export function getNextThemeChangeAt(date: Date): Date {
  const japanDate = new Date(date.getTime() + japanOffsetMilliseconds);
  const dayOfWeek = japanDate.getUTCDay();
  const daysUntilMonday = (8 - dayOfWeek) % 7;
  const targetDayOffset = daysUntilMonday === 0 && japanDate.getUTCHours() >= 6
    ? 7
    : daysUntilMonday;
  const targetUtc = Date.UTC(
    japanDate.getUTCFullYear(),
    japanDate.getUTCMonth(),
    japanDate.getUTCDate() + targetDayOffset,
    6,
  );
  const target = new Date(targetUtc - japanOffsetMilliseconds);

  if (target <= date) {
    return new Date(target.getTime() + weekMilliseconds);
  }

  return target;
}
