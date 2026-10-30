import { describe, expect, test } from "bun:test";
import { verifyUiLocales } from "../../scripts/verify-ui-locales";
import { appLanguageCodes } from "./locale-codes";
import { appLanguages, localeCatalogs } from "./locale-catalogs";
import { translate } from "./locale-messages";

describe("YAML UI catalogs", () => {
  test("keeps every locale complete, nonempty, and consistent in interpolation parameters", () => {
    expect(verifyUiLocales()).toEqual({ locales: 22, messages: Object.keys(localeCatalogs.en.messages).length });
  });
  test("offers native names and regional choices independently of practice languages", () => {
    expect(appLanguages.map(({ code }) => code)).toEqual([...appLanguageCodes]);
    expect(appLanguages.find(({ code }) => code === "ar")?.direction).toBe("rtl");
    for (const language of appLanguageCodes) {
      expect(translate(language, "設定")).toBe(localeCatalogs[language].messages["設定"]);
      expect(translate(language, "share.intro", { mode: "Flow" })).toContain("Flow");
      expect(translate(language, "share.intro", { mode: "Flow" })).not.toContain("{mode}");
    }
  });
});
