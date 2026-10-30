import { describe, expect, test } from "bun:test";
import { postSessionTips, preSessionTips } from "./challenge-tips";
import { translate } from "./i18n";

describe("application translations", () => {
  test("uses Japanese source copy for the Japanese app language", () => {
    expect(translate("ja", "{count} 回", { count: 4 })).toBe("4 回");
  });

  test("translates UI copy and interpolates values for English", () => {
    expect(translate("en", "ミス {count}", { count: 4 })).toBe("4 mistakes");
    expect(translate("en", "{minutes}分", { minutes: 5 })).toBe("5 min");
    expect(translate("en", "{label} を増やす", { label: "Font size" })).toBe("Increase Font size");
  });

  test("keeps unregistered text unchanged", () => {
    expect(translate("en", "Never automatically translate challenge text")).toBe(
      "Never automatically translate challenge text",
    );
  });

  test("translates every pre-session and post-session UI tip", () => {
    for (const tip of [...preSessionTips, ...postSessionTips]) {
      expect(translate("en", tip)).not.toBe(tip);
    }
  });
});
