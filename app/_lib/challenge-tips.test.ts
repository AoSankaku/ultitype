import { describe, expect, test } from "bun:test";
import {
  getRandomPostSessionTip,
  getRandomPreSessionTip,
  postSessionTips,
  preSessionTips,
} from "./challenge-tips";

describe("challenge tips", () => {
  test("keeps editable pre-session app specification tips in a dedicated list", () => {
    expect(preSessionTips.length).toBeGreaterThan(1);
    expect(preSessionTips).toContain("本番モードは開始後の入力だけを採点します。");
  });

  test("keeps editable post-session typing advice tips in a dedicated list", () => {
    expect(postSessionTips.length).toBeGreaterThan(1);
    expect(postSessionTips).toContain("肩と手首の力を抜き、キーを押す力を必要最小限にすると次の入力が軽くなります。");
    expect(postSessionTips.some((tip) => tip.includes("本番モード"))).toBe(false);
  });

  test("selects a pre-session tip using the provided random source", () => {
    expect(getRandomPreSessionTip(() => 0)).toBe(preSessionTips[0]);
    expect(getRandomPreSessionTip(() => 0.999999)).toBe(preSessionTips.at(-1));
  });

  test("selects a post-session tip using the provided random source", () => {
    expect(getRandomPostSessionTip(() => 0)).toBe(postSessionTips[0]);
    expect(getRandomPostSessionTip(() => 0.999999)).toBe(postSessionTips.at(-1));
  });
});
