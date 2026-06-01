import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { getRank } from "@/src/lib/typing";
import { initialSettings } from "../_lib/constants";
import { AppHeader } from "./AppHeader";

function renderAppHeader() {
  return renderToStaticMarkup(
    <AppHeader
      bestPracticeRank={getRank(0)}
      bestPracticeScore={0}
      bestProductionRank={getRank(0)}
      bestProductionScore={0}
      challengeLanguage="ja"
      onChangeChallengeLanguage={() => undefined}
      soundSettings={initialSettings}
    />,
  );
}

describe("AppHeader", () => {
  test("links to the settings page from the shared header", () => {
    const markup = renderAppHeader();

    expect(markup).toContain('href="/settings"');
    expect(markup).not.toContain('class="settings-button" type="button"');
  });

  test("links to the user page from the shared header", () => {
    const markup = renderAppHeader();

    expect(markup).toContain('href="/user"');
  });

  test("shows the app version beside the brand name", () => {
    const markup = renderAppHeader();

    expect(markup).toContain("UltiType");
    expect(markup).toContain("v0.1.0");
  });

  test("places the user page link before settings", () => {
    const markup = renderAppHeader();

    expect(markup.indexOf('href="/user"')).toBeLessThan(markup.indexOf('href="/settings"'));
  });
});
