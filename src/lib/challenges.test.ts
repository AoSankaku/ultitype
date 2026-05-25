import { describe, expect, test } from "bun:test";
import {
  directLongChallenges,
  directShortChallenges,
  englishDirectLongChallenges,
  englishDirectShortChallenges,
  parseEnglishChallengeText,
  parseJapaneseChallengeText,
} from "./challenges";

describe("plain text challenge data", () => {
  test("parses English challenges as one sentence per line", () => {
    expect(parseEnglishChallengeText("Alpha line.\n\nBeta line.\n")).toEqual([
      "Alpha line.",
      "Beta line.",
    ]);
  });

  test("parses Japanese challenges as display text and hiragana reading per line", () => {
    expect(parseJapaneseChallengeText("解析結果を見る。\tかいせきけっかをみる。\n")).toEqual([
      {
        display: "解析結果を見る。",
        reading: "かいせきけっかをみる。",
      },
    ]);
  });
});

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

describe("direct Japanese challenge romaji", () => {
  test("maps づ to du instead of zu", () => {
    expect(directLongChallenges.some((challenge) => challenge.guide?.includes("tsudukereba"))).toBe(
      true,
    );
    expect(directLongChallenges.some((challenge) => challenge.guide?.includes("tsuzukereba"))).toBe(
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
