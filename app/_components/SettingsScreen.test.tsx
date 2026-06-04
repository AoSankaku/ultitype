import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { initialSettings } from "../_lib/constants";
import { SettingsScreen } from "./SettingsScreen";

function renderSettingsScreen(settings = initialSettings) {
  return renderToStaticMarkup(
    <SettingsScreen
      onBack={() => undefined}
      onChange={() => undefined}
      onClearLocalData={() => undefined}
      settings={settings}
    />,
  );
}

function renderMutedSettingsScreen() {
  return renderToStaticMarkup(
    <SettingsScreen
      browserTabMuted={true}
      onBack={() => undefined}
      onChange={() => undefined}
      onClearLocalData={() => undefined}
      settings={initialSettings}
    />,
  );
}

function getCategoryMarkup(markup: string, categoryId: string) {
  const categoryIds = [
    "screen-settings",
    "sound-settings",
    "auto-retire-settings",
    "other-settings",
    "danger-settings",
  ];
  const startIndex = markup.indexOf(`id="${categoryId}"`);
  const nextCategoryId = categoryIds[categoryIds.indexOf(categoryId) + 1];
  const endIndex = nextCategoryId ? markup.indexOf(`id="${nextCategoryId}"`) : markup.length;

  return startIndex >= 0 ? markup.slice(startIndex, endIndex) : "";
}

function getCategoryLabels(markup: string) {
  return Array.from(
    markup.matchAll(/<h3[^>]*class="settings-category-title"[^>]*>(.*?)<\/h3>/g),
    (match) => match[1],
  );
}

function getCategoryItemLabels(markup: string, categoryId: string) {
  const categoryMarkup = getCategoryMarkup(markup, categoryId);

  return Array.from(categoryMarkup.matchAll(/<h4[^>]*>(.*?)<\/h4>/g), (match) =>
    match[1],
  );
}

describe("SettingsScreen", () => {
  test("groups settings by category in the requested order", () => {
    const markup = renderSettingsScreen();

    expect(getCategoryLabels(markup)).toEqual([
      "画面",
      "サウンド",
      "自動リタイア",
      "その他の設定",
      "危険な操作",
    ]);
  });

  test("keeps settings under the matching categories", () => {
    const markup = renderSettingsScreen();

    expect(getCategoryItemLabels(markup, "screen-settings")).toEqual([
      "テーマ",
      "入力画面と入力方式",
    ]);
    expect(getCategoryItemLabels(markup, "sound-settings")).toEqual(["サウンド"]);
    expect(getCategoryItemLabels(markup, "auto-retire-settings")).toEqual([
      "無入力リタイア",
      "連続誤打鍵リタイア",
      "正誤率ボーダー",
    ]);
    expect(getCategoryItemLabels(markup, "other-settings")).toEqual([
      "次の課題の表示文字数",
    ]);
    expect(getCategoryItemLabels(markup, "danger-settings")).toEqual([
      "ローカルデータをすべて削除",
    ]);
  });

  test("links to the dedicated input screen settings page", () => {
    const markup = renderSettingsScreen();
    const screenMarkup = getCategoryMarkup(markup, "screen-settings");

    expect(screenMarkup).toContain('href="/settings/screen"');
    expect(screenMarkup).toContain("入力画面と入力方式");
  });

  test("disables sound controls when the active Chrome tab is muted", () => {
    const markup = renderMutedSettingsScreen();
    const soundMarkup = getCategoryMarkup(markup, "sound-settings");

    expect(soundMarkup).toContain('aria-disabled="true"');
    expect(Array.from(soundMarkup.matchAll(/disabled=""/g))).toHaveLength(3);
  });

  test("does not show settings now handled by input screen settings", () => {
    const markup = renderSettingsScreen();
    const screenMarkup = getCategoryMarkup(markup, "screen-settings");

    expect(screenMarkup).not.toContain("速度表示");
    expect(screenMarkup).not.toContain("日本語ガイドのスペース");
    expect(screenMarkup).not.toContain("打鍵/秒");
    expect(screenMarkup).not.toContain("打鍵/分");
  });

  test("shows auto retire performance settings disabled by default", () => {
    const markup = renderSettingsScreen();
    const autoRetireMarkup = getCategoryMarkup(markup, "auto-retire-settings");

    expect(autoRetireMarkup).toContain("連続誤打鍵リタイア");
    expect(autoRetireMarkup).toContain('aria-label="連続誤打鍵数"');
    expect(autoRetireMarkup).toContain("正誤率ボーダー");
    expect(autoRetireMarkup).toContain('aria-label="正誤率ボーダー"');
    expect(autoRetireMarkup).toContain('value="0"');
  });

  test("shows the next challenge preview length setting under other settings", () => {
    const markup = renderSettingsScreen();
    const otherMarkup = getCategoryMarkup(markup, "other-settings");

    expect(otherMarkup).toContain("次の課題の表示文字数");
    expect(otherMarkup).toContain("短文練習モードで次に出る課題文の冒頭を表示する");
    expect(otherMarkup).toContain('aria-label="次の課題の表示文字数"');
    expect(otherMarkup).toContain('value="8"');
  });
});
