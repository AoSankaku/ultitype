import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { useLayoutEffect, useState } from "react";
import { DirectChallengeView } from "../../app/_components/typing-panel/challenge-views";
import { initialSettings } from "../../app/_lib/constants";
import { createCenterScrollContext } from "../../app/_lib/center-scroll-context";
import { createJapaneseDirectChallenges, parseJapaneseChallengeText } from "../../src/lib/challenges";
import { createRomajiInputTarget } from "../../src/lib/typing";
import challengeSource from "virtual:long-direct-challenge";

const challenges = createJapaneseDirectChallenges(parseJapaneseChallengeText(challengeSource)).map((challenge) => {
  const target = createRomajiInputTarget(challenge.romajiSource ?? challenge.input, {
    preset: "hepburn",
    selections: {},
    allowSplitYoon: true,
  });

  return {
    ...challenge,
    guide: target.guide,
    furigana: challenge.furigana ?? [],
    reading: challenge.reading ?? "",
    romajiTarget: target,
  };
});

if (challenges.length < 5) {
  throw new Error(`Expected at least five long challenges; received ${challenges.length}.`);
}

const contexts = challenges.map((_, index) =>
  createCenterScrollContext(challenges.slice(0, index), challenges.slice(index + 1)),
);
const emptyInputProgress = { kanji: "", hiragana: "" };
type BenchmarkState = { index: number; input: string; previewMode: "center-scroll" | "split-slide" };
type UpdateBenchmarkState = (state: BenchmarkState) => void;

let updateBenchmarkState: UpdateBenchmarkState = () => {
  throw new Error("Performance fixture has not mounted.");
};

function App() {
  const [state, setState] = useState<BenchmarkState>({ index: 0, input: "", previewMode: "center-scroll" });
  useLayoutEffect(() => {
    updateBenchmarkState = setState;
  }, [setState]);

  const current = challenges[state.index % challenges.length]!;
  const next = challenges[(state.index + 1) % challenges.length]!;
  const previous = state.index > 0 ? challenges[state.index - 1] : undefined;

  return (
    <DirectChallengeView
      display={current.display}
      englishFontFamily={initialSettings.englishFontFamily}
      furigana={current.furigana}
      guide={current.guide}
      input={state.input}
      japaneseFontFamily={initialSettings.japaneseFontFamily}
      mistakeFlash={null}
      nextChallengeDisplay={next.display}
      nextChallengeFurigana={next.furigana}
      nextChallengeGuide={next.guide}
      nextChallengePreview={next.display}
      nextChallengePreviewMode={state.previewMode}
      nextChallengeReading={next.reading}
      nextChallengeRomajiTarget={next.romajiTarget}
      previousChallengeDisplay={previous?.display ?? ""}
      previousChallengeFurigana={previous?.furigana ?? []}
      previousChallengeGuide={previous?.guide ?? ""}
      previousChallengeReading={previous?.reading ?? ""}
      centerScrollContext={contexts[state.index]}
      inputProgress={emptyInputProgress}
      previousInputProgress={emptyInputProgress}
      reading={current.reading}
      romajiTarget={current.romajiTarget}
      showDisplayText
      showFuriganaDisplay
      showFuriganaMarker={false}
      showHiraganaDisplay
      showHiraganaMarker
      showKanjiMarker={false}
      showKanjiInputProgress={false}
      showHiraganaInputProgress={false}
      showRomajiMarker
      romajiMarkerMode="character"
      targetDisplayOrder={initialSettings.targetDisplayOrder}
      strictMistakeDisplayMode="none"
      strictMistakeInput=""
      enSpaceDisplay="glyph"
      isProductionDirect
      completedPrompts={state.index}
      currentChallengeLane="top"
    />
  );
}

flushSync(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});

declare global {
  interface Window {
    runLongDirectPerformance(mode: BenchmarkState["previewMode"], samples: number): Promise<BenchmarkResult[]>;
  }
}

type BenchmarkResult = {
  index: number;
  inputCharacters: number;
  inputPercentilesMs: { p50: number; p95: number; max: number };
  transitionMs: number;
  domNodesDuringHandoff: number;
  currentInputMarkers: number;
  currentReadingMarkers: number;
  nextChallengeVisible: boolean;
  currentChallengeVisible: boolean;
  currentMarkerCenterOffsetsPx: { input: number | null; reading: number | null };
};

window.runLongDirectPerformance = async (mode, samples) => {
  const waitForPaint = () => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  const results: BenchmarkResult[] = [];

  for (let index = 0; index < 3; index += 1) {
    const challenge = challenges[index]!;
    const target = Array.from(challenge.guide).filter((character) => !/\s/u.test(character)).join("");
    const samplesMs: number[] = [];
    updateBenchmarkState({ index, input: "", previewMode: mode });
    await waitForPaint();

    for (let sample = 1; sample <= samples; sample += 1) {
      const inputLength = Math.max(1, Math.floor(target.length * sample / samples));
      const input = Array.from(target).slice(0, inputLength).join("");
      const startedAt = performance.now();
      flushSync(() => updateBenchmarkState({ index, input, previewMode: mode }));
      samplesMs.push(performance.now() - startedAt);
      await waitForPaint();
    }

    const nextStartedAt = performance.now();
    flushSync(() => updateBenchmarkState({ index: index + 1, input: "", previewMode: mode }));
    const transitionMs = performance.now() - nextStartedAt;
    await waitForPaint();

    const currentMarker = (selector: string) => {
      const row = document.querySelector<HTMLElement>(selector);
      const marker = row?.querySelector<HTMLElement>(".char.current");
      const count = row?.querySelectorAll(".char.current").length ?? 0;
      if (!row || !marker || count !== 1) {
        throw new Error(`Expected one current marker in ${selector} after challenge ${index + 1}; found ${count}.`);
      }
      return { row, marker, count };
    };
    const inputMarker = currentMarker(mode === "center-scroll"
      ? ".inputCenterViewport"
      : ".productionSegmentedStack .activeLane .inputTarget");
    const readingMarker = currentMarker(mode === "center-scroll"
      ? ".readingCenterViewport"
      : ".productionSegmentedStack .activeLane .readingText");
    const currentChallenge = challenges[index + 1]!;
    const visibleCurrentChallenge = Array.from(document.querySelectorAll(".productionLongDisplayText")).some((line) => {
      const baseText = line.cloneNode(true) as HTMLElement;
      baseText.querySelectorAll("rt").forEach((rubyText) => rubyText.remove());
      return baseText.textContent === currentChallenge.display;
    });
    if (!visibleCurrentChallenge) {
      throw new Error(`The current long challenge is not visible after challenge ${index + 1}.`);
    }
    const currentInputText = inputMarker.marker.textContent?.replace(/\s/gu, "") ?? "";
    const expectedInputText = currentChallenge.guide.replace(/\s/gu, "");
    if (!currentInputText || !expectedInputText.startsWith(currentInputText)) {
      throw new Error(
        `The current input marker does not match challenge ${index + 2}: ${JSON.stringify(currentInputText)}.`,
      );
    }
    const expectedReadingCharacter = Array.from(currentChallenge.reading).find((character) => !/\s/u.test(character));
    if (!expectedReadingCharacter || readingMarker.marker.textContent !== expectedReadingCharacter) {
      throw new Error(
        `The current reading marker does not match challenge ${index + 2}: ${JSON.stringify(readingMarker.marker.textContent)}.`,
      );
    }
    const markerOffset = (row: HTMLElement, marker: HTMLElement) => {
      const viewportRect = row.getBoundingClientRect();
      const markerRect = marker.getBoundingClientRect();
      return markerRect.left + markerRect.width / 2 - (viewportRect.left + viewportRect.width / 2);
    };
    const inputOffset = mode === "center-scroll" ? markerOffset(inputMarker.row, inputMarker.marker) : null;
    const readingOffset = mode === "center-scroll" ? markerOffset(readingMarker.row, readingMarker.marker) : null;
    if (index > 0 && inputOffset !== null && readingOffset !== null &&
      (Math.abs(inputOffset) > 1 || Math.abs(readingOffset) > 1)) {
      throw new Error(
        `The current character is not centered after challenge ${index + 1}: input ${inputOffset.toFixed(1)}px, reading ${readingOffset.toFixed(1)}px.`,
      );
    }
    const nextChallenge = challenges[index + 2]!;
    const nextChallengeVisible = Array.from(document.querySelectorAll(".productionLongDisplayText")).some((line) => {
      const baseText = line.cloneNode(true) as HTMLElement;
      baseText.querySelectorAll("rt").forEach((rubyText) => rubyText.remove());
      return baseText.textContent === nextChallenge.display;
    });
    if (!nextChallengeVisible) {
      throw new Error(`The next long challenge is not visible after challenge ${index + 1}.`);
    }
    const sorted = samplesMs.toSorted((left, right) => left - right);
    const percentile = (quantile: number) => sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)] ?? 0;

    results.push({
      index,
      inputCharacters: target.length,
      inputPercentilesMs: { p50: percentile(0.5), p95: percentile(0.95), max: sorted.at(-1) ?? 0 },
      transitionMs,
      domNodesDuringHandoff: document.querySelectorAll("*").length,
      currentInputMarkers: inputMarker.count,
      currentReadingMarkers: readingMarker.count,
      currentChallengeVisible: visibleCurrentChallenge,
      nextChallengeVisible,
      currentMarkerCenterOffsetsPx: { input: inputOffset, reading: readingOffset },
    });
  }

  return results;
};
