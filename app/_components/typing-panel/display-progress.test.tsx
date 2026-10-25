import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createJapaneseDirectChallenges,
  parseJapaneseChallengeText,
} from "@/src/lib/challenges";
import { createRomajiInputTarget, getRomajiInputProgress } from "@/src/lib/typing";
import { createDisplayMarkerTextParts } from "./display-text";
import { createInputProgress } from "./input-progress";
import { ProductionLongDisplayText } from "./production-long-display";

const [challenge] = createJapaneseDirectChallenges(parseJapaneseChallengeText(`---
type: "ultitype_sentence_long"
---

[昼休](ひるやす)みに[同僚](どうりょう)と[豚骨](とんこつ)ラーメンを[食](た)べに[行](い)った。[白](しろ)く[濁](にご)ったスープを[見](み)て。
`));
const target = createRomajiInputTarget(challenge.romajiSource ?? "", {
  preset: "hepburn",
  selections: {},
  allowSplitYoon: true,
});
const inputThroughSoupVowel = "hiruyasuminidouryoutotonkotsura-menwotabeniitta.shirokunigottasu-";

function renderDisplay(input: string) {
  const progress = getRomajiInputProgress(target, input);
  expect(progress.accepted).toBe(true);
  return renderToStaticMarkup(
    <ProductionLongDisplayText
      display={challenge.display}
      furigana={challenge.furigana ?? []}
      markerProgress={progress}
      scrollMarkerCharacterIndex={null}
      scrollMarkerProgress={progress}
      showFurigana
      showFuriganaMarker
      showKanjiMarker
    />,
  );
}

describe("Japanese display and input progress", () => {
  test("keeps katakana and the following kanji aligned with the typed reading", () => {
    const markup = renderDisplay(inputThroughSoupVowel);
    expect(markup).toContain('class="display-plain kanji-marker-current">プ</span>');
    expect(markup).toContain('class="display-ruby kanji-marker-pending">見<rt>');
    expect(markup).toContain('class="furigana-marker-pending">み</span>');

    const afterSoup = renderDisplay(`${inputThroughSoupVowel}puwo`);
    expect(afterSoup).toContain('class="display-ruby kanji-marker-current">見<rt>');
    expect(afterSoup).toContain('class="furigana-marker-current">み</span>');
  });

  test("converts exactly the completed display prefix after katakana words", () => {
    const before = createInputProgress({
      acceptsTextInput: false,
      display: challenge.display,
      furigana: challenge.furigana ?? [],
      input: inputThroughSoupVowel,
      reading: challenge.reading ?? "",
      romajiTarget: target,
    });
    expect(before.kanji).toBe("昼休みに同僚と豚骨ラーメンを食べに行った。白く濁ったすー");

    const after = createInputProgress({
      acceptsTextInput: false,
      display: challenge.display,
      furigana: challenge.furigana ?? [],
      input: `${inputThroughSoupVowel}puwo`,
      reading: challenge.reading ?? "",
      romajiTarget: target,
    });
    expect(after.kanji).toBe("昼休みに同僚と豚骨ラーメンを食べに行った。白く濁ったスープを");
  });

  test("groups katakana sokuon with its following kana for display markers", () => {
    expect(createDisplayMarkerTextParts("カップ").map(({ text }) => text)).toEqual(["カ", "ップ"]);
  });
});
