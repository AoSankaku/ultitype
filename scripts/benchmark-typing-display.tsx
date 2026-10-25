import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { createJapaneseDirectChallenges } from "../src/lib/challenges";
import { createRomajiInputTarget, getRomajiInputProgress } from "../src/lib/typing";
import { ProductionLongDisplayText } from "../app/_components/typing-panel/production-long-display";
import { createInputProgress } from "../app/_components/typing-panel/input-progress";

// A frozen input makes measurements comparable while challenge content changes.
const source = JSON.parse(readFileSync(new URL("./fixtures/typing-long-benchmark.json", import.meta.url), "utf8"));
const [challenge] = createJapaneseDirectChallenges([source]);
const target = createRomajiInputTarget(challenge.romajiSource ?? "", { preset: "hepburn", selections: {} });
const positions = [100, 300, Math.min(600, target.guide.length - 1)];

function percentile(values: number[], fraction: number) {
  const ordered = [...values].sort((a, b) => a - b);
  return Number(ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * fraction))].toFixed(3));
}

function update(input: string) {
  const progress = getRomajiInputProgress(target, input);
  createInputProgress({ acceptsTextInput: false, display: challenge.display,
    furigana: challenge.furigana ?? [], input, reading: challenge.reading ?? "", romajiTarget: target });
  return renderToStaticMarkup(<ProductionLongDisplayText
    display={challenge.display} furigana={challenge.furigana ?? []}
    markerProgress={progress} scrollMarkerProgress={progress} scrollMarkerCharacterIndex={null}
    showFurigana showFuriganaMarker showKanjiMarker
  />).length;
}

const results = positions.map((position) => {
  const input = target.guide.slice(0, position);
  for (let warmup = 0; warmup < 5; warmup++) update(input);
  const samples: number[] = [];
  let markupLength = 0;
  for (let sample = 0; sample < 30; sample++) {
    const started = performance.now();
    // Consecutive input lengths avoid benchmarking only identical-input hits.
    markupLength = update(target.guide.slice(0, position + sample % 5));
    samples.push(performance.now() - started);
  }
  return { position, medianMs: percentile(samples, .5), p95Ms: percentile(samples, .95), markupLength };
});
console.log(JSON.stringify({ fixtureCharacters: Array.from(challenge.display).length, guideLength: target.guide.length, results }));
