import { describe, expect, test } from "bun:test";
import {
  createRomajiInputTarget,
  getRomajiInputProgress,
  type RomajiInputConfig,
} from "./typing";

const defaultConfig: RomajiInputConfig = {
  preset: "hepburn",
  selections: {},
};

function expectCachedProgressToMatchFreshTarget(
  source: string,
  config: RomajiInputConfig,
  inputs: string[],
) {
  const cachedTarget = createRomajiInputTarget(source, config);

  for (const input of inputs) {
    const typedInput = input.replace(/\s/g, "");
    const cached = getRomajiInputProgress(cachedTarget, typedInput);
    const fresh = getRomajiInputProgress(createRomajiInputTarget(source, config), typedInput);
    expect(cached).toEqual(fresh);
  }
  expect(getRomajiInputProgress(cachedTarget, cachedTarget.guide.replace(/\s/g, "")).completed)
    .toBe(true);
}

describe("Romaji input progress cache", () => {
  test("matches fresh parsing while input is appended, corrected, replaced, or rejected", () => {
    expectCachedProgressToMatchFreshTarget("kya shi kanji", {
      ...defaultConfig,
      allowSplitYoon: true,
    }, [
      "",
      "k",
      "ky",
      "kya",
      "kya ",
      "kya s",
      "kya sh",
      "kya shi",
      "kya sh",
      "kya si",
      "kya siX",
      "kya shi k",
      "kya shi ka",
      "kya shi kan",
      "kya shi kanj",
      "kya shi kanji",
      "kya shi kanj",
      "kya shi kX",
    ]);
  });

  test("keeps exact じ and ぢ alternatives distinct with custom selections", () => {
    const jiConfig: RomajiInputConfig = {
      preset: "custom",
      selections: { ji: { accepted: ["ji"], preferred: "ji" } },
    };
    const dhiConfig: RomajiInputConfig = {
      preset: "custom",
      selections: {},
      specialPreset: "custom",
      specialSelections: {
        dhi: { accepted: ["dhi", "di"], preferred: "dhi" },
      },
    };

    expect(getRomajiInputProgress(createRomajiInputTarget("ji", jiConfig), "ji").completed).toBe(true);
    expect(getRomajiInputProgress(createRomajiInputTarget("ji", jiConfig), "di").accepted).toBe(false);
    expect(getRomajiInputProgress(createRomajiInputTarget("dhi", dhiConfig), "di").completed).toBe(true);

    expectCachedProgressToMatchFreshTarget("ji", jiConfig, ["j", "ji", "j", "d", "di", "ji"]);
    expectCachedProgressToMatchFreshTarget("dhi", dhiConfig, ["d", "dh", "dhi", "di", "d", "di"]);
  });

  test("matches progress for syllabic n, sokuon, and foreign split-yoon settings", () => {
    expectCachedProgressToMatchFreshTarget("han'ei bunshou", defaultConfig, [
      "h", "ha", "han", "hanne", "hannei", "hannei b", "hannei bu", "hannei bun",
      "hannei buns", "hannei bunsh", "hannei bunsho", "hannei bunshou", "hannei bunsh",
    ]);

    expectCachedProgressToMatchFreshTarget("ke^ka", {
      ...defaultConfig,
      sokuon: { allowSplit: true, accepted: ["ltsu", "xtsu"], preferred: "xtsu" },
    }, ["k", "ke", "kek", "kekka", "kek", "keltu", "keltuka", "keX", "kekka"]);

    expectCachedProgressToMatchFreshTarget("vathi", {
      ...defaultConfig,
      allowSplitSpecialYoon: true,
    }, ["v", "va", "vat", "vath", "vathi", "vulatexi", "vu", "vathi"]);
  });

  test("returns defensive copies so callers cannot poison cached results", () => {
    const target = createRomajiInputTarget("shi kan", defaultConfig);
    const first = getRomajiInputProgress(target, "shi");
    const expected = { ...first, selectedOptions: [...first.selectedOptions] };

    first.selectedOptions.push("mutated");
    first.completedTokens = 99;

    expect(getRomajiInputProgress(target, "shi")).toEqual(expected);

    const rejected = getRomajiInputProgress(target, "shiX");
    rejected.selectedOptions.push("also-mutated");
    expect(getRomajiInputProgress(target, "shiX")).toMatchObject({
      accepted: false,
      selectedOptions: [],
    });
  });
});
