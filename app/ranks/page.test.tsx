import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import RanksPage from "./page";

describe("RanksPage", () => {
  test("renders inside the shared app header", () => {
    const markup = renderToStaticMarkup(<RanksPage />);

    expect(markup).toContain('class="app-header"');
    expect(markup).toContain("ランクガイド");
  });

  test("places the rank guide back link after the heading content for top-right alignment", () => {
    const markup = renderToStaticMarkup(<RanksPage />);
    const pageHead = markup.match(/<header class="rank-guide-page-head">([\s\S]*?)<\/header>/)?.[1] ?? "";

    expect(pageHead.indexOf("<h1")).toBeGreaterThanOrEqual(0);
    expect(pageHead.indexOf('href="/"')).toBeGreaterThan(pageHead.indexOf("<h1"));
  });
});
