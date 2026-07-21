import { describe, expect, test } from "bun:test";
import { modes } from "@/src/lib/typing";
import {
  getResultCardMetrics,
  getResultImageFilename,
  getResultScoreFontSize,
  getResultShareTargets,
  getResultShareText,
  type ShareResult,
} from "./result-share-card";
import { getResultShareModeIconKind } from "./result-share-mode-icon";

const result: ShareResult = {
  accuracy: 0.987,
  correctCharacters: 817,
  finishedAt: new Date(2026, 6, 22, 21, 5).getTime(),
  keysPerSecond: 6.25,
  language: "ja",
  mode: modes.find((mode) => mode.id === "practice-flow")!,
  rank: "A3",
  score: 7654,
};

describe("result sharing", () => {
  test("builds a reusable result post template", () => {
    const text = getResultShareText(result);

    expect(text).toContain("ULTITYPE「行雲流水」に挑戦しました！");
    expect(text).toContain("Rank A3｜7,654 pts");
    expect(text).toContain("正確率 98.7%");
    expect(text).toContain("6.25 打鍵/秒｜375 打鍵/分");
    expect(text).not.toContain("課題クリア");
    expect(text).toContain("#ULTITYPE #タイピング");
  });

  test("uses the share endpoints for Misskey, Mastodon, and X", () => {
    const targets = getResultShareTargets(result, "https://ultitype.example/production/ime-off");
    const misskey = new URL(targets.misskey);
    const mastodon = new URL(targets.mastodon);
    const x = new URL(targets.x);

    expect(`${misskey.origin}${misskey.pathname}`).toBe("https://misskey-hub.net/ja/share");
    expect(misskey.searchParams.get("visibility")).toBe("public");
    expect(misskey.searchParams.get("localOnly")).toBe("0");
    expect(`${mastodon.origin}${mastodon.pathname}`).toBe("https://mastodonshare.com/share");
    expect(`${x.origin}${x.pathname}`).toBe("https://twitter.com/intent/tweet");

    for (const target of [misskey, mastodon, x]) {
      expect(target.searchParams.get("text")).toBe(getResultShareText(result));
      expect(target.searchParams.get("url")).toBe("https://ultitype.example/production/ime-off");
    }
  });

  test("creates a mode and timestamp specific PNG filename", () => {
    expect(getResultImageFilename(result)).toBe(
      "ultitype-result-practice-flow-20260722-2105.png",
    );
  });

  test("shrinks long score values to stay inside the score column", () => {
    expect(getResultScoreFontSize(180)).toBe(48);
    expect(getResultScoreFontSize(240)).toBe(37);
    expect(getResultScoreFontSize(600)).toBe(30);
  });

  test("assigns a distinct share-card icon to every mode", () => {
    expect(modes.map((mode) => getResultShareModeIconKind(mode.id))).toEqual([
      "crosshair",
      "waves",
      "zap",
      "keyboard",
      "languages",
    ]);
  });

  test("shows correct characters instead of completed prompts on the image", () => {
    expect(getResultCardMetrics(result)).toEqual([
      { label: "ACCURACY", value: "98.7%" },
      { label: "KEYS / SEC", value: "6.25" },
      { label: "CORRECT CHARS", value: "817" },
    ]);
  });
});
