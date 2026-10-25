import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ChallengeThemeSelector } from "./ChallengeThemeSelector";

describe("ChallengeThemeSelector", () => {
  test("offers every theme in a dropdown with automatic selection in development", () => {
    const markup = renderToStaticMarkup(
      <ChallengeThemeSelector
        isDevelopment
        isThemeOverride={false}
        selectedThemeId="english-learning"
        weeklyThemeId="english-learning"
        onSelectTheme={() => undefined}
      />,
    );

    for (const label of [
      "自動（日本時間・毎週月曜6時）",
      "英語学習",
      "魚の種類",
      "回転すし",
      "高級寿司",
      "ラーメンの歴史",
      "ラーメンの種類",
      "音楽のジャンル",
      "通勤電車",
      "タイピングのコツ",
    ]) {
      expect(markup).toContain(label);
    }
    expect(markup).toContain("<select");
    expect(markup.match(/<option /g)).toHaveLength(10);
    expect(markup).toContain('<option value="auto" selected="">');
    expect(markup).not.toContain("<button");
  });

  test("keeps the manually selected theme selected in the dropdown", () => {
    const markup = renderToStaticMarkup(
      <ChallengeThemeSelector
        isDevelopment
        isThemeOverride
        selectedThemeId="ramen-types"
        weeklyThemeId="fish-types"
        onSelectTheme={() => undefined}
      />,
    );

    expect(markup).toContain('<option value="ramen-types" selected="">');
    expect(markup).not.toContain('<option value="auto" selected="">');
    expect(markup).toContain("魚の種類（今週）");
    expect(markup).toContain("選択中：ラーメンの種類");
  });

  test("shows the weekly theme and Monday update time outside development", () => {
    const markup = renderToStaticMarkup(
      <ChallengeThemeSelector
        isDevelopment={false}
        isThemeOverride={false}
        selectedThemeId="typing-tips"
        weeklyThemeId="fish-types"
        onSelectTheme={() => undefined}
      />,
    );

    expect(markup).toContain("今週のテーマ：");
    expect(markup).toContain("魚の種類");
    expect(markup).toContain("日本時間・毎週月曜6時に更新");
    expect(markup).not.toContain("課題テーマ");
    expect(markup).not.toContain("button");
    expect(markup).not.toContain("<select");
  });
});
