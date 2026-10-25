import { describe, expect, test } from "bun:test";
import {
  createJapaneseDirectChallenges,
  createJapaneseFuriganaParts,
  createJapaneseReadingGuideParts,
  directLongChallenges,
  directShortChallenges,
  englishDirectLongChallenges,
  englishDirectShortChallenges,
  kanaReadingToRomaji,
  parseEnglishChallengeText,
  parseJapaneseChallengeText,
} from "./challenges";
import { createRomajiInputTarget, getRomajiInputProgress } from "./typing";

function shortChallengeText(body: string) {
  return `---
type: "ultitype_sentence_short"
---

${body}`;
}

function longChallengeText(body: string) {
  return `---
type: "ultitype_sentence_long"
---

${body}`;
}

describe("frontmatter challenge data", () => {
  test("parses English short challenges as one sentence per line", () => {
    expect(parseEnglishChallengeText(shortChallengeText("Alpha line.\n\nBeta line.\n"))).toEqual([
      "Alpha line.",
      "Beta line.",
    ]);
  });

  test("parses English long challenges as blank-line separated paragraphs", () => {
    expect(
      parseEnglishChallengeText(
        longChallengeText("Alpha line wraps\nonto the next line.\n\nBeta line."),
      ),
    ).toEqual(["Alpha line wraps onto the next line.", "Beta line."]);
  });

  test("parses Japanese long challenges by joining wrapped lines without spaces", () => {
    expect(
      parseJapaneseChallengeText(
        longChallengeText(
          "[入](にゅう)[力](りょく)する。\n[文](ぶん)[章](しょう)です。\n\n[別](べつ)の[文](ぶん)です。",
        ),
      ),
    ).toEqual([
      {
        display: "入力する。文章です。",
        furigana: [
          { text: "入", ruby: "にゅう" },
          { text: "力", ruby: "りょく" },
          { text: "文", ruby: "ぶん" },
          { text: "章", ruby: "しょう" },
        ],
        reading: "にゅうりょくする。ぶんしょうです。",
      },
      {
        display: "別の文です。",
        furigana: [
          { text: "別", ruby: "べつ" },
          { text: "文", ruby: "ぶん" },
        ],
        reading: "べつのぶんです。",
      },
    ]);
  });

  test("rejects missing or unsupported challenge frontmatter", () => {
    expect(() => parseEnglishChallengeText("Alpha line.")).toThrow("frontmatter");
    expect(() =>
      parseJapaneseChallengeText(`---
type: "unknown"
---

[文](ぶん)です。`),
    ).toThrow("Unsupported challenge data type");
  });

  test("parses Japanese challenges as one annotated display line per challenge", () => {
    expect(
      parseJapaneseChallengeText(shortChallengeText("[解](かい)[析](せき)[結](けっ)[果](か)を[見](み)る。\n")),
    ).toEqual([
      {
        display: "解析結果を見る。",
        furigana: [
          { text: "解", ruby: "かい" },
          { text: "析", ruby: "せき" },
          { text: "結", ruby: "けっ" },
          { text: "果", ruby: "か" },
          { text: "見", ruby: "み" },
        ],
        reading: "かいせきけっかをみる。",
      },
    ]);
  });

  test("derives display, reading, and ruby groups from one annotated line", () => {
    expect(
      parseJapaneseChallengeText(shortChallengeText("[結](けっ)[果](か)を[見](み)てから[今日](きょう)は[帰](かえ)る")),
    ).toEqual([
      {
        display: "結果を見てから今日は帰る",
        furigana: [
          { text: "結", ruby: "けっ" },
          { text: "果", ruby: "か" },
          { text: "見", ruby: "み" },
          { text: "今日", ruby: "きょう" },
          { text: "帰", ruby: "かえ" },
        ],
        reading: "けっかをみてからきょうはかえる",
      },
    ]);
  });

  test("supports escaping markdown-style annotation characters", () => {
    expect(parseJapaneseChallengeText(shortChallengeText("\\[Ctrl\\]\\(A\\)と[結](けっ)[果](か)"))).toEqual([
      {
        display: "[Ctrl](A)と結果",
        furigana: [
          { text: "結", ruby: "けっ" },
          { text: "果", ruby: "か" },
        ],
        reading: "[Ctrl](A)とけっか",
      },
    ]);
  });

  test("requires unescaped kanji to have ruby annotations", () => {
    expect(() => parseJapaneseChallengeText(shortChallengeText("解析結果を見る。"))).toThrow(
      "unannotated kanji requires ruby annotation",
    );
  });

  test("keeps okurigana sokuon out of ruby annotations", () => {
    expect(parseJapaneseChallengeText(shortChallengeText("[保](たも)った[姿](すがた)が[揃](そろ)った"))).toEqual([
      {
        display: "保った姿が揃った",
        furigana: [
          { text: "保", ruby: "たも" },
          { text: "姿", ruby: "すがた" },
          { text: "揃", ruby: "そろ" },
        ],
        reading: "たもったすがたがそろった",
      },
    ]);
  });

  test("rejects generated ruby annotations that duplicate okurigana sokuon", () => {
    expect(() => parseJapaneseChallengeText(shortChallengeText("[保](たもっ)った"))).toThrow(
      "ruby text must not duplicate okurigana sokuon",
    );
    expect(() => parseJapaneseChallengeText(shortChallengeText("[揃](そろっ)った"))).toThrow(
      "ruby text must not duplicate okurigana sokuon",
    );
  });

  test("maps hiragana reading units to romaji input token ranges", () => {
    expect(createJapaneseReadingGuideParts("かい しゃ")).toEqual([
      { kind: "reading", text: "か", tokenStart: 0, tokenEnd: 2 },
      { kind: "reading", text: "い", tokenStart: 2, tokenEnd: 3 },
      { kind: "visual", text: " " },
      { kind: "reading", text: "しゃ", tokenStart: 3, tokenEnd: 4 },
    ]);
  });

  test("counts katakana using the same reading tokens while preserving display characters", () => {
    const katakana = "ラーメン スープ チョット アンイ";
    const hiragana = "らーめん すーぷ ちょっと あんい";
    const displayParts = createJapaneseReadingGuideParts(katakana);
    const readingParts = createJapaneseReadingGuideParts(hiragana);

    expect(kanaReadingToRomaji(katakana)).toBe(kanaReadingToRomaji(hiragana));
    expect(displayParts.map(({ text }) => text).join("")).toBe(katakana);
    expect(displayParts.map(({ text: _text, ...range }) => range))
      .toEqual(readingParts.map(({ text: _text, ...range }) => range));
  });

  test("keeps repeated reading results isolated and preserves their original script", () => {
    const first = createJapaneseReadingGuideParts("ラーメン");
    const initial = first[0];
    if (initial.kind === "reading") {
      initial.text = "changed";
      initial.tokenEnd = 999;
    }
    first.pop();

    for (const text of ["らーめん", "ラーメン", "らーめん"]) {
      const next = createJapaneseReadingGuideParts(text);
      expect(next.map((part) => part.text).join("")).toBe(text);
      const readingParts = next.filter((part) => part.kind === "reading");
      expect(readingParts.at(-1)?.tokenEnd).toBe(6);
    }
  });

  test("maps explicit furigana groups to display occurrences in order", () => {
    expect(
      createJapaneseFuriganaParts(
        "解析結果を見てから判断する速度は、経験によって大きく変わる。",
        [
          { text: "解", ruby: "かい" },
          { text: "析", ruby: "せき" },
          { text: "結", ruby: "けっ" },
          { text: "果", ruby: "か" },
          { text: "見", ruby: "み" },
          { text: "判", ruby: "はん" },
          { text: "断", ruby: "だん" },
          { text: "速", ruby: "そく" },
          { text: "度", ruby: "ど" },
          { text: "経", ruby: "けい" },
          { text: "験", ruby: "けん" },
          { text: "大", ruby: "おお" },
          { text: "変", ruby: "か" },
        ],
      ),
    ).toEqual([
      { text: "解", ruby: "かい" },
      { text: "析", ruby: "せき" },
      { text: "結", ruby: "けっ" },
      { text: "果", ruby: "か" },
      { text: "を" },
      { text: "見", ruby: "み" },
      { text: "てから" },
      { text: "判", ruby: "はん" },
      { text: "断", ruby: "だん" },
      { text: "する" },
      { text: "速", ruby: "そく" },
      { text: "度", ruby: "ど" },
      { text: "は、" },
      { text: "経", ruby: "けい" },
      { text: "験", ruby: "けん" },
      { text: "によって" },
      { text: "大", ruby: "おお" },
      { text: "きく" },
      { text: "変", ruby: "か" },
      { text: "わる。" },
    ]);
  });

  test("keeps multi-kanji ruby groups intact for synchronized advancement", () => {
    expect(
      createJapaneseFuriganaParts("今日は帰る", [
        { text: "今日", ruby: "きょう" },
        { text: "帰", ruby: "かえ" },
      ]),
    ).toEqual([
      { text: "今日", ruby: "きょう" },
      { text: "は" },
      { text: "帰", ruby: "かえ" },
      { text: "る" },
    ]);
  });

  test("maps repeated kanji by occurrence instead of using a shared word-level reading", () => {
    expect(
      createJapaneseFuriganaParts("生まれた生地を見る。", [
        { text: "生", ruby: "う" },
        { text: "生", ruby: "き" },
        { text: "地", ruby: "じ" },
        { text: "見", ruby: "み" },
      ]),
    ).toEqual([
      { text: "生", ruby: "う" },
      { text: "まれた" },
      { text: "生", ruby: "き" },
      { text: "地", ruby: "じ" },
      { text: "を" },
      { text: "見", ruby: "み" },
      { text: "る。" },
    ]);
  });
});

describe("direct short challenges", () => {
  test("show Japanese prompts and do not leak generated control labels", () => {
    expect(directShortChallenges).toHaveLength(40);
    expect(directLongChallenges).toHaveLength(10);
    expect(directShortChallenges[0].display).not.toBe("");
    expect(directShortChallenges[0].furigana?.length).toBeGreaterThan(0);
    expect(directShortChallenges[0].reading).not.toBe("");
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
  test("requires literal Arabic digits and types a wave dash with the tilde key", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("1～3[分](ぷん)だけ[待](ま)つ。")),
    );
    const target = createRomajiInputTarget(challenge.romajiSource ?? "", {
      preset: "hepburn", selections: {},
    });
    expect(challenge.display).toBe("1～3分だけ待つ。");
    expect(challenge.reading).toBe("1～3ぷんだけまつ。");
    expect(challenge.input).toBe("1~3pundakematsu.");
    expect(getRomajiInputProgress(target, "1~3pundakematsu.").completed).toBe(true);
    expect(getRomajiInputProgress(target, "ichi~3pundakematsu.").accepted).toBe(false);
    expect(getRomajiInputProgress(target, "1~sanpundakematsu.").accepted).toBe(false);
  });

  test("keeps conversational punctuation in the display and accepts half-width input keys", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(
        longChallengeText("「やった！」「[間](ま)に[合](あ)う？」と[聞](き)きました（[駅前](えきまえ)で）。"),
      ),
    );
    const expectedInput = "[yatta!][maniau?]tokikimashita(ekimaede).";

    expect(challenge.display).toBe("「やった！」「間に合う？」と聞きました（駅前で）。");
    expect(challenge.reading).toBe("「やった！」「まにあう？」とききました（えきまえで）。");
    expect(challenge.guide).toBe(expectedInput);
    expect(challenge.input).toBe(expectedInput);
    const target = createRomajiInputTarget(challenge.romajiSource ?? "", {
      preset: "hepburn",
      selections: {},
    });
    expect(getRomajiInputProgress(target, expectedInput).completed).toBe(true);
  });

  test("normalizes Japanese punctuation to half-width romaji symbols", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("ティータイム・じゃ～っ！")),
    );

    expect(challenge?.reading).toBe("てぃーたいむ・じゃ～っ！");
    expect(challenge?.romajiSource).toBe("thi-taimu･ja~^!");
    expect(challenge?.guide).toBe("thi-taimu･ja~xtu!");
    expect(challenge?.input).toBe("thi-taimu･ja~xtu!");
    expect(challenge?.input).not.toContain("・");
    expect(challenge?.input).not.toContain("～");
    expect(challenge?.input).not.toContain("！");
    expect(challenge?.input).not.toContain("ー");
  });

  test("maps long vowel marks in production prompts to hyphen input", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("レーティングは[今日](きょう)も[同](おな)じ。")),
    );

    expect(challenge?.reading).toStartWith("れーてぃんぐは");
    expect(challenge?.romajiSource).toStartWith("re-thinguha");
    expect(challenge?.guide).toStartWith("re-thinguha");
    expect(challenge?.input).toStartWith("re-thinguha");
    expect(challenge?.input).not.toContain("ー");
  });

  test("maps ヴァ行 katakana readings to va vi vu ve vo", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("ヴァヴィヴヴェヴォ")),
    );

    expect(challenge?.reading).toBe("ゔぁゔぃゔゔぇゔぉ");
    expect(challenge?.romajiSource).toBe("vavivuvevo");
    expect(challenge?.guide).toBe("vavivuvevo");
    expect(challenge?.input).toBe("vavivuvevo");
  });

  test("maps ウィ and ディ katakana pairs in ウィキペディア", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("ウィキペディア")),
    );

    expect(challenge?.reading).toBe("うぃきぺでぃあ");
    expect(challenge?.romajiSource).toBe("wikipedhia");
    expect(challenge?.guide).toBe("wikipedhia");
    expect(challenge?.input).toBe("wikipedhia");
    expect(createJapaneseReadingGuideParts(challenge?.reading ?? "")).toEqual([
      { kind: "reading", text: "うぃ", tokenStart: 0, tokenEnd: 1 },
      { kind: "reading", text: "き", tokenStart: 1, tokenEnd: 3 },
      { kind: "reading", text: "ぺ", tokenStart: 3, tokenEnd: 5 },
      { kind: "reading", text: "でぃ", tokenStart: 5, tokenEnd: 6 },
      { kind: "reading", text: "あ", tokenStart: 6, tokenEnd: 7 },
    ]);
  });

  test("maps additional foreign katakana pairs such as ウェ, デュ, and ドゥ", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("ヴィティヴェウェデュドゥウォテュトゥフィフェフォ")),
    );

    expect(challenge?.reading).toBe("ゔぃてぃゔぇうぇでゅどぅうぉてゅとぅふぃふぇふぉ");
    expect(challenge?.romajiSource).toBe("vithivewedhudwuwhothutwufifefo");
    expect(challenge?.guide).toBe("vithivewedhudwuwhothutwufifefo");
    expect(challenge?.input).toBe("vithivewedhudwuwhothutwufifefo");
  });

  test("maps づ to du instead of zu", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("[続](つづ)ければ。")),
    );
    expect(challenge?.guide).toContain("tsudukereba");
    expect(challenge?.guide).not.toContain("tsuzukereba");
  });

  test("keeps ぢ and づ distinct from じ and ず for hiragana and katakana readings", () => {
    for (const text of ["ぢづじず", "ヂヅジズ"]) {
      const [challenge] = createJapaneseDirectChallenges(
        parseJapaneseChallengeText(shortChallengeText(text)),
      );

      expect(challenge.reading).toBe("ぢづじず");
      expect(challenge.romajiSource).toBe("didujizu");
      expect(challenge.guide).toBe("didujizu");
      expect(challenge.input).toBe("didujizu");
    }
  });

  test("accepts di and rejects ji or zi for ちぢれためん in every input preset", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("[縮](ちぢ)れた[麺](めん)")),
    );

    for (const preset of ["shortest", "hepburn", "custom"] as const) {
      const config = {
        preset,
        selections: {
          chi: { accepted: ["chi", "ti"], preferred: "chi" },
          ji: { accepted: ["ji", "zi"], preferred: "ji" },
        },
      };
      const target = createRomajiInputTarget(challenge.romajiSource ?? "", config);
      const prefix = preset === "shortest" ? "ti" : "chi";

      expect(getRomajiInputProgress(target, `${prefix}diretamen`).completed).toBe(true);
      expect(getRomajiInputProgress(target, `${prefix}jiretamen`).accepted).toBe(false);
      expect(getRomajiInputProgress(target, `${prefix}ziretamen`).accepted).toBe(false);

      const jiTarget = createRomajiInputTarget(kanaReadingToRomaji("じ"), config);
      expect(getRomajiInputProgress(jiTarget, preset === "shortest" ? "zi" : "ji").completed)
        .toBe(true);
      expect(getRomajiInputProgress(jiTarget, "di").accepted).toBe(false);
    }
  });

  test("keeps sokuon markers out of the visible Japanese guide", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("[結果](けっか)を[見](み)る。")),
    );

    expect(challenge?.display).toContain("結果");
    expect(challenge?.guide).toContain("kekka");
    expect(challenge?.guide).not.toContain("^");
  });

  test("keeps syllabic n distinct before a following word that starts with a vowel", () => {
    const [challenge] = createJapaneseDirectChallenges(
      parseJapaneseChallengeText(shortChallengeText("[視線移動](しせんいどう)を[練習](れんしゅう)する。")),
    );

    expect(challenge?.romajiSource).toContain("shisen'idou");
    expect(challenge?.guide).toContain("shisennidou");
    expect(challenge?.input).toContain("shisennidou");
    expect(challenge?.input).not.toContain("shisenidou");
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
