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

function readTypingPanelCss() {
  return readFileSync("app/_components/TypingPanel.module.css", "utf8");
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
    .map((match) => match[1])
    .filter((label) => label !== "ランク算出方式");
}

function getInputScreenSubcategoryIds(markup: string) {
  const categoryMarkup = getCategoryMarkup(markup, "input-screen-settings");

  return Array.from(
    categoryMarkup.matchAll(/<h4[^>]*class="settings-subcategory-title"[^>]*id="([^"]+)"/g),
    (match) => match[1],
  );
}

function getInputScreenSubcategoryMarkup(markup: string, subcategoryId: string) {
  const categoryMarkup = getCategoryMarkup(markup, "input-screen-settings");
  const titleIndex = categoryMarkup.indexOf(`id="${subcategoryId}"`);
  const sectionStartIndex = categoryMarkup.lastIndexOf("<section", titleIndex);
  const nextSectionIndex = categoryMarkup.indexOf(
    '<section class="settings-subcategory"',
    titleIndex + 1,
  );
  const endIndex = nextSectionIndex >= 0 ? nextSectionIndex : categoryMarkup.length;

  return sectionStartIndex >= 0 ? categoryMarkup.slice(sectionStartIndex, endIndex) : "";
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

  test("starts the mock preview in 5.0 keys-per-second playback mode", () => {
    const markup = renderInputScreenSettingsScreen();
    const previewMarkup = getPreviewMarkup(markup);

    expect(previewMarkup).toContain('title="5.0打鍵/秒プレビュー"');
    expect(previewMarkup).toContain("lucide-play");
    expect(previewMarkup).toContain('title="リセット"');
    expect(previewMarkup).not.toContain('title="一時停止"');
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
    const css = readTypingPanelCss();

    expect(previewMarkup).toContain('<div class="actions"><button class="icon-button"');
    expect(css).toContain(
      ".previewPanel .actions .iconButton:first-child:hover::after",
    );
    expect(css).toContain('content: "X";');
  });

  test("groups migrated settings under input method and input screen categories", () => {
    const markup = renderInputScreenSettingsScreen();

    expect(getCategoryLabels(markup)).toEqual(["上部表示情報", "入力方式", "入力画面"]);
    expect(getCategoryItemLabels(markup, "top-display-settings")).toEqual(["表示する情報"]);
    expect(getCategoryItemLabels(markup, "input-settings")).toEqual([
      "ローマ字入力法",
      "促音入力",
      "一般拗音分割入力",
      "特殊拗音入力法",
    ]);
    expect(getCategoryItemLabels(markup, "input-screen-settings")).toEqual([
      "入力画面の表示順",
      "漢字表示",
      "漢字マーカー",
      "入力途中経過（漢字）表示",
      "ふりがな表示",
      "ふりがなマーカー",
      "ひらがな表示",
      "ひらがなマーカー",
      "入力途中経過（ひらがな）表示",
      "ローマ字マーカー",
      "次の課題の表示方式",
      "正確無比の誤入力表示",
    ]);
  });

  test("shows custom foreign katakana romaji preferences under the special yoon setting", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      romajiInputPreset: "custom",
      specialRomajiInputPreset: "custom",
    });
    const inputMethodMarkup = getCategoryMarkup(markup, "input-settings");
    const romajiMethodMarkup = getSettingRowMarkup(inputMethodMarkup, "romaji-method-setting");
    const specialYoonMarkup = getSettingRowMarkup(inputMethodMarkup, "special-yoon-method-setting");

    expect(romajiMethodMarkup).not.toContain("てぃ");
    expect(romajiMethodMarkup).not.toContain("ゔぃ");
    expect(specialYoonMarkup).toContain("すべて分割");
    expect(specialYoonMarkup).toContain("すべて統合");
    expect(specialYoonMarkup).toContain("個別設定");
    expect(specialYoonMarkup).toContain("うぃ");
    expect(specialYoonMarkup).toContain("wi");
    expect(specialYoonMarkup).toContain("whi");
    expect(specialYoonMarkup).toContain("てぃ");
    expect(specialYoonMarkup).toContain("thi");
    expect(specialYoonMarkup).toContain("texi");
    expect(specialYoonMarkup).toContain("ゔぃ");
    expect(specialYoonMarkup).toContain("vi");
    expect(specialYoonMarkup).toContain("vuxi");
    expect(specialYoonMarkup).toContain("ゔぇ");
    expect(specialYoonMarkup).toContain("ve");
    expect(specialYoonMarkup).toContain("vuxe");
    expect(specialYoonMarkup).toContain("でゅ");
    expect(specialYoonMarkup).toContain("dhu");
    expect(specialYoonMarkup).toContain("dexyu");
  });

  test("splits input screen settings into kanji, furigana, hiragana, and romaji groups", () => {
    const markup = renderInputScreenSettingsScreen();

    expect(getInputScreenSubcategoryIds(markup)).toEqual([
      "font-family-input-screen-settings",
      "target-display-order-input-screen-settings",
      "kanji-input-screen-settings",
      "kanji-input-progress-screen-settings",
      "furigana-input-screen-settings",
      "hiragana-input-screen-settings",
      "hiragana-input-progress-screen-settings",
      "romaji-input-screen-settings",
      "other-input-screen-settings",
    ]);
  });

  test("shows a draggable display order setting including hidden elements", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      showKanjiDisplay: false,
      showHiraganaInputProgress: false,
      showHiraganaDisplay: true,
      showKanjiInputProgress: true,
    });
    const orderMarkup = getInputScreenSubcategoryMarkup(
      markup,
      "target-display-order-input-screen-settings",
    );

    expect(orderMarkup).toContain('aria-label="target display order"');
    expect(orderMarkup.match(/display order item/g)?.length).toBe(5);
    expect(orderMarkup.match(/draggable="true"/g)?.length).toBe(5);
    expect(orderMarkup.match(/hidden-item/g)?.length).toBe(3);
    expect(orderMarkup.match(/target-display-order-buttons/g)?.length).toBe(5);
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

  test("shows Japanese and English font family choices", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      englishFontFamily: "roboto",
      japaneseFontFamily: "biz-udp-gothic",
    });
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const japaneseFontMarkup = getSettingRowMarkup(
      inputScreenMarkup,
      "japanese-font-family-setting",
    );
    const englishFontMarkup = getSettingRowMarkup(
      inputScreenMarkup,
      "english-font-family-setting",
    );

    expect(japaneseFontMarkup).toContain('aria-label="Japanese font family"');
    expect(japaneseFontMarkup).toContain('value="noto-sans-jp"');
    expect(japaneseFontMarkup).toContain('value="biz-udp-gothic" selected=""');
    expect(japaneseFontMarkup).toContain('value="m-plus-1"');
    expect(japaneseFontMarkup).toContain('value="noto-serif-jp"');
    expect(japaneseFontMarkup).not.toContain("Kosugi Maru");
    expect(englishFontMarkup).toContain('aria-label="English font family"');
    expect(englishFontMarkup).toContain('value="inter"');
    expect(englishFontMarkup).toContain('value="roboto" selected=""');
    expect(englishFontMarkup).toContain('value="noto-sans"');
    expect(englishFontMarkup).toContain('value="source-code-pro"');
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

  test("shows input progress controls in dedicated subcategories when enabled", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      showKanjiInputProgress: true,
      showHiraganaInputProgress: true,
    });
    const kanjiMarkup = getInputScreenSubcategoryMarkup(markup, "kanji-input-screen-settings");
    const kanjiProgressMarkup = getInputScreenSubcategoryMarkup(
      markup,
      "kanji-input-progress-screen-settings",
    );
    const hiraganaMarkup = getInputScreenSubcategoryMarkup(
      markup,
      "hiragana-input-screen-settings",
    );
    const hiraganaProgressMarkup = getInputScreenSubcategoryMarkup(
      markup,
      "hiragana-input-progress-screen-settings",
    );

    expect(kanjiMarkup).not.toContain("入力途中経過（漢字）表示");
    expect(hiraganaMarkup).not.toContain("入力途中経過（ひらがな）表示");
    expect(kanjiProgressMarkup).toContain("入力途中経過（漢字）");
    expect(kanjiProgressMarkup).toContain("入力途中経過（漢字）表示");
    expect(kanjiProgressMarkup).toContain('aria-label="kanji input progress font size"');
    expect(kanjiProgressMarkup).toContain('aria-label="kanji input progress line height"');
    expect(kanjiProgressMarkup).toContain('aria-label="kanji input progress bottom spacing"');
    expect(hiraganaProgressMarkup).toContain("入力途中経過（ひらがな）");
    expect(hiraganaProgressMarkup).toContain("入力途中経過（ひらがな）表示");
    expect(hiraganaProgressMarkup).toContain(
      'aria-label="hiragana input progress font size"',
    );
    expect(hiraganaProgressMarkup).toContain(
      'aria-label="hiragana input progress line height"',
    );
    expect(hiraganaProgressMarkup).toContain(
      'aria-label="hiragana input progress bottom spacing"',
    );
  });

  test("hides input progress detail controls while input progress is off", () => {
    const markup = renderInputScreenSettingsScreen();
    const kanjiProgressMarkup = getInputScreenSubcategoryMarkup(
      markup,
      "kanji-input-progress-screen-settings",
    );
    const hiraganaProgressMarkup = getInputScreenSubcategoryMarkup(
      markup,
      "hiragana-input-progress-screen-settings",
    );

    expect(kanjiProgressMarkup).toContain("入力途中経過（漢字）表示");
    expect(kanjiProgressMarkup).not.toContain("入力途中経過（漢字）フォントサイズ");
    expect(kanjiProgressMarkup).not.toContain("入力途中経過（漢字）の行間");
    expect(kanjiProgressMarkup).not.toContain("入力途中経過（漢字）の下余白");
    expect(hiraganaProgressMarkup).toContain("入力途中経過（ひらがな）表示");
    expect(hiraganaProgressMarkup).not.toContain("入力途中経過（ひらがな）フォントサイズ");
    expect(hiraganaProgressMarkup).not.toContain("入力途中経過（ひらがな）の行間");
    expect(hiraganaProgressMarkup).not.toContain("入力途中経過（ひらがな）の下余白");
  });

  test("adds steppers to every ratio and pixel number control in input screen settings", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");

    expect(Array.from(inputScreenMarkup.matchAll(/class="number-control/g))).toHaveLength(13);
    expect(Array.from(inputScreenMarkup.matchAll(/class="number-stepper"/g))).toHaveLength(13);
    expect(inputScreenMarkup).toContain('aria-label="kanji font size を増やす"');
    expect(inputScreenMarkup).toContain('aria-label="furigana font scale を減らす"');
    expect(inputScreenMarkup).toContain('aria-label="romaji bottom spacing を増やす"');
    expect(inputScreenMarkup).toContain(
      'aria-label="long text kanji area height を増やす"',
    );
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
      13,
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
    expect(otherMarkup).toContain("長文モードの漢字文エリアの高さ");
    expect(otherMarkup).toContain("正確無比の誤入力表示");
  });

  test("shows the production long kanji area height under other settings", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      productionLongTextLineCount: 6,
    });
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const rowMarkup = getSettingRowMarkup(
      inputScreenMarkup,
      "production-long-text-line-count-setting",
    );
    const previewMarkup = getPreviewMarkup(markup);

    expect(rowMarkup).toContain("長文モードの漢字文エリアの高さ");
    expect(rowMarkup).toContain("本番（IMEなし）の漢字文を表示する行数");
    expect(rowMarkup).toContain('aria-label="long text kanji area height"');
    expect(rowMarkup).toContain('value="6"');
    expect(rowMarkup).toContain("<span>行</span>");
    expect(previewMarkup).toContain("--target-production-long-lines:6");
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

  test("hides the furigana font scale while furigana is hidden", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      showFuriganaDisplay: false,
    });
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const furiganaScaleMarkup = getSettingRowMarkup(
      inputScreenMarkup,
      "furigana-font-scale-setting",
    );

    expect(inputScreenMarkup).toContain("ふりがな表示");
    expect(furiganaScaleMarkup).toBe("");
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

  test("shows rank calculation mode choices with projected selected by default", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const rowMarkup = getSettingRowMarkup(inputScreenMarkup, "rank-calculation-mode-setting");
    expect(rowMarkup).toContain('class="rank-calculation-segmented"');

    expect(rowMarkup).toContain('aria-label="ランク算出方式"');
    expect(rowMarkup).toContain("予測値（変動方式）");
    expect(rowMarkup).toContain("実値（加点方式）");
    expect(rowMarkup).toContain('aria-pressed="true"');
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
    expect(inputScreenMarkup).toContain("入力途中経過（漢字）");
    expect(inputScreenMarkup).toContain("入力途中経過（ひらがな）");
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
    expect(getSettingRowMarkup(inputScreenMarkup, "kanji-input-progress-setting")).not.toContain(
      'checked=""',
    );
    expect(
      getSettingRowMarkup(inputScreenMarkup, "hiragana-input-progress-setting"),
    ).not.toContain('checked=""');
  });

  test("hides kanji, furigana, and hiragana detail settings when their display is off", () => {
    const markup = renderInputScreenSettingsScreen({
      ...initialSettings,
      showFuriganaDisplay: false,
      showHiraganaDisplay: false,
      showKanjiDisplay: false,
    });
    const kanjiMarkup = getInputScreenSubcategoryMarkup(markup, "kanji-input-screen-settings");
    const furiganaMarkup = getInputScreenSubcategoryMarkup(
      markup,
      "furigana-input-screen-settings",
    );
    const hiraganaMarkup = getInputScreenSubcategoryMarkup(
      markup,
      "hiragana-input-screen-settings",
    );

    expect(kanjiMarkup).toContain("settings-subcategory");
    expect(kanjiMarkup).toContain('aria-label="漢字表示"');
    expect(kanjiMarkup).toContain("漢字表示</h4>");
    expect(kanjiMarkup).not.toContain("漢字マーカー");
    expect(kanjiMarkup).not.toContain("入力途中経過（漢字）");
    expect(kanjiMarkup).not.toContain("漢字フォントサイズ");
    expect(kanjiMarkup).not.toContain("漢字の行間");
    expect(kanjiMarkup).not.toContain("漢字の下余白");
    expect(furiganaMarkup).toContain("settings-subcategory");
    expect(furiganaMarkup).toContain('aria-label="ふりがな表示"');
    expect(furiganaMarkup).toContain("ふりがな表示</h4>");
    expect(furiganaMarkup).not.toContain("ふりがなマーカー");
    expect(furiganaMarkup).not.toContain("ふりがなフォント倍率");
    expect(furiganaMarkup).not.toContain("ふりがなの行間");
    expect(furiganaMarkup).not.toContain("ふりがなの下余白");
    expect(hiraganaMarkup).toContain("settings-subcategory");
    expect(hiraganaMarkup).toContain('aria-label="ひらがな表示"');
    expect(hiraganaMarkup).toContain("ひらがな表示</h4>");
    expect(hiraganaMarkup).not.toContain("ひらがなマーカー");
    expect(hiraganaMarkup).not.toContain("入力途中経過（ひらがな）");
    expect(hiraganaMarkup).not.toContain("ひらがなフォントサイズ");
    expect(hiraganaMarkup).not.toContain("ひらがなの行間");
    expect(hiraganaMarkup).not.toContain("ひらがなの下余白");
  });

  test("shows romaji marker mode choices under the romaji input screen group", () => {
    const markup = renderInputScreenSettingsScreen();
    const inputScreenMarkup = getCategoryMarkup(markup, "input-screen-settings");
    const romajiMarkup = inputScreenMarkup.slice(
      inputScreenMarkup.indexOf('id="romaji-input-screen-settings"'),
      inputScreenMarkup.indexOf('id="other-input-screen-settings"'),
    );
    const rowMarkup = getSettingRowMarkup(romajiMarkup, "romaji-marker-mode-setting");

    expect(rowMarkup).toContain("ローマ字マーカー単位");
    expect(rowMarkup).toContain('aria-label="romaji marker mode"');
    expect(rowMarkup).toContain("文字単位");
    expect(rowMarkup).toContain("発音単位");
    expect(rowMarkup).toContain('aria-pressed="true"');
  });

  test("hides marker toggles when matching display targets are hidden", () => {
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

    expect(kanjiMarkerMarkup).toBe("");
    expect(furiganaMarkerMarkup).toBe("");
    expect(hiraganaMarkerMarkup).toBe("");
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
