import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { getChallengeTheme } from "../src/lib/challenge-themes";
import { createRomajiInputTarget } from "../src/lib/typing";

const loadPlaywright = createRequire(`${process.cwd()}/package.json`);
const { chromium } = loadPlaywright(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const challenge = getChallengeTheme("commuter-trains").longChallenges[0];
const target = createRomajiInputTarget(challenge.romajiSource ?? "", {
  preset: "hepburn", selections: {}, allowSplitYoon: true, specialPreset: "integrated",
});
const settings = {
  romajiInputPreset: "hepburn", specialRomajiInputPreset: "integrated",
  soundVolume: 0, typingSoundEnabled: false, uiSoundEnabled: false,
  showKanjiMarker: true, showFuriganaMarker: true, showKanjiInputProgress: true,
  showHiraganaInputProgress: true, idleRetireSeconds: 0, consecutiveMistypeRetireCount: 0,
  accuracyRetireBorderPercent: 0,
};

function percentile(values: number[], percent: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * percent))].toFixed(3));
}

async function main() {
const browser = await chromium.launch({ headless: true, timeout: 20000,
  executablePath: process.env.CHROME_EXECUTABLE ?? "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const deadline = setTimeout(() => browser.close(), 60000);
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  await context.addInitScript(({ settings }: { settings: Record<string, unknown> }) => {
    Math.random = () => .999999;
    localStorage.setItem("ultitype:v0", JSON.stringify({ bestPracticeScore: 10000,
      bestProductionScore: 0, sessions: [], settings }));
    localStorage.setItem("ultitype:challenge-theme", "commuter-trains");
  }, { settings });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors: string[] = [];
  page.on("pageerror", (error: Error) => errors.push(error.message));
  await page.goto("http://localhost:3000/production/ime-off", { waitUntil: "domcontentloaded" });
  await page.waitForFunction((display: string) => {
    const text = document.querySelector('[class*="productionLongDisplayText"]')?.cloneNode(true) as HTMLElement | undefined;
    text?.querySelectorAll("rt").forEach((rt) => rt.remove());
    return text?.textContent === display;
  }, challenge.display, { timeout: 20000 });
  let typed = 0;
  const results = [];
  for (const position of [100, 400, 650]) {
    if (typed < position) {
      await page.evaluate(async (text: string) => {
        for (const key of text) {
          window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
          await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
        }
      }, target.guide.slice(typed, position));
      typed = position;
    }
    const sampleText = target.guide.slice(typed, typed + 12);
    const samples = await page.evaluate(async (text: string) => {
      const values = [];
      for (const key of text) {
        const start = performance.now();
        window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
        await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
        values.push(performance.now() - start);
      }
      return values;
    }, sampleText);
    typed += sampleText.length;
    results.push({ position, medianMs: percentile(samples, .5), p95Ms: percentile(samples, .95) });
    console.log(JSON.stringify(results.at(-1)));
  }
  const mistakes = await page.getByText("ミス数", { exact: true }).locator("..").innerText();
  if (!/\b0\b/.test(mistakes)) throw new Error(`Replay had mistakes: ${mistakes}`);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(JSON.stringify({ metric: "keydown-to-frame-with-task-ms", environment: "development/headless Chrome",
    fixtureHash: createHash("sha256").update(challenge.display).digest("hex").slice(0, 12),
    characters: Array.from(challenge.display).length, typed, results, mistakes, errors }));
} finally {
  clearTimeout(deadline);
  await browser.close();
}
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
