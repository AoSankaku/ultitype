import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { initialSettings, productionDurations } from "../_lib/constants";
import type { ProductionModePlayability } from "../_lib/release-gates";
import { ModeSelectScreen } from "./ModeSelectScreen";

function renderModeSelectScreen({
  challengeLanguage = "ja",
  productionDuration = 300,
  productionPlayableModes = {
    "production-ime-off": true,
    "production-ime-on": true,
  },
  productionUnlocked = true,
}: {
  challengeLanguage?: "ja" | "en";
  productionDuration?: 300 | 600;
  productionPlayableModes?: Partial<ProductionModePlayability>;
  productionUnlocked?: boolean;
} = {}) {
  const playableModes = {
    "production-ime-off": true,
    "production-ime-on": true,
    ...productionPlayableModes,
  } satisfies ProductionModePlayability;

  return renderToStaticMarkup(
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
    />,
  );
}

describe("ModeSelectScreen", () => {
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

  test("keeps rating modes available outside their alpha production build gates", () => {
    const markup = renderModeSelectScreen({ productionUnlocked: true });

    expect(markup.match(/class="mode-select-card locked"/g)?.length ?? 0).toBe(0);
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

  test("places the challenge language selector above the modes heading", () => {
    const markup = renderModeSelectScreen();

    expect(markup.indexOf('class="language-switch"')).toBeLessThan(markup.indexOf("Modes"));
  });

  test("links challenge language choices to their mode select paths", () => {
    const markup = renderModeSelectScreen({ challengeLanguage: "en" });

    expect(markup).toContain('href="/"');
    expect(markup).toContain('href="/en"');
  });

  test("keeps the selected production duration in challenge language links", () => {
    const markup = renderModeSelectScreen({
      challengeLanguage: "en",
      productionDuration: 600,
    });

    expect(markup).toContain('href="/?duration=600"');
    expect(markup).toContain('href="/en?duration=600"');
  });
});
