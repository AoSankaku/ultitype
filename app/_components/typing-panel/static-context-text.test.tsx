import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { renderCompactCompletedReading, renderStaticGuideText } from "./static-context-text";

describe("static context text", () => {
  test("keeps long unchanged context to one element per text run", () => {
    const guide = "longromajicontext".repeat(250);
    const reading = "ながいぶんしょう。".repeat(250);
    for (const completed of [false, true]) {
      const markup = renderToStaticMarkup(<>{renderStaticGuideText(guide, completed, "glyph")}</>);
      expect(markup.match(/<span/g)).toHaveLength(1);
      expect(markup.replace(/<[^>]*>/g, "")).toBe(guide);
    }
    const markup = renderToStaticMarkup(<>{renderCompactCompletedReading(reading)}</>);
    expect(markup.match(/<span/g)).toHaveLength(1);
    expect(markup.replace(/<[^>]*>/g, "")).toBe(reading);
  });

  test("renders pending guide runs as continuous text", () => {
    const markup = renderToStaticMarkup(<>{renderStaticGuideText("hello, world!", false, "glyph")}</>);

    expect(markup).toContain('<span class="char">hello,</span>');
    expect(markup).toContain('<span class="char">world!</span>');
    expect(markup).toContain('<span aria-hidden="true" class="visual-space char visible-space-glyph">␣</span>');
    expect(markup.match(/<span/g)).toHaveLength(3);
  });

  test("marks complete guide runs correctly while preserving underscore and box spaces", () => {
    const underscore = renderToStaticMarkup(<>{renderStaticGuideText("done now", true, "underscore")}</>);
    const box = renderToStaticMarkup(<>{renderStaticGuideText("done now", true, "box")}</>);

    expect(underscore).toContain('<span class="char correct">done</span>');
    expect(underscore).toContain('<span aria-hidden="true" class="visual-space char correct">_</span>');
    expect(box).toContain('<span aria-hidden="true" class="visual-space char correct visible-space-box"></span>');
  });

  test("keeps reading punctuation and visual spaces while grouping completed reading runs", () => {
    const markup = renderToStaticMarkup(<>{renderCompactCompletedReading("まえ、 つぎ。")}</>);

    expect(markup).toContain('<span class="char correct">まえ、</span>');
    expect(markup).toContain('<span class="visual-space" aria-hidden="true"> </span>');
    expect(markup).toContain('<span class="char correct">つぎ。</span>');
    expect(markup.replace(/<[^>]*>/g, "")).toBe("まえ、 つぎ。");
  });
});
