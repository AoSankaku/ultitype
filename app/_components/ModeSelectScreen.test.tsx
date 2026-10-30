import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { initialSettings, productionDurations } from "../_lib/constants";
import type { ProductionModePlayability } from "../_lib/release-gates";
import { ModeSelectScreen } from "./ModeSelectScreen";
import { LocaleProvider } from "../_lib/i18n";
import { appLanguageCodes, type AppLanguage } from "../_lib/locale-codes";
import { translate } from "../_lib/locale-messages";

function renderModeSelectScreen({
  challengeLanguage = "ja",
  productionDuration = 300,
  productionPlayableModes = {
    "production-ime-off": true,
    "production-ime-on": true,
  },
  productionUnlocked = true,
  appLanguage = "ja",
}: {
  challengeLanguage?: "ja" | "en";
  productionDuration?: 300 | 600;
  productionPlayableModes?: Partial<ProductionModePlayability>;
  productionUnlocked?: boolean;
  appLanguage?: AppLanguage;
} = {}) {
  const playableModes = {
    "production-ime-off": true,
    "production-ime-on": true,
    ...productionPlayableModes,
  } satisfies ProductionModePlayability;

  return renderToStaticMarkup(
    <LocaleProvider language={appLanguage}>
      <ModeSelectScreen
        challengeLanguage={challengeLanguage}
        productionDuration={productionDuration}
        productionDurations={productionDurations}
        productionPlayableModes={playableModes}
        productionUnlocked={productionUnlocked}
        soundSettings={initialSettings}
        onChangeChallengeLanguage={() => undefined}
        onProductionDurationChange={() => undefined}
        onSelectMode={() => undefined}
      />
    </LocaleProvider>,
  );
}

describe("ModeSelectScreen", () => {
  test("supports every UI locale while retaining English-only practice themes and routes", () => {
    for (const language of appLanguageCodes) {
      const markup = renderModeSelectScreen({ appLanguage: language, challengeLanguage: "en" });
      expect(markup).toContain(translate(language, "練習言語"));
      expect(markup).toContain(translate(language, "タイピングのコツ"));
      expect(markup).toContain('href="/en/practice/accuracy"');
      expect(markup).not.toContain('value="english-learning"');
      expect(markup).not.toContain('value="fr"');
    }
  });
  test("locks rating modes when the production build is alpha-gated", () => {
    const markup = renderModeSelectScreen({
      productionPlayableModes: {
        "production-ime-off": false,
        "production-ime-on": false,
      },
      productionUnlocked: true,
    });

    expect(markup).toContain("Alpha");
    expect(markup.match(/class="mode-select-card locked"/g)?.length).toBe(2);
  });

  test("hides rating mode codes while the cards are locked", () => {
    const markup = renderModeSelectScreen({ productionUnlocked: false });

    expect(markup.match(/class="mode-code"/g)?.length).toBe(3);
    expect(markup).not.toContain('<span class="mode-code">本番</span>');
    expect(markup).not.toContain('<span class="mode-code">IME</span>');
  });

  test("keeps rating modes available outside their alpha production build gates", () => {
    const markup = renderModeSelectScreen({ productionUnlocked: true });

    expect(markup.match(/class="mode-select-card locked"/g)?.length ?? 0).toBe(0);
    expect(markup.match(/class="mode-code"/g)?.length).toBe(5);
  });

  test("keeps only alpha-gated rating modes locked when another rating mode is playable", () => {
    const markup = renderModeSelectScreen({
      productionPlayableModes: {
        "production-ime-off": true,
        "production-ime-on": false,
      },
      productionUnlocked: true,
    });

    expect(markup).toContain('href="/production/ime-off"');
    expect(markup).not.toContain('href="/production/ime-on"');
    expect(markup.match(/class="mode-select-card locked"/g)?.length).toBe(1);
  });

  test("links unlocked modes to their dedicated pages", () => {
    const markup = renderModeSelectScreen({ productionUnlocked: true });

    expect(markup).toContain('href="/practice/accuracy"');
    expect(markup).toContain('href="/practice/flow"');
    expect(markup).toContain('href="/practice/speed"');
    expect(markup).toContain('href="/production/ime-off"');
    expect(markup).toContain('href="/production/ime-on"');
  });

  test("links English challenges to their separate mode URLs", () => {
    const markup = renderModeSelectScreen({
      challengeLanguage: "en",
      productionUnlocked: true,
    });

    expect(markup).toContain('href="/en/practice/accuracy"');
    expect(markup).toContain('href="/en/production/ime-off"');
  });

  test("adds the selected production duration to production mode links", () => {
    const markup = renderModeSelectScreen({
      challengeLanguage: "en",
      productionDuration: 600,
      productionUnlocked: true,
    });

    expect(markup).toContain('href="/en/production/ime-off?duration=600"');
    expect(markup).toContain('href="/en/production/ime-on?duration=600"');
    expect(markup).toContain('href="/en/practice/accuracy"');
    expect(markup).not.toContain('href="/en/practice/accuracy?duration=600"');
  });

  test("places the practice language dropdown before the challenge theme", () => {
    const markup = renderModeSelectScreen();

    expect(markup).toContain('<select aria-label="練習言語"');
    expect(markup.indexOf('aria-label="練習言語"')).toBeLessThan(markup.indexOf("今週のテーマ："));
  });

  test("selects the current practice language in the dropdown", () => {
    const markup = renderModeSelectScreen({ challengeLanguage: "en" });

    expect(markup).toContain('<option value="ja">日本語</option>');
    expect(markup).toContain('<option value="en" selected="">English</option>');
  });

  test("uses English interface labels with Japanese practice routes", () => {
    const markup = renderModeSelectScreen({ appLanguage: "en", challengeLanguage: "ja" });
    expect(markup).toContain('aria-label="Practice language"');
    expect(markup).toContain("Choose a practice or rating mode.");
    expect(markup).toContain("Precision");
    expect(markup).toContain('href="/practice/accuracy"');
    expect(markup).not.toContain('href="/en/practice/accuracy"');
  });

  test("keeps Japanese interface labels with English practice routes and one English theme", () => {
    const markup = renderModeSelectScreen({ appLanguage: "ja", challengeLanguage: "en" });
    expect(markup).toContain("正確無比");
    expect(markup).toContain('href="/en/practice/accuracy"');
    expect(markup).toContain('<option value="typing-tips" selected="">タイピングのコツ</option>');
    expect(markup).not.toContain('value="english-learning"');
  });
});
