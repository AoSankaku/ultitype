import { describe, expect, test } from "bun:test";
import {
  directShortChallenges,
  englishDirectLongChallenges,
  englishDirectShortChallenges,
} from "./challenges";

describe("direct short challenges", () => {
  test("show Japanese prompts and do not leak generated control labels", () => {
    expect(directShortChallenges).toHaveLength(50);
    expect(directShortChallenges[0].display).toContain("解析結果");
    expect(directShortChallenges[0].guide).toContain(" ");
    expect(directShortChallenges[0].input).not.toContain(" ");
    expect(directShortChallenges.some((challenge) => challenge.display.includes("control set"))).toBe(
      false,
    );
    expect(directShortChallenges.some((challenge) => challenge.input.includes("control set"))).toBe(
      false,
    );
  });
});

describe("English challenges", () => {
  test("provide direct English prompts without generated control labels", () => {
    expect(englishDirectShortChallenges).toHaveLength(50);
    expect(englishDirectLongChallenges).toHaveLength(20);
    expect(englishDirectShortChallenges[0].display).toBe(englishDirectShortChallenges[0].input);
    expect(
      englishDirectShortChallenges.some((challenge) => challenge.display.includes("control set")),
    ).toBe(false);
  });
});
