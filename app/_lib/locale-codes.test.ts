import { describe, expect, test } from "bun:test";
import { appLanguageCodes, getAppDirection, normalizeAppLanguage } from "./locale-codes";

describe("UI language scope", () => {
  test("supports the first and second language scopes with regional variants", () => {
    expect(appLanguageCodes).toHaveLength(22);
    for (const code of appLanguageCodes) expect(normalizeAppLanguage(code)).toBe(code);
    expect(appLanguageCodes).toContain("zh-HK");
    expect(appLanguageCodes).toContain("pt-PT");
    expect(appLanguageCodes).not.toContain("th" as never);
  });
  test("validates persisted locales and uses RTL only for Arabic", () => {
    for (const value of [undefined, null, "zh", "pt", "fr-FR", "unknown", {}]) {
      expect(normalizeAppLanguage(value)).toBe("ja");
    }
    expect(getAppDirection("ar")).toBe("rtl");
    expect(getAppDirection("hi")).toBe("ltr");
  });
});
