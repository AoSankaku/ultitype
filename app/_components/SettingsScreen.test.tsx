import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { initialSettings } from "../_lib/constants";
import { SettingsScreen } from "./SettingsScreen";

function renderSettingsScreen() {
  return renderToStaticMarkup(
    <SettingsScreen
      onBack={() => undefined}
      onChange={() => undefined}
      onClearLocalData={() => undefined}
      settings={initialSettings}
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
    "input-settings",
    "auto-retire-settings",
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
      "入力方式",
      "自動リタイア",
      "危険な操作",
    ]);
  });

  test("keeps settings under the matching categories", () => {
    const markup = renderSettingsScreen();

    expect(getCategoryItemLabels(markup, "screen-settings")).toEqual([
      "テーマ",
      "速度表示",
      "日本語ローマ字のスペース",
    ]);
    expect(getCategoryItemLabels(markup, "sound-settings")).toEqual(["サウンド"]);
    expect(getCategoryItemLabels(markup, "input-settings")).toEqual([
      "ローマ字入力法",
      "促音入力",
      "拗音分割入力",
    ]);
    expect(getCategoryItemLabels(markup, "auto-retire-settings")).toEqual(["無入力リタイア"]);
    expect(getCategoryItemLabels(markup, "danger-settings")).toEqual([
      "ローカルデータをすべて削除",
    ]);
  });

  test("disables sound controls when the active Chrome tab is muted", () => {
    const markup = renderMutedSettingsScreen();
    const soundMarkup = getCategoryMarkup(markup, "sound-settings");

    expect(soundMarkup).toContain('aria-disabled="true"');
    expect(Array.from(soundMarkup.matchAll(/disabled=""/g))).toHaveLength(3);
  });

  test("shows the speed display setting", () => {
    const markup = renderSettingsScreen();
    const screenMarkup = getCategoryMarkup(markup, "screen-settings");

    expect(screenMarkup).toContain("速度表示");
    expect(screenMarkup).toContain("打鍵/秒");
    expect(screenMarkup).toContain("打鍵/分");
    expect(screenMarkup).toContain('aria-pressed="true"');
  });
});
