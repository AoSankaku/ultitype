import { describe, expect, test } from "bun:test";
import {
  applyDirectKey,
  calculateMetrics,
  countShortestRomajiKeystrokes,
  countPreferredRomajiProgressKeystrokes,
  createRomajiInputTarget,
  getRomajiGuideDisplay,
  getRomajiInputProgress,
  getRank,
  getRankProgression,
  getRankRequiredScore,
  isDirectKeyCorrect,
  isImeSubmissionMatch,
  isProductionUnlocked,
  modes,
  scoreImeProductionInput,
  shouldAcceptTextInput,
} from "./typing";

describe("calculateMetrics", () => {
  test("uses all keystrokes for keys per second and character attempts for accuracy", () => {
    const metrics = calculateMetrics({
      elapsedSeconds: 10,
      keystrokes: 70,
      kanaCharacters: 30,
      promptCharacters: 20,
      characterAttempts: 60,
      correctCharacters: 54,
      mistakes: 6,
      intervals: [120, 130, 125],
      accuracyExponent: 3,
    });

    expect(metrics.keysPerSecond).toBeCloseTo(7);
    expect(metrics.kanaCharactersPerSecond).toBeCloseTo(3);
    expect(metrics.promptCharactersPerSecond).toBeCloseTo(2);
    expect("wpm" in metrics).toBe(false);
    expect(metrics.accuracy).toBeCloseTo(0.9);
    expect(metrics.score).toBeCloseTo(5103);
  });

  test("keeps consistency usable when fast typing has natural interval variance", () => {
    const metrics = calculateMetrics({
      elapsedSeconds: 2,
      keystrokes: 16,
      kanaCharacters: 0,
      promptCharacters: 0,
      characterAttempts: 16,
      correctCharacters: 16,
      mistakes: 0,
      intervals: [85, 170, 95, 210, 120, 180, 90, 160, 115, 190, 100, 150, 650],
      accuracyExponent: 3,
    });

    expect(metrics.consistency).toBeGreaterThanOrEqual(0.65);
  });

  test("treats human-smooth pacing as full consistency", () => {
    const metrics = calculateMetrics({
      elapsedSeconds: 2,
      keystrokes: 12,
      kanaCharacters: 0,
      promptCharacters: 0,
      characterAttempts: 12,
      correctCharacters: 12,
      mistakes: 0,
      intervals: [150, 170, 140, 160, 145, 155, 175, 135],
      accuracyExponent: 3,
    });

    expect(metrics.consistency).toBe(1);
  });

  test("allows the same absolute jitter at high speed", () => {
    const metrics = calculateMetrics({
      elapsedSeconds: 1,
      keystrokes: 12,
      kanaCharacters: 0,
      promptCharacters: 0,
      characterAttempts: 12,
      correctCharacters: 12,
      mistakes: 0,
      intervals: [50, 90, 55, 85, 60, 80, 65, 75],
      accuracyExponent: 3,
    });

    expect(metrics.consistency).toBe(1);
  });

  test("penalizes clearly uneven pacing after the tolerance band", () => {
    const metrics = calculateMetrics({
      elapsedSeconds: 2,
      keystrokes: 12,
      kanaCharacters: 0,
      promptCharacters: 0,
      characterAttempts: 12,
      correctCharacters: 12,
      mistakes: 0,
      intervals: [80, 260, 90, 280, 75, 250],
      accuracyExponent: 3,
    });

    expect(metrics.consistency).toBeLessThan(0.5);
  });

  test("can score rank from fixed mode duration while preserving displayed keys per second", () => {
    const metrics = calculateMetrics({
      elapsedSeconds: 10,
      scoreDurationSeconds: 120,
      keystrokes: 60,
      kanaCharacters: 0,
      promptCharacters: 0,
      characterAttempts: 60,
      correctCharacters: 60,
      mistakes: 0,
      intervals: [],
      accuracyExponent: 3,
    });

    expect(metrics.keysPerSecond).toBeCloseTo(6);
    expect(metrics.score).toBeCloseTo(500);
  });

  test("counts production romaji estimates with the shortest accepted spelling", () => {
    expect(countShortestRomajiKeystrokes("shi^teita")).toBe(8);
  });

  test("caps production romaji progress at the shortest spelling while a longer variant is typed", () => {
    const target = createRomajiInputTarget("shi", {
      allowSplitYoon: true,
      preset: "hepburn",
      selections: {},
    });
    const shortestTarget = createRomajiInputTarget("shi", {
      allowSplitYoon: true,
      preset: "shortest",
      selections: {},
    });

    expect(countPreferredRomajiProgressKeystrokes(target, shortestTarget, "s")).toBe(1);
    expect(countPreferredRomajiProgressKeystrokes(target, shortestTarget, "sh")).toBe(2);
    expect(countPreferredRomajiProgressKeystrokes(target, shortestTarget, "shi")).toBe(2);
  });
});

describe("rank", () => {
  test("treats scores under 500 as NR and 500 through 589 as G0", () => {
    expect(getRank(0).label).toBe("NR");
    expect(getRank(499).label).toBe("NR");
    expect(getRank(500).label).toBe("G0");
    expect(getRank(589).label).toBe("G0");
    expect(getRank(590).label).toBe("G1");
    expect(getRank(679).label).toBe("G1");
    expect(getRank(680).label).toBe("G2");
  });

  test("maps master rank bands from M0 through M59 and then numbered UM ranks", () => {
    expect(getRank(500 + 56 * 90).label).toBe("M0");
    expect(getRank(500 + 75 * 90).label).toBe("M19");
    expect(getRank(500 + 76 * 90).label).toBe("M20");
    expect(getRank(500 + 95 * 90).label).toBe("M39");
    expect(getRank(500 + 96 * 90).label).toBe("M40");
    expect(getRank(500 + 115 * 90).label).toBe("M59");
    expect(getRank(500 + 116 * 90).label).toBe("UM0");
    expect(getRank(500 + 117 * 90).label).toBe("UM1");
  });

  test("keeps UM ranks open-ended above UM0", () => {
    expect(getRank(500 + 126 * 90)).toMatchObject({
      label: "UM10",
      level: 126,
    });
    expect(getRank(500 + 158 * 90)).toMatchObject({
      label: "UM42",
      level: 158,
    });
    expect(getRank(500 + 158 * 90 - 1).label).toBe("UM41");
  });

  test("uses the SPEC color names for the updated rank progression", () => {
    const progression = getRankProgression();

    expect(progression.find((rank) => rank.label === "M0")?.colorName).toBe("紫");
    expect(progression.find((rank) => rank.label === "M19")?.colorName).toBe("紫");
    expect(progression.find((rank) => rank.label === "M20")?.colorName).toBe("黒紫");
    expect(progression.find((rank) => rank.label === "M39")?.colorName).toBe("黒紫");
    expect(progression.find((rank) => rank.label === "M40")?.colorName).toBe("黒");
    expect(progression.find((rank) => rank.label === "M59")?.colorName).toBe("黒");
    expect(progression.at(-1)).toMatchObject({ label: "UM0", colorName: "虹" });
  });

  test("unlocks production at A0", () => {
    expect(isProductionUnlocked(4280)).toBe(true);
    expect(isProductionUnlocked(4279)).toBe(false);
  });

  test("exposes required score for rank progression", () => {
    expect(getRankRequiredScore(0)).toBe(500);
    expect(getRankRequiredScore(1)).toBe(590);
    expect(getRankRequiredScore(2)).toBe(680);
    expect(getRankRequiredScore(42)).toBe(4280);

    const progression = getRankProgression();

    expect(progression[0]).toMatchObject({ label: "G0", requiredScore: 500 });
    expect(progression.find((rank) => rank.label === "A0")?.requiredScore).toBe(4280);
    expect(progression.at(-1)).toMatchObject({ label: "UM0" });
  });
});

describe("IME submission matching", () => {
  test("allows Japanese punctuation variants but preserves alphabet differences", () => {
    expect(isImeSubmissionMatch("高速入力，正確性。", "高速入力、正確性。")).toBe(true);
    expect(isImeSubmissionMatch("Type", "type")).toBe(false);
    expect(isImeSubmissionMatch("Ｔype", "Type")).toBe(false);
  });

  test("scores confirmed IME text against the kanji prompt with strict character differences", () => {
    expect(scoreImeProductionInput("文章を1手先まで", "文章を１手先まで")).toMatchObject({
      completedTargetLength: 8,
      correctCharacters: 7,
      mistakes: 1,
    });
    expect(scoreImeProductionInput("ABCDEF", "ABCではDEF")).toMatchObject({
      completedTargetLength: 8,
      correctCharacters: 6,
      mistakes: 2,
    });
    expect(scoreImeProductionInput("ABC、DEF", "ABCDEF")).toMatchObject({
      completedTargetLength: 6,
      correctCharacters: 6,
      mistakes: 1,
    });
  });

  test("counts alphabet case and width differences as production IME mistakes", () => {
    expect(scoreImeProductionInput("Type", "type")).toMatchObject({
      completedTargetLength: 4,
      correctCharacters: 3,
      mistakes: 1,
    });
    expect(scoreImeProductionInput("Ｔype", "Type")).toMatchObject({
      completedTargetLength: 4,
      correctCharacters: 3,
      mistakes: 1,
    });
    expect(
      scoreImeProductionInput("Save機能", "save機能", {
        forceComplete: true,
      }),
    ).toMatchObject({
      completedTargetLength: 6,
      correctCharacters: 5,
      mistakes: 1,
    });
  });

  test("accepts unified comma and period variants for production IME scoring", () => {
    expect(scoreImeProductionInput("A,B.C,D", "A、B。C、D")).toMatchObject({
      completedTargetLength: 7,
      correctCharacters: 7,
      mistakes: 0,
    });
    expect(scoreImeProductionInput("A、B。C、D", "A,B.C,D")).toMatchObject({
      completedTargetLength: 7,
      correctCharacters: 7,
      mistakes: 0,
    });
  });

  test("counts mixed comma and period variants as one production IME mistake", () => {
    expect(scoreImeProductionInput("A,B。C,D", "A、B。C、D")).toMatchObject({
      completedTargetLength: 7,
      correctCharacters: 7,
      mistakes: 1,
    });
  });

  test("counts transposed IME text by the involved character range", () => {
    expect(scoreImeProductionInput("にも瞬間", "瞬間にも")).toMatchObject({
      completedTargetLength: 4,
      correctCharacters: 0,
      mistakes: 4,
    });
  });

  test("chooses the shortest target prefix with the fewest IME mistakes for partial input", () => {
    expect(scoreImeProductionInput("流れを", "流れを切らない判断")).toMatchObject({
      completedTargetLength: 3,
      correctCharacters: 3,
      isComplete: false,
      mistakes: 0,
    });
  });

  test("requires a newline when completing each IME production prompt", () => {
    expect(
      scoreImeProductionInput("課題文", "課題文", {
        forceComplete: true,
        requireTrailingNewline: true,
      }),
    ).toMatchObject({
      completedTargetLength: 4,
      correctCharacters: 3,
      mistakes: 1,
    });
    expect(
      scoreImeProductionInput("課題文\n", "課題文", {
        forceComplete: true,
        requireTrailingNewline: true,
      }),
    ).toMatchObject({
      completedTargetLength: 4,
      correctCharacters: 4,
      mistakes: 0,
    });
  });
});

describe("applyDirectKey", () => {
  function typeDirectKeys(target: ReturnType<typeof createRomajiInputTarget>, keys: string[]) {
    return keys.reduce(
      (state, key) =>
        applyDirectKey({
          state,
          key,
          target,
          lockMistakes: false,
        }).state,
      {
        input: "",
        scoredInputLength: 0,
        mistakeDebt: 0,
        characterAttempts: 0,
        correctCharacters: 0,
        mistakes: 0,
        completedPrompts: 0,
      },
    );
  }

  test("requires nn for syllabic n before vowels and never accepts n apostrophe", () => {
    const target = createRomajiInputTarget("han'ei", {
      preset: "shortest",
      selections: {},
    });

    expect(target.guide).toBe("hannei");
    expect(typeDirectKeys(target, Array.from("hanei")).completedPrompts).toBe(0);
    expect(typeDirectKeys(target, Array.from("hanei")).mistakes).toBeGreaterThan(0);
    expect(typeDirectKeys(target, Array.from("hannei")).completedPrompts).toBe(1);

    const apostrophe = typeDirectKeys(target, Array.from("han'"));

    expect(apostrophe.completedPrompts).toBe(0);
    expect(apostrophe.input).toBe("han");
    expect(apostrophe.mistakes).toBe(1);

    const rejected = typeDirectKeys(target, Array.from("han'ei"));

    expect(rejected.completedPrompts).toBe(0);
    expect(rejected.mistakes).toBeGreaterThan(0);
  });

  test("allows n and nn for syllabic n before consonants", () => {
    const target = createRomajiInputTarget("bunshou", {
      preset: "hepburn",
      selections: {},
    });

    expect(typeDirectKeys(target, Array.from("bunshou")).completedPrompts).toBe(1);
    expect(typeDirectKeys(target, Array.from("bunnshou")).completedPrompts).toBe(1);
  });

  test("changes the visible romaji guide toward the accepted variant being typed", () => {
    const target = createRomajiInputTarget("handan", {
      preset: "hepburn",
      selections: {},
    });

    expect(getRomajiGuideDisplay(target, "")).toBe("handan");
    expect(getRomajiGuideDisplay(target, "han")).toBe("handan");
    expect(getRomajiGuideDisplay(target, "hann")).toBe("hanndan");
    expect(getRomajiGuideDisplay(target, "hanndann")).toBe("hanndann");
  });

  test("reports the typed offset within the current multi-character romaji token", () => {
    const target = createRomajiInputTarget("nyu", {
      preset: "hepburn",
      selections: {},
      allowSplitYoon: true,
    });

    const progress = getRomajiInputProgress(target, "n");

    expect(progress.currentOption).toBe("nyu");
    expect(progress.currentOptionOffset).toBe(1);
  });

  test("requires three n characters when syllabic n is followed by na-row input", () => {
    const target = createRomajiInputTarget("an'nei", {
      preset: "hepburn",
      selections: {},
      allowSplitYoon: true,
    });

    expect(target.guide).toBe("annnei");
    expect(typeDirectKeys(target, Array.from("annei")).completedPrompts).toBe(0);
    expect(typeDirectKeys(target, Array.from("annei")).mistakes).toBeGreaterThan(0);
    expect(typeDirectKeys(target, Array.from("annnei")).completedPrompts).toBe(1);
  });

  test("can disable split yoon inputs such as kila and kixa for kya", () => {
    const permissiveTarget = createRomajiInputTarget("kya", {
      preset: "hepburn",
      selections: {},
      allowSplitYoon: true,
    });

    expect(typeDirectKeys(permissiveTarget, Array.from("kya")).completedPrompts).toBe(1);
    expect(typeDirectKeys(permissiveTarget, Array.from("kila")).completedPrompts).toBe(1);
    expect(typeDirectKeys(permissiveTarget, Array.from("kixa")).completedPrompts).toBe(1);

    const strictTarget = createRomajiInputTarget("kya", {
      preset: "hepburn",
      selections: {},
      allowSplitYoon: false,
    });

    expect(typeDirectKeys(strictTarget, Array.from("kya")).completedPrompts).toBe(1);
    expect(typeDirectKeys(strictTarget, Array.from("kila")).completedPrompts).toBe(0);
    expect(typeDirectKeys(strictTarget, Array.from("kila")).mistakes).toBeGreaterThan(0);
    expect(typeDirectKeys(strictTarget, Array.from("kixa")).completedPrompts).toBe(0);
    expect(typeDirectKeys(strictTarget, Array.from("kixa")).mistakes).toBeGreaterThan(0);
  });

  test("can enable special split yoon inputs such as vula and texi separately", () => {
    const generalOnlyTarget = createRomajiInputTarget("vathi", {
      preset: "hepburn",
      selections: {},
      allowSplitYoon: true,
      allowSplitSpecialYoon: false,
    });

    expect(typeDirectKeys(generalOnlyTarget, Array.from("vathi")).completedPrompts).toBe(1);
    expect(typeDirectKeys(generalOnlyTarget, Array.from("vulatexi")).completedPrompts).toBe(0);
    expect(typeDirectKeys(generalOnlyTarget, Array.from("vulatexi")).mistakes).toBeGreaterThan(0);

    const specialPermissiveTarget = createRomajiInputTarget("vathi", {
      preset: "hepburn",
      selections: {},
      allowSplitYoon: false,
      allowSplitSpecialYoon: true,
    });

    expect(typeDirectKeys(specialPermissiveTarget, Array.from("vathi")).completedPrompts).toBe(1);
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("vulatexi")).completedPrompts).toBe(1);
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("vuxatexi")).completedPrompts).toBe(1);
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("kila")).completedPrompts).toBe(0);
  });

  test("can enable wi and dhi special split yoon inputs with custom guide preferences", () => {
    const generalOnlyTarget = createRomajiInputTarget("wikipedhia", {
      preset: "hepburn",
      selections: {},
      allowSplitSpecialYoon: false,
    });

    expect(typeDirectKeys(generalOnlyTarget, Array.from("wikipedhia")).completedPrompts).toBe(1);
    expect(typeDirectKeys(generalOnlyTarget, Array.from("uxikipedexia")).completedPrompts).toBe(0);

    const specialPermissiveTarget = createRomajiInputTarget("wikipedhia", {
      preset: "custom",
      selections: {},
      specialPreset: "custom",
      specialSelections: {
        wi: { accepted: ["wi", "whi", "uli", "uxi"], preferred: "whi" },
        dhi: { accepted: ["dhi", "di", "deli", "dexi"], preferred: "di" },
      },
    });

    expect(specialPermissiveTarget.guide).toBe("whikipedia");
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("whikipedia")).completedPrompts).toBe(1);
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("wikipedia")).completedPrompts).toBe(1);
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("uxikipedexia")).completedPrompts).toBe(1);
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("ulikipedelia")).completedPrompts).toBe(1);
  });

  test("keeps wo as a standalone を source instead of treating it as ウォ", () => {
    const target = createRomajiInputTarget("wo", {
      preset: "custom",
      selections: {},
      specialPreset: "custom",
      specialSelections: {
        who: { accepted: ["ulo"], preferred: "ulo" },
      },
    });

    expect(target.guide).toBe("wo");
    expect(typeDirectKeys(target, Array.from("wo")).completedPrompts).toBe(1);
    expect(typeDirectKeys(target, Array.from("ulo")).completedPrompts).toBe(0);
  });

  test("can enable additional foreign katakana special split yoon inputs", () => {
    const generalOnlyTarget = createRomajiInputTarget("wedhudwu", {
      preset: "hepburn",
      selections: {},
      allowSplitSpecialYoon: false,
    });

    expect(typeDirectKeys(generalOnlyTarget, Array.from("wedhudwu")).completedPrompts).toBe(1);
    expect(typeDirectKeys(generalOnlyTarget, Array.from("uxedexyudoxu")).completedPrompts).toBe(0);

    const specialPermissiveTarget = createRomajiInputTarget("wedhudwu", {
      preset: "custom",
      selections: {},
      specialPreset: "custom",
      specialSelections: {
        we: { accepted: ["we", "whe", "ule", "uxe"], preferred: "whe" },
        dhu: { accepted: ["dhu", "dyu", "delyu", "dexyu"], preferred: "dyu" },
        dwu: { accepted: ["dwu", "dolu", "doxu"], preferred: "dwu" },
      },
    });

    expect(specialPermissiveTarget.guide).toBe("whedyudwu");
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("whedyudwu")).completedPrompts).toBe(1);
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("wedhudwu")).completedPrompts).toBe(1);
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("uxedexyudoxu")).completedPrompts).toBe(1);
    expect(typeDirectKeys(specialPermissiveTarget, Array.from("uledelyudolu")).completedPrompts).toBe(1);
  });

  test("can configure low-frequency special yoon inputs separately from standard romaji", () => {
    const integratedTarget = createRomajiInputTarget("vithivedhu", {
      preset: "hepburn",
      selections: {},
      specialPreset: "integrated",
    });

    expect(integratedTarget.guide).toBe("vithivedhu");
    expect(typeDirectKeys(integratedTarget, Array.from("vithivedhu")).completedPrompts).toBe(1);
    expect(typeDirectKeys(integratedTarget, Array.from("vuxitexivuxedexyu")).completedPrompts).toBe(0);

    const splitTarget = createRomajiInputTarget("vithivedhu", {
      preset: "hepburn",
      selections: {},
      specialPreset: "split",
    });

    expect(splitTarget.guide).toBe("vuxitexivuxedexyu");
    expect(typeDirectKeys(splitTarget, Array.from("vuxitexivuxedexyu")).completedPrompts).toBe(1);
    expect(typeDirectKeys(splitTarget, Array.from("vithivedhu")).completedPrompts).toBe(0);

    const customTarget = createRomajiInputTarget("vithivedhu", {
      preset: "hepburn",
      selections: {},
      specialPreset: "custom",
      specialSelections: {
        thi: { accepted: ["texi"], preferred: "texi" },
        ve: { accepted: ["ve", "vuxe"], preferred: "vuxe" },
      },
    });

    expect(customTarget.guide).toBe("vitexivuxedhu");
    expect(typeDirectKeys(customTarget, Array.from("vitexivuxedhu")).completedPrompts).toBe(1);
    expect(typeDirectKeys(customTarget, Array.from("vithivuxedhu")).completedPrompts).toBe(0);
  });

  test("can allow only selected split sokuon inputs before consonants", () => {
    const target = createRomajiInputTarget("ke^ka", {
      preset: "hepburn",
      selections: {},
      sokuon: {
        allowSplit: true,
        accepted: ["ltu", "xtu"],
        preferred: "xtu",
      },
    });

    expect(target.guide).toBe("kekka");
    expect(typeDirectKeys(target, Array.from("kekka")).completedPrompts).toBe(1);
    expect(typeDirectKeys(target, Array.from("keltuka")).completedPrompts).toBe(1);
    expect(typeDirectKeys(target, Array.from("kextuka")).completedPrompts).toBe(1);
    expect(getRomajiInputProgress(target, "keltsuka").accepted).toBe(false);
    expect(typeDirectKeys(target, Array.from("keltsuka")).mistakes).toBeGreaterThan(0);
  });

  test("can disable split sokuon inputs while keeping consonant doubling", () => {
    const target = createRomajiInputTarget("ke^ka", {
      preset: "hepburn",
      selections: {},
      sokuon: {
        allowSplit: false,
        accepted: ["ltsu", "xtsu", "ltu", "xtu"],
        preferred: "xtu",
      },
    });

    expect(typeDirectKeys(target, Array.from("kekka")).completedPrompts).toBe(1);
    expect(typeDirectKeys(target, Array.from("kextuka")).completedPrompts).toBe(0);
    expect(typeDirectKeys(target, Array.from("kextuka")).mistakes).toBeGreaterThan(0);
  });

  test("requires selected standalone sokuon inputs before n, symbols, and end of text", () => {
    const config = {
      preset: "hepburn" as const,
      selections: {},
      sokuon: {
        allowSplit: false,
        accepted: ["xtu"],
        preferred: "xtu",
      },
    };

    const beforeN = createRomajiInputTarget("ma^na", config);
    const beforeSymbol = createRomajiInputTarget("ma^.", config);
    const atEnd = createRomajiInputTarget("ma^", config);

    expect(beforeN.guide).toBe("maxtuna");
    expect(typeDirectKeys(beforeN, Array.from("maxtuna")).completedPrompts).toBe(1);
    expect(typeDirectKeys(beforeN, Array.from("manna")).completedPrompts).toBe(0);
    expect(typeDirectKeys(beforeSymbol, Array.from("maxtu.")).completedPrompts).toBe(1);
    expect(typeDirectKeys(beforeSymbol, Array.from("ma.")).completedPrompts).toBe(0);
    expect(typeDirectKeys(atEnd, Array.from("maxtu")).completedPrompts).toBe(1);
  });

  test("selects shortest and hepburn guide priority while accepting variants", () => {
    expect(
      createRomajiInputTarget("shichi tsu fu jo han'ei", {
        preset: "shortest",
        selections: {},
      }).guide,
    ).toBe("siti tu hu zyo hannei");

    const hepburn = createRomajiInputTarget("shichi tsu fu jo han'ei", {
      preset: "hepburn",
      selections: {},
    });

    expect(hepburn.guide).toBe("shichi tsu fu jo hannei");
    expect(typeDirectKeys(hepburn, Array.from("shichitsufujohannei")).completedPrompts).toBe(1);
    expect(typeDirectKeys(hepburn, Array.from("sitituhuzyohannei")).completedPrompts).toBe(1);
  });

  test("custom selections can restrict accepted variants separately from display priority", () => {
    const shiOnly = createRomajiInputTarget("shi", {
      preset: "custom",
      selections: {
        shi: { accepted: ["shi"], preferred: "shi" },
      },
    });

    expect(typeDirectKeys(shiOnly, Array.from("shi")).completedPrompts).toBe(1);
    expect(typeDirectKeys(shiOnly, Array.from("si")).mistakes).toBe(1);

    const siOrCiDisplayedAsCi = createRomajiInputTarget("shi", {
      preset: "custom",
      selections: {
        shi: { accepted: ["si", "ci"], preferred: "ci" },
      },
    });

    expect(siOrCiDisplayedAsCi.guide).toBe("ci");
    expect(typeDirectKeys(siOrCiDisplayedAsCi, Array.from("si")).completedPrompts).toBe(1);
    expect(typeDirectKeys(siOrCiDisplayedAsCi, Array.from("ci")).completedPrompts).toBe(1);
    expect(typeDirectKeys(siOrCiDisplayedAsCi, Array.from("shi")).mistakes).toBe(1);

    const bothDisplayedAsShi = createRomajiInputTarget("shi", {
      preset: "custom",
      selections: {
        shi: { accepted: ["shi", "si"], preferred: "shi" },
      },
    });

    expect(bothDisplayedAsShi.guide).toBe("shi");
    expect(typeDirectKeys(bothDisplayedAsShi, Array.from("shi")).completedPrompts).toBe(1);
    expect(typeDirectKeys(bothDisplayedAsShi, Array.from("si")).completedPrompts).toBe(1);
  });

  test("scores only newly reached direct characters after Backspace", () => {
    const first = applyDirectKey({
      state: {
        input: "",
        scoredInputLength: 0,
        mistakeDebt: 0,
        characterAttempts: 0,
        correctCharacters: 0,
        mistakes: 0,
        completedPrompts: 0,
      },
      key: "a",
      target: "ab",
      lockMistakes: false,
    });

    const backspace = applyDirectKey({
      state: first.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: false,
    });

    const retyped = applyDirectKey({
      state: backspace.state,
      key: "a",
      target: "ab",
      lockMistakes: false,
    });

    const completed = applyDirectKey({
      state: retyped.state,
      key: "b",
      target: "ab",
      lockMistakes: false,
    });

    expect(first.scoredKeystrokes).toBe(1);
    expect(backspace.scoredKeystrokes).toBe(0);
    expect(retyped.scoredKeystrokes).toBe(0);
    expect(completed.scoredKeystrokes).toBe(1);
    expect(completed.state.completedPrompts).toBe(1);
    expect(completed.state.scoredInputLength).toBe(0);
  });

  test("requires one Backspace per wrong key in strict accuracy mode", () => {
    const firstMiss = applyDirectKey({
      state: {
        input: "",
        scoredInputLength: 0,
        mistakeDebt: 0,
        characterAttempts: 0,
        correctCharacters: 0,
        mistakes: 0,
        completedPrompts: 0,
      },
      key: "x",
      target: "ab",
      lockMistakes: true,
    });

    const secondMiss = applyDirectKey({
      state: firstMiss.state,
      key: "y",
      target: "ab",
      lockMistakes: true,
    });

    const stillLocked = applyDirectKey({
      state: secondMiss.state,
      key: "a",
      target: "ab",
      lockMistakes: true,
    });

    const oneBackspace = applyDirectKey({
      state: stillLocked.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const twoBackspaces = applyDirectKey({
      state: oneBackspace.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const stillBlockedAfterTwo = applyDirectKey({
      state: twoBackspaces.state,
      key: "a",
      target: "ab",
      lockMistakes: true,
    });

    const threeBackspaces = applyDirectKey({
      state: stillBlockedAfterTwo.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const fourBackspaces = applyDirectKey({
      state: threeBackspaces.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const correct = applyDirectKey({
      state: fourBackspaces.state,
      key: "a",
      target: "ab",
      lockMistakes: true,
    });

    expect(secondMiss.state.input).toBe("");
    expect(secondMiss.state.mistakeDebt).toBe(2);
    expect(stillLocked.state.mistakeDebt).toBe(3);
    expect(oneBackspace.state.mistakeDebt).toBe(2);
    expect(twoBackspaces.state.mistakeDebt).toBe(1);
    expect(stillBlockedAfterTwo.state.input).toBe("");
    expect(stillBlockedAfterTwo.state.mistakeDebt).toBe(2);
    expect(threeBackspaces.state.mistakeDebt).toBe(1);
    expect(fourBackspaces.state.mistakeDebt).toBe(0);
    expect(correct.state.input).toBe("a");
    expect(correct.state.mistakeDebt).toBe(0);
  });

  test("tracks strict accuracy wrong keys until Backspace clears them", () => {
    const firstMiss = applyDirectKey({
      state: {
        input: "a",
        scoredInputLength: 1,
        mistakeDebt: 0,
        characterAttempts: 1,
        correctCharacters: 1,
        mistakes: 0,
        completedPrompts: 0,
      },
      key: "x",
      target: "abc",
      lockMistakes: true,
    });

    const secondMiss = applyDirectKey({
      state: firstMiss.state,
      key: "y",
      target: "abc",
      lockMistakes: true,
    });

    const oneBackspace = applyDirectKey({
      state: secondMiss.state,
      key: "Backspace",
      target: "abc",
      lockMistakes: true,
    });

    const twoBackspaces = applyDirectKey({
      state: oneBackspace.state,
      key: "Backspace",
      target: "abc",
      lockMistakes: true,
    });

    expect((firstMiss.state as { mistakeInput?: string }).mistakeInput).toBe("x");
    expect((secondMiss.state as { mistakeInput?: string }).mistakeInput).toBe("xy");
    expect((oneBackspace.state as { mistakeInput?: string }).mistakeInput).toBe("x");
    expect((twoBackspaces.state as { mistakeInput?: string }).mistakeInput).toBe("");
  });

  test("ignores wrong characters outside strict accuracy mode without advancing", () => {
    const miss = applyDirectKey({
      state: {
        input: "a",
        scoredInputLength: 1,
        mistakeDebt: 0,
        characterAttempts: 1,
        correctCharacters: 1,
        mistakes: 0,
        completedPrompts: 0,
      },
      key: "x",
      target: "ab",
      lockMistakes: false,
    });

    const correct = applyDirectKey({
      state: miss.state,
      key: "b",
      target: "ab",
      lockMistakes: false,
    });

    expect(miss.state.input).toBe("a");
    expect(miss.state.mistakes).toBe(1);
    expect(miss.state.characterAttempts).toBe(2);
    expect(correct.state.input).toBe("");
    expect(correct.state.completedPrompts).toBe(1);
  });
});

describe("isDirectKeyCorrect", () => {
  test("accepts only the first correct direct key for session start", () => {
    const state = {
      input: "",
      scoredInputLength: 0,
      mistakeDebt: 0,
      characterAttempts: 0,
      correctCharacters: 0,
      mistakes: 0,
      completedPrompts: 0,
    };

    expect(isDirectKeyCorrect({ state, key: "x", target: "ab" })).toBe(false);
    expect(isDirectKeyCorrect({ state, key: "Backspace", target: "ab" })).toBe(false);
    expect(isDirectKeyCorrect({ state, key: "a", target: "ab" })).toBe(true);
  });

  test("uses romaji acceptance rules when checking the first correct key", () => {
    const target = createRomajiInputTarget("shi", {
      preset: "hepburn",
      selections: {
        shi: { accepted: ["shi", "si"], preferred: "shi" },
      },
      allowSplitYoon: true,
    });
    const state = {
      input: "",
      scoredInputLength: 0,
      mistakeDebt: 0,
      characterAttempts: 0,
      correctCharacters: 0,
      mistakes: 0,
      completedPrompts: 0,
    };

    expect(isDirectKeyCorrect({ state, key: "s", target })).toBe(true);
    expect(isDirectKeyCorrect({ state, key: "x", target })).toBe(false);
  });
});

describe("shouldAcceptTextInput", () => {
  test("accepts text input only in production IME-on mode", () => {
    const results = Object.fromEntries(modes.map((mode) => [mode.id, shouldAcceptTextInput(mode)]));

    expect(results["production-ime-on"]).toBe(true);
    expect(results["practice-accuracy"]).toBe(false);
    expect(results["practice-flow"]).toBe(false);
    expect(results["practice-speed"]).toBe(false);
    expect(results["production-ime-off"]).toBe(false);
  });
});
