// Optional browser verification against the static export; no local server is started.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, extname, sep } from "node:path";
import { createRequire } from "node:module";
import { parse } from "yaml";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.ULTITYPE_PLAYWRIGHT_MODULE || "playwright");
const exportRoot = resolve("out");
const origin = "http://ultitype.test";
const storageKey = "ultitype:v0";
const messages = code => parse(readFileSync(resolve("locales", `${code}.yaml`), "utf8")).messages;
const contentTypes = { ".js": "text/javascript", ".css": "text/css", ".html": "text/html", ".svg": "image/svg+xml", ".txt": "text/x-component" };
const browser = await chromium.launch({ headless: true });
try {
  const scenarios = process.argv.length > 2 ? process.argv.slice(2) : ["de", "ar", "zh-HK", "malformed", "blocked"];
  for (const scenario of scenarios) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    try {
      const errors = [];
      await context.route("**/*", async route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) return route.abort();
        const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
        let path = resolve(exportRoot, relative || "index.html");
        if (!path.startsWith(exportRoot + sep)) return route.abort();
        if (!extname(path)) path += ".html";
        if (!existsSync(path)) return route.fulfill({ status: 404, body: "Not found" });
        // Give static HTML a chance to paint before hydration arrives.
        if (extname(path) === ".js") await new Promise(done => setTimeout(done, 180));
        await route.fulfill({ path, contentType: contentTypes[extname(path)] || "application/octet-stream" });
      });
      await context.addInitScript(({ scenario, storageKey }) => {
        if (scenario === "blocked") {
          Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage blocked"); } });
        } else if (!localStorage.getItem(storageKey)) {
          localStorage.setItem(storageKey, scenario === "malformed" ? "broken" : JSON.stringify({ settings: { appLanguage: scenario, theme: "light" } }));
          localStorage.setItem("ultitype:practice-language", "en");
        }
        window.localePaints = [];
        window.hiddenLocaleFrames = 0;
        window.paintedThemes = [];
        function sample() {
          const root = document.documentElement;
          const shell = document.querySelector("[data-app-shell]");
          if (shell) {
            window.paintedThemes.push(root.dataset.theme);
            if (getComputedStyle(shell).visibility === "hidden") window.hiddenLocaleFrames++;
            else window.localePaints.push({ language: root.lang, label: document.getElementById("app-language-setting")?.textContent });
          }
          requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      }, { scenario, storageKey });
      const page = await context.newPage();
      page.on("pageerror", error => errors.push(error.message));
      page.on("console", message => {
        if (/hydration|didn.t match|server rendered/i.test(message.text())) errors.push(message.text());
      });
      const locale = scenario === "blocked" || scenario === "malformed" ? "ja" : scenario;
      await page.goto(`${origin}/settings`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(expected => {
        const root = document.documentElement;
        return root.lang === expected && !root.dataset.localePending && !!document.getElementById("app-language-setting");
      }, locale);
      await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
      const paints = await page.evaluate(() => ({ visible: window.localePaints, hidden: window.hiddenLocaleFrames, themes: window.paintedThemes }));
      assert.ok(paints.visible.length > 0, `${scenario}: no visible UI`);
      assert.ok(paints.visible.every(frame => frame.language === locale && frame.label === messages(locale)["アプリの表示言語"]), `${scenario}: wrong-language first paint`);
      if (locale !== "ja") {
        assert.ok(paints.hidden > 0, `${scenario}: static fallback was not gated`);
        assert.ok(paints.themes.every(theme => theme === "light"), `${scenario}: wrong-theme flash`);
      }
      assert.equal(await page.locator("#app-language-setting").locator("..").locator("..").locator("select option").count(), 22);
      if (scenario === "ar") {
        assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
        await page.goto(`${origin}/en/practice/accuracy`, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => document.documentElement.lang === "ar" && !document.documentElement.dataset.localePending);
        const arabicUiTarget = page.locator('[aria-label="current challenge"]');
        assert.equal(await arabicUiTarget.getAttribute("lang"), "en");
        assert.equal(await arabicUiTarget.getAttribute("dir"), "ltr");
        await page.goto(`${origin}/settings`, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => document.documentElement.lang === "ar" && !document.documentElement.dataset.localePending);
        await page.locator("select").filter({ has: page.locator('option[value="pt-PT"]') }).selectOption("pt-PT");
        await page.waitForFunction(() => JSON.parse(localStorage.getItem("ultitype:v0")).settings.appLanguage === "pt-PT");
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => document.documentElement.lang === "pt-PT" && !document.documentElement.dataset.localePending);
        await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
        const reloadedPaints = await page.evaluate(() => window.localePaints);
        assert.ok(reloadedPaints.length > 0 && reloadedPaints.every(frame => frame.language === "pt-PT" && frame.label === messages("pt-PT")["アプリの表示言語"]));
        await page.goto(`${origin}/en/practice/accuracy`, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => document.documentElement.lang === "pt-PT" && !document.documentElement.dataset.localePending);
        const target = page.locator('[aria-label="current challenge"]');
        assert.equal(await target.getAttribute("lang"), "en");
        assert.equal(await target.getAttribute("dir"), "ltr");
      }
      assert.deepEqual(errors, [], `${scenario}: browser errors`);
      console.log(`${scenario}: correct first paint, locale persistence, and hydration`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
