import { describe, expect, test } from "bun:test";
import { challengeThemeIds } from "@/app/_lib/challenge-theme-schedule";
import { challengeThemes } from "./challenge-themes";

function displayLength(text: string) {
  return Array.from(text.replace(/[\r\n]/g, "")).length;
}

describe("Japanese challenge themes", () => {
  test("registers all eight requested themes followed by typing tips", () => {
    expect(challengeThemes.map(({ id }) => id)).toEqual([...challengeThemeIds]);
  });

  test("keeps displayed Arabic digits as the same literal input digits", () => {
    for (const theme of challengeThemes) {
      for (const challenge of [...theme.shortChallenges, ...theme.longChallenges]) {
        const displayedDigits = challenge.display.match(/[0-9]/g) ?? [];
        expect(challenge.reading?.match(/[0-9]/g) ?? []).toEqual(displayedDigits);
        expect(challenge.input.match(/[0-9]/g) ?? []).toEqual(displayedDigits);
      }
    }
  });

  test("provides forty unique 15-to-30-character short prompts per theme", () => {
    for (const theme of challengeThemes) {
      expect(theme.shortChallenges).toHaveLength(40);
      const displays = theme.shortChallenges.map(({ display }) => display);
      expect(new Set(displays).size).toBe(40);
      expect(displays.every((display) => displayLength(display) >= 15 && displayLength(display) <= 30))
        .toBe(true);
      expect(theme.shortChallenges.every(({ input, reading }) => Boolean(input && reading))).toBe(true);
    }
  });

  test("provides ten unique 300-to-600-character long prompts per theme", () => {
    for (const theme of challengeThemes) {
      expect(theme.longChallenges).toHaveLength(10);
      const displays = theme.longChallenges.map(({ display }) => display);
      expect(new Set(displays).size).toBe(10);
      expect(displays.every((display) => displayLength(display) >= 300 && displayLength(display) <= 600))
        .toBe(true);
      expect(theme.longChallenges.every(({ input, reading }) => Boolean(input && reading))).toBe(true);
    }
  });
});
