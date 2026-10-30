import { createRequire } from "node:module";

let input = "";
for await (const chunk of process.stdin) input += chunk;
const { challengePath, baselineRef, bundledFixture, typingPanelCss } = JSON.parse(input);
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.ULTITYPE_PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true });

async function withTimeout(operation) {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Browser verification timed out.")), 60000); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

try {
  const page = await browser.newPage({ viewport: { width: 1225, height: 950 } });
  page.setDefaultTimeout(15000);
  const errors = [];
  const origin = "http://long-direct-performance.test";
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/fixture.js") {
      return route.fulfill({ contentType: "text/javascript", body: bundledFixture });
    }
    if (url.pathname !== "/") return route.abort();
    return route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="ja"><head><style>
      :root {--text:#eee;--muted:#888;--soft:#777;--accent:#d2ff65;--accent-2:#42d6a4;
        --target-kanji-font-size:32px;--target-hiragana-font-size:24px;--target-romaji-font-size:20px;
        --target-production-long-lines:5;--target-production-long-line-height:2.1}
      body {margin:32px;background:#181712;color:var(--text);font-family:sans-serif}
      ${typingPanelCss}
      </style></head><body><div class="targetView" id="root"></div><script type="module" src="/fixture.js"></script></body></html>` });
  });
  await page.goto(`${origin}/`);
  await page.waitForFunction(() => typeof window.runLongDirectPerformance === "function");
  const results = {};
  for (const mode of ["center-scroll", "split-slide"]) {
    results[mode] = await withTimeout(page.evaluate(mode => window.runLongDirectPerformance(mode, 40), mode));
  }
  await withTimeout(page.evaluate(async () => {
    const root = document.getElementById("root");
    root.style.transform = "scale(0.6)";
    root.style.transformOrigin = "top center";
    await window.runLongDirectPerformance("center-scroll", 1);
  }));
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(JSON.stringify({ challengePath, baselineRef, scaledPreviewVerified: true, results }, null, 2));
} finally {
  await browser.close();
}
