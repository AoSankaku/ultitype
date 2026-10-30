import { describe, expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import { appLanguageCodes } from "./locale-codes";
import { getLocaleBootstrapScript } from "./locale-bootstrap";

function bootstrap(saved: string | null, blocked = false) {
  const root = { lang: "ja", dir: "ltr", dataset: {} as Record<string, string | undefined> };
  const storage = { getItem() { if (blocked) throw new Error("Blocked"); return saved; } };
  runInNewContext(getLocaleBootstrapScript(), { document: { documentElement: root }, localStorage: storage });
  return root;
}

describe("locale before first paint", () => {
  test("sets every saved UI locale before hydration and gates differing static copy", () => {
    for (const language of appLanguageCodes) {
      const root = bootstrap(JSON.stringify({ settings: { appLanguage: language, theme: "light" } }));
      expect(root.lang).toBe(language);
      expect(root.dir).toBe(language === "ar" ? "rtl" : "ltr");
      expect(root.dataset.theme).toBe("light");
      expect(root.dataset.localePending).toBe(language === "ja" ? undefined : "true");
    }
  });
  test("keeps default UI visible when storage is absent, malformed, blocked, or unsupported", () => {
    for (const saved of [null, "broken", "null", "[]", '{"settings":{"appLanguage":"unknown"}}']) {
      const root = bootstrap(saved);
      expect(root.lang).toBe("ja");
      expect(root.dataset.localePending).toBeUndefined();
    }
    expect(bootstrap(null, true).dataset.localePending).toBeUndefined();
  });
  test("does not treat a practice-language route as an app-language preference", () => {
    const root = bootstrap('{"challengeLanguage":"en","settings":{"appLanguage":"de"}}');
    expect(root.lang).toBe("de");
  });
});
