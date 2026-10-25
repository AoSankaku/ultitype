import { describe, expect, test } from "bun:test";
import {
  challengeThemeIds,
  canApplyChallengeTheme,
  getNextThemeChangeAt,
  getWeeklyChallengeThemeId,
  isChallengeThemeId,
} from "./challenge-theme-schedule";

describe("weekly challenge theme schedule", () => {
  test("starts the new theme at Monday 06:00 JST and changes exactly weekly", () => {
    expect(getWeeklyChallengeThemeId(new Date("2026-10-26T05:59:59+09:00"))).toBe("typing-tips");
    expect(getWeeklyChallengeThemeId(new Date("2026-10-26T06:00:00+09:00"))).toBe(
      "english-learning",
    );
    expect(getWeeklyChallengeThemeId(new Date("2026-11-02T06:00:00+09:00"))).toBe("fish-types");
  });

  test("has the same result on clients in different time zones", () => {
    expect(getWeeklyChallengeThemeId(new Date("2026-11-01T21:00:00Z"))).toBe("fish-types");
    expect(getWeeklyChallengeThemeId(new Date("2026-11-02T06:00:00+09:00"))).toBe("fish-types");
  });

  test("cycles through every theme and wraps back to the first theme", () => {
    const firstMonday = Date.parse("2026-10-26T06:00:00+09:00");
    const weeklyThemeIds = challengeThemeIds.map((_, index) =>
      getWeeklyChallengeThemeId(new Date(firstMonday + index * 7 * 24 * 60 * 60 * 1000)),
    );

    expect(weeklyThemeIds).toEqual([...challengeThemeIds]);
    expect(getWeeklyChallengeThemeId(new Date(firstMonday + challengeThemeIds.length * 7 * 24 * 60 * 60 * 1000))).toBe(
      "english-learning",
    );
  });

  test("reports the next local Monday at 06:00", () => {
    expect(getNextThemeChangeAt(new Date("2026-10-26T05:59:00+09:00")).toISOString()).toBe(
      "2026-10-25T21:00:00.000Z",
    );
    expect(getNextThemeChangeAt(new Date("2026-10-26T06:00:00+09:00")).toISOString()).toBe(
      "2026-11-01T21:00:00.000Z",
    );
  });

  test("rejects unknown persisted theme identifiers", () => {
    expect(isChallengeThemeId("ramen-types")).toBe(true);
    expect(isChallengeThemeId("missing-theme")).toBe(false);
    expect(isChallengeThemeId(null)).toBe(false);
  });

  test("never changes the chosen challenge set during a running or English session", () => {
    expect(canApplyChallengeTheme("ja", false)).toBe(true);
    expect(canApplyChallengeTheme("ja", true)).toBe(false);
    expect(canApplyChallengeTheme("en", false)).toBe(false);
  });
});
