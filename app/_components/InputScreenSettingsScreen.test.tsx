import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { initialSettings } from "../_lib/constants";
import {
  calculateAnimatedMockChallengeProgress,
  calculateAnimatedMockInputProgress,
  calculateStickyPreviewScale,
  InputScreenSettingsScreen,
} from "./InputScreenSettingsScreen";

function renderInputScreenSettingsScreen(settings = initialSettings) {
  return renderToStaticMarkup(
    <InputScreenSettingsScreen
      onBack={() => undefined}
      onChange={() => undefined}
      settings={settings}
    />,
  );
}

function readGlobalCss() {
  return readFileSync("app/globals.css", "utf8");
}

function getCategoryMarkup(markup: string, categoryId: string) {
  const categoryIds = ["top-display-settings", "input-settings", "input-screen-settings"];
  const startIndex = markup.indexOf(`id="${categoryId}"`);
  const nextCategoryId = categoryIds[categoryIds.indexOf(categoryId) + 1];
  const endIndex = nextCategoryId ? markup.indexOf(`id="${nextCategoryId}"`) : markup.length;

  return startIndex >= 0 ? markup.slice(startIndex, endIndex) : "";
}

function getPreviewMarkup(markup: string) {
  const startIndex = markup.indexOf('class="input-screen-settings-preview"');
  const endIndex = markup.indexOf('class="settings-list"');

  return startIndex >= 0 && endIndex >= 0 ? markup.slice(startIndex, endIndex) : "";
}

function getCategoryLabels(markup: string) {
  return Array.from(
    markup.matchAll(/<h3[^>]*class="settings-category-title"[^>]*>(.*?)<\/h3>/g),
    (match) => match[1],
  );
}

function getCategoryItemLabels(markup: string, categoryId: string) {
  const categoryMarkup = getCategoryMarkup(markup, categoryId);

  return Array.from(categoryMarkup.matchAll(/<h4[^>]*>(.*?)<\/h4>/g))
    .filter((match) => !match[0].includes("settings-subcategory-title"))
    .filter((match) => !match[0].includes("font-size-setting"))
    .map((match) => match[1]);
}

function getInputScreenSubcategoryIds(markup: string) {
  const categoryMarkup = getCategoryMarkup(markup, "input-screen-settings");

  return Array.from(
    categoryMarkup.matchAll(/<h4[^>]*class="settings-subcategory-title"[^>]*id="([^"]+)"/g),
    (match) => match[1],
  );
}

function getCategoryOptionLabels(markup: string, categoryId: string) {
  const categoryMarkup = getCategoryMarkup(markup, categoryId);

  return Array.from(categoryMarkup.matchAll(/<label[^>]*>.*?<span>(.*?)<\/span>/g), (match) =>
    match[1],
  );
}

function getSettingRowMarkup(markup: string, rowId: string) {
  const startIndex = markup.indexOf(`aria-labelledby="${rowId}"`);
  const nextRowIndex = markup.indexOf('<section class="settings-row"', startIndex + 1);
  const nextSubcategoryIndex = markup.indexOf('<section class="settings-subcategory"', startIndex + 1);
  const endIndexes = [nextRowIndex, nextSubcategoryIndex].filter((index) => index >= 0);
  const endIndex = endIndexes.length > 0 ? Math.min(...endIndexes) : markup.length;

  return startIndex >= 0 ? markup.slice(startIndex, endIndex) : "";
}

describe("InputScreenSettingsScreen", () => {
  test("advances the mock input at 5.0 characters per second", () => {
    expect(calculateAnimatedMockInputProgress("abcdefghij", 1000)).toEqual({
      completedPrompts: 0,
      input: "abcde",
      targetLength: 10,
    });
    expect(calculateAnimatedMockInputProgress("abcdefghij", 1400)).toEqual({
      completedPrompts: 0,
      input: "abcdefg",
      targetLength: 10,
    });
    expect(calculateAnimatedMockInputProgress("abcdefghij", 2200)).toEqual({
      completedPrompts: 1,
      input: "a",
      targetLength: 10,
    });
  });

  test("alternates the animated mock input across multiple guides", () => {
    expect(calculateAnimatedMockChallengeProgress(["abc", "defgh"], 600)).toEqual({
      completedPrompts: 1,
      currentChallengeIndex: 1,
      input: "",
      nextChallengeIndex: 0,
      previousChallengeIndex: 0,
      targetLength: 5,
    });
    expect(calculateAnimatedMockChallengeProgress(["abc", "defgh"], 1000)).toEqual({
      completedPrompts: 1,
      currentChallengeIndex: 1,
      input: "de",
      nextChallengeIndex: 0,
      previousChallengeIndex: 0,
      targetLength: 5,
    });
    expect(calculateAnimatedMockChallengeProgress(["abc", "defgh"], 1600)).toEqual({
      completedPrompts: 2,
      currentChallengeIndex: 0,
      input: "",
      nextChallengeIndex: 1,
      previousChallengeIndex: 1,
      targetLength: 3,
    });
  });

  test("shows the mock practice view before the setting list", () => {
    const markup = renderInputScreenSettingsScreen();

    expect(markup.indexOf("input-screen-settings-preview")).toBeLessThan(
      markup.indexOf("settings-list"),
    );
    expect(markup).toContain("input-screen-settings-preview-sticky");
    expect(markup).toContain("input-screen-settings-preview-scale");
    expect(markup).toContain('<ruby class="display-ruby">常<rt>じょう</rt></ruby>');
    expect(markup).toContain('<ruby class="display-ruby">社<rt>しゃ</rt></ruby>');
    expect(markup).toContain("<rt>じょう</rt>");
    expect(markup).toContain('aria-label="romaji input target"');
  });

  test("labels the mock as input screen settings with a wrench icon", () => {
    const markup = renderInputScreenSettingsScreen();
    const previewMarkup = getPreviewMarkup(markup);

    expect(previewMarkup).toContain('<p class="mode-label">入力画面設定</p>');
    expect(previewMarkup).toContain("lucide-wrench");
    expect(previewMarkup).not.toContain("lucide-crosshair");
    expect(previewMarkup).not.toContain('<p class="mode-label">正確無比</p>');
  });

  test("uses the mock primary action as a pause control", () => {
    const markup = renderInputScreenSettingsScreen();
    const previewMarkup = getPreviewMarkup(markup);

    expect(previewMarkup).toContain('title="一時停止"');
    expect(previewMarkup).toContain("lucide-pause");
    expect(previewMarkup).toContain('title="リセット"');
    expect(previewMarkup).not.toContain('title="開始"');
  });

  test("treats the input screen mock as two alternating sentences", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      nextChallengePreviewLength: 2,
    });
    const previewMarkup = getPreviewMarkup(markup);

    expect(previewMarkup).toContain('class="challenge-preview-layout split-slide"');
    expect(previewMarkup).toContain('class="challenge-preview-lane next-lane bottom-lane"');
    expect(previewMarkup).toContain('<ruby class="display-ruby">不<rt>ふ</rt></ruby>');
    expect(previewMarkup).toContain('<p class="reading-text">ふしぎ');
    expect(previewMarkup).toContain('<p class="input-target" aria-label="romaji input target"><span class="char correct">j</span>');
    expect(previewMarkup).not.toContain("<strong>常務</strong>");
  });

  test("does not limit the visible next challenge by preview length", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      nextChallengePreviewLength: 0,
      nextChallengePreviewMode: "split-slide",
    });
    const previewMarkup = getPreviewMarkup(markup);

    expect(previewMarkup).toContain('class="challenge-preview-lane next-lane bottom-lane"');
    expect(previewMarkup).toContain('<ruby class="display-ruby">不<rt>ふ</rt></ruby>');
    expect(previewMarkup).toContain('<p class="reading-text">ふしぎ');
  });

  test("shows a prohibited marker when hovering the mock back button", () => {
    const markup = renderInputScreenSettingsScreen();
    const previewMarkup = getPreviewMarkup(markup);
    const css = readGlobalCss();

    expect(previewMarkup).toContain('<div class="actions"><button class="icon-button"');
    expect(css).toContain(
      ".input-screen-settings-preview .actions .icon-button:first-child:hover::after",
    );
    expect(css).toContain('content: "🚫";');
  });

  test("groups migrated settings under input method and input screen categories", () => {
    const markup = renderInputScreenSettingsScreen();

    expect(getCategoryLabels(markup)).toEqual(["上部表示情報", "入力方式", "入力画面"]);
    expect(getCategoryItemLabels(markup, "top-display-settings")).toEqual(["表示する情報"]);
    expect(getCategoryItemLabels(markup, "input-settings")).toEqual([
      "ローマ字入力法",
      "促音入力",
      "一般拗音分割入力",
      "特殊拗音分割入力",
    ]);
    expect(getCategoryItemLabels(markup, "input-screen-settings")).toEqual([
      "漢字表示",
      "漢字マーカー",
      "ふりがな表示",
      "ふりがなマーカー",
      "ひらがな表示",
      "ひらがなマーカー",
      "ローマ字マーカー",
      "次の課題の表示方式",
      "正確無比の誤入力表示",
    ]);
  });

  test("splits input screen settings into kanji, furigana, hiragana, and romaji groups", () => {
    const markup = renderInputScreenSettingsScreen();

    expect(getInputScreenSubcategoryIds(markup)).toEqual([
      "kanji-input-screen-settings",
      "furigana-input-screen-settings",
      "hiragana-input-screen-settings",
      "romaji-input-screen-settings",
      "other-input-screen-settings",
    ]);
  });

  test("shows input screen font size controls with default values", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");

    expect(inputScreenMarkup).toContain('aria-label="kanji font size"');
    expect(inputScreenMarkup).toContain('aria-label="furigana font scale"');
    expect(inputScreenMarkup).toContain('aria-label="hiragana font size"');
    expect(inputScreenMarkup).toContain('aria-label="romaji font size"');
    expect(inputScreenMarkup).toContain('value="32"');
    expect(inputScreenMarkup).toContain('value="0.42"');
    expect(getSettingRowMarkup(inputScreenMarkup, "furigana-font-scale-setting")).toContain(
      "<span>倍</span>",
    );
    expect(inputScreenMarkup).toContain('value="24"');
    expect(inputScreenMarkup).toContain('value="20"');
  });

  test("shows line height and bottom spacing controls for each input screen text group", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");

    expect(inputScreenMarkup).toContain('aria-label="kanji line height"');
    expect(inputScreenMarkup).toContain('aria-label="kanji bottom spacing"');
    expect(inputScreenMarkup).toContain('aria-label="furigana line height"');
    expect(inputScreenMarkup).toContain('aria-label="furigana bottom spacing"');
    expect(inputScreenMarkup).toContain('aria-label="hiragana line height"');
    expect(inputScreenMarkup).toContain('aria-label="hiragana bottom spacing"');
    expect(inputScreenMarkup).toContain('aria-label="romaji line height"');
    expect(inputScreenMarkup).toContain('aria-label="romaji bottom spacing"');
    expect(getSettingRowMarkup(inputScreenMarkup, "kanji-line-height-setting")).toContain(
      'value="1.45"',
    );
    expect(getSettingRowMarkup(inputScreenMarkup, "kanji-bottom-spacing-setting")).toContain(
      'value="6"',
    );
    expect(getSettingRowMarkup(inputScreenMarkup, "furigana-line-height-setting")).toContain(
      'value="1.1"',
    );
    expect(getSettingRowMarkup(inputScreenMarkup, "furigana-bottom-spacing-setting")).toContain(
      'value="0"',
    );
  });

  test("adds steppers to every ratio and pixel number control in input screen settings", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");

    expect(Array.from(inputScreenMarkup.matchAll(/class="number-control/g))).toHaveLength(12);
    expect(Array.from(inputScreenMarkup.matchAll(/class="number-stepper"/g))).toHaveLength(12);
    expect(inputScreenMarkup).toContain('aria-label="kanji font size を増やす"');
    expect(inputScreenMarkup).toContain('aria-label="furigana font scale を減らす"');
    expect(inputScreenMarkup).toContain('aria-label="romaji bottom spacing を増やす"');
  });

  test("adds default reset buttons to every ratio and pixel number control", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      kanjiFontSize: 40,
      furiganaFontScale: 0.5,
      romajiMarginBottom: 12,
    });
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const kanjiFontSizeMarkup = getSettingRowMarkup(inputScreenMarkup, "kanji-font-size-setting");
    const furiganaScaleMarkup = getSettingRowMarkup(
      inputScreenMarkup,
      "furigana-font-scale-setting",
    );
    const romajiBottomSpacingMarkup = getSettingRowMarkup(
      inputScreenMarkup,
      "romaji-bottom-spacing-setting",
    );

    expect(Array.from(inputScreenMarkup.matchAll(/class="number-reset-button"/g))).toHaveLength(
      12,
    );
    expect(kanjiFontSizeMarkup).toContain('aria-label="kanji font size を初期値に戻す"');
    expect(kanjiFontSizeMarkup).not.toContain('class="number-reset-button" disabled=""');
    expect(furiganaScaleMarkup).toContain('aria-label="furigana font scale を初期値に戻す"');
    expect(furiganaScaleMarkup).not.toContain('class="number-reset-button" disabled=""');
    expect(romajiBottomSpacingMarkup).toContain(
      'aria-label="romaji bottom spacing を初期値に戻す"',
    );
    expect(romajiBottomSpacingMarkup).not.toContain('class="number-reset-button" disabled=""');
  });

  test("places strict mistake display under other input screen settings", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const otherMarkup = inputScreenMarkup.slice(
      inputScreenMarkup.indexOf('id="other-input-screen-settings"'),
    );

    expect(otherMarkup).toContain("その他の設定");
    expect(otherMarkup).toContain("次の課題の表示方式");
    expect(otherMarkup).toContain("正確無比の誤入力表示");
  });

  test("shows next challenge preview mode choices with split slide selected by default", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const previewModeMarkup = getSettingRowMarkup(
      inputScreenMarkup,
      "next-challenge-preview-mode-setting",
    );

    expect(previewModeMarkup).toContain('aria-label="次の課題の表示方式"');
    expect(previewModeMarkup).toContain("スライド");
    expect(previewModeMarkup).toContain("交代");
    expect(previewModeMarkup).toContain("中央揃え");
    expect(previewModeMarkup).not.toContain("1A スライド");
    expect(previewModeMarkup).not.toContain("1B 交代");
    expect(previewModeMarkup).not.toContain("2 中央揃え");
    expect(previewModeMarkup).toContain("非表示");
    expect(previewModeMarkup).toContain('aria-pressed="true"');
  });

  test("locks the furigana font scale while furigana is hidden", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      showFuriganaDisplay: false,
    });
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const furiganaScaleMarkup = getSettingRowMarkup(
      inputScreenMarkup,
      "furigana-font-scale-setting",
    );

    expect(furiganaScaleMarkup).toContain('aria-label="furigana font scale"');
    expect(furiganaScaleMarkup).toContain('disabled=""');
    expect(furiganaScaleMarkup).toContain('class="number-lock-icon"');
    expect(furiganaScaleMarkup).toContain('aria-label="furigana font scale を増やす" disabled=""');
    expect(furiganaScaleMarkup).toContain('aria-label="furigana font scale を減らす" disabled=""');
    expect(furiganaScaleMarkup).toContain('aria-label="furigana font scale を初期値に戻す"');
    expect(furiganaScaleMarkup).toContain('class="number-reset-button" disabled=""');
  });

  test("shows all top display metric choices without requiring remaining time", () => {
    const markup = renderInputScreenSettingsScreen();
    const topDisplayMarkup = getCategoryMarkup(markup, "top-display-settings");

    expect(getCategoryOptionLabels(markup, "top-display-settings")).toEqual([
      "残り時間",
      "残り時間（％）",
      "打鍵/秒",
      "打鍵/分",
      "正確率",
      "ミス数",
      "物理打鍵",
      "完了課題",
      "ミス/物理打鍵",
      "正解/物理打鍵",
    ]);
    expect(topDisplayMarkup).toContain("残り時間を外しても、残り時間バーは表示されます。");
    expect(topDisplayMarkup).not.toContain("disabled");
  });

  test("shows strict accuracy mistake display choices with overwrite selected by default", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");

    expect(inputScreenMarkup).toContain('aria-label="正確無比の誤入力表示"');
    expect(inputScreenMarkup).toContain("上書き");
    expect(inputScreenMarkup).toContain("挿入");
    expect(inputScreenMarkup).toContain("何もしない");
    expect(inputScreenMarkup).toContain('aria-pressed="true"');
  });

  test("shows kanji, furigana, and hiragana input screen visibility toggles enabled by default", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");

    expect(inputScreenMarkup).toContain("漢字表示");
    expect(inputScreenMarkup).toContain("ふりがな表示");
    expect(inputScreenMarkup).toContain("ひらがな表示");
    expect(inputScreenMarkup).toContain('aria-label="漢字表示"');
    expect(inputScreenMarkup).toContain('aria-label="ふりがな表示"');
    expect(inputScreenMarkup).toContain('aria-label="ひらがな表示"');
    expect(getSettingRowMarkup(inputScreenMarkup, "kanji-display-setting")).toContain(
      'checked=""',
    );
    expect(getSettingRowMarkup(inputScreenMarkup, "furigana-display-setting")).toContain(
      'checked=""',
    );
    expect(getSettingRowMarkup(inputScreenMarkup, "hiragana-display-setting")).toContain(
      'checked=""',
    );
  });

  test("shows marker visibility toggles with hiragana and romaji enabled by default", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");

    expect(inputScreenMarkup).toContain("漢字マーカー");
    expect(inputScreenMarkup).toContain("ふりがなマーカー");
    expect(inputScreenMarkup).toContain("ひらがなマーカー");
    expect(inputScreenMarkup).toContain("ローマ字マーカー");
    expect(inputScreenMarkup).toContain("ON推奨");

    expect(getSettingRowMarkup(inputScreenMarkup, "kanji-marker-setting")).not.toContain(
      'checked=""',
    );
    expect(getSettingRowMarkup(inputScreenMarkup, "furigana-marker-setting")).not.toContain(
      'checked=""',
    );
    expect(getSettingRowMarkup(inputScreenMarkup, "hiragana-marker-setting")).toContain(
      'checked=""',
    );
    expect(getSettingRowMarkup(inputScreenMarkup, "romaji-marker-setting")).toContain(
      'checked=""',
    );
  });

  test("locks marker toggles when matching display targets are hidden", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      showFuriganaDisplay: true,
      showFuriganaMarker: true,
      showHiraganaDisplay: false,
      showHiraganaMarker: true,
      showKanjiDisplay: false,
      showKanjiMarker: true,
      showRomajiMarker: true,
    });
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const kanjiMarkerMarkup = getSettingRowMarkup(inputScreenMarkup, "kanji-marker-setting");
    const furiganaMarkerMarkup = getSettingRowMarkup(
      inputScreenMarkup,
      "furigana-marker-setting",
    );
    const hiraganaMarkerMarkup = getSettingRowMarkup(
      inputScreenMarkup,
      "hiragana-marker-setting",
    );
    const romajiMarkerMarkup = getSettingRowMarkup(inputScreenMarkup, "romaji-marker-setting");

    expect(kanjiMarkerMarkup).toContain('disabled=""');
    expect(kanjiMarkerMarkup).toContain('class="toggle-lock-icon"');
    expect(kanjiMarkerMarkup).not.toContain('checked=""');
    expect(furiganaMarkerMarkup).toContain('disabled=""');
    expect(furiganaMarkerMarkup).toContain('class="toggle-lock-icon"');
    expect(furiganaMarkerMarkup).not.toContain('checked=""');
    expect(hiraganaMarkerMarkup).toContain('disabled=""');
    expect(hiraganaMarkerMarkup).toContain('class="toggle-lock-icon"');
    expect(hiraganaMarkerMarkup).not.toContain('checked=""');
    expect(romajiMarkerMarkup).not.toContain('disabled=""');
    expect(romajiMarkerMarkup).not.toContain('class="toggle-lock-icon"');
    expect(romajiMarkerMarkup).toContain('checked=""');
  });

  test("turns off and disables furigana display when kanji display is off", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      showKanjiDisplay: false,
      showFuriganaDisplay: true,
    });
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const furiganaControlIndex = inputScreenMarkup.indexOf('aria-label="ふりがな表示"');
    const hiraganaControlIndex = inputScreenMarkup.indexOf('aria-label="ひらがな表示"');
    const furiganaControlMarkup = inputScreenMarkup.slice(
      furiganaControlIndex,
      hiraganaControlIndex,
    );

    expect(furiganaControlMarkup).toContain('disabled=""');
    expect(furiganaControlMarkup).toContain('class="toggle-lock-icon"');
    expect(furiganaControlMarkup).toContain('aria-label="漢字表示オフのためロック"');
    expect(furiganaControlMarkup).not.toContain('checked=""');
  });

  test("keeps the sticky preview unscaled while it fits within half the viewport", () => {
    expect(calculateStickyPreviewScale(400, 900)).toBe(1);
  });

  test("scales the sticky preview down to half the viewport when it is too tall", () => {
    expect(calculateStickyPreviewScale(900, 1000)).toBeCloseTo(0.555, 2);
  });

  test("ignores invalid preview measurements", () => {
    expect(calculateStickyPreviewScale(0, 1000)).toBe(1);
    expect(calculateStickyPreviewScale(600, 0)).toBe(1);
  });
});
