import { spawnSync } from "node:child_process";
import { describe, expect, test } from "bun:test";

type LifecycleResult = {
  committedInput: string;
  currentAccuracy: number;
  currentRank: string;
  expectedDeltas: {
    keystrokes: number;
    kanaCharacters: number;
    promptCharacters: number;
    mistakes: number;
  };
  input: string;
  target: string;
  stats: {
    keystrokes: number;
    kanaCharacters: number;
    promptCharacters: number;
    mistakes: number;
  };
  metrics: {
    accuracy: number;
    keysPerSecond: number;
    kanaCharactersPerSecond: number;
    promptCharactersPerSecond: number;
    score: number;
  };
  scoringInput: string;
  session: {
    accuracy: number;
    keysPerSecond: number;
    rank: string;
    score: number;
  };
  isFinished: boolean;
};

function runFixture(scenario?: string) {
  const fixturePath = `${import.meta.dir}/test-fixtures/useTypingSession-timeout.ts`;
  const child = spawnSync(
    process.execPath,
    scenario ? ["run", fixturePath, scenario] : ["run", fixturePath],
    {
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "development" },
      timeout: 15_000,
    },
  );

  expect(child.status, child.stderr || child.error?.message).toBe(0);
  return JSON.parse(child.stdout.trim()) as LifecycleResult;
}

describe("useTypingSession timeout lifecycle", () => {
  test("counts committed IME input once in the final metrics and saved result", () => {
    const result = runFixture();
    const expectedPromptCharacters = 10;
    const expectedInputLength = 11;
    const expectedMistakes = 1;

    expect(result.isFinished).toBe(true);
    expect(result.input).toHaveLength(expectedInputLength);
    expect(result.input.slice(0, 10)).toBe(result.target.slice(0, 10));
    expect(result.input[10]).not.toBe(result.target[10]);
    expect(result.stats.promptCharacters).toBe(expectedPromptCharacters);
    expect(result.stats.mistakes).toBe(expectedMistakes);
    expect(result.metrics.promptCharactersPerSecond).toBe(expectedPromptCharacters / 300);
    expect(result.metrics.accuracy).toBe(9 / 10);
    expect(result.metrics.accuracy).toBe(result.session.accuracy);
    expect(result.metrics.score).toBe(result.session.score);
    expect(result.metrics.keysPerSecond).toBe(result.session.keysPerSecond);
  });

  test("finalizes only the committed Japanese prefix while composition is active", () => {
    const result = runFixture("composition-japanese");

    expect(result.isFinished).toBe(true);
    expect(result.scoringInput).toBe(result.committedInput);
    expect(result.scoringInput).toBe(result.target.slice(0, 10));
    expect(result.input.length).toBeGreaterThan(result.committedInput.length);
    expect(result.expectedDeltas.kanaCharacters).toBeGreaterThan(0);
    expect(result.stats.promptCharacters).toBe(result.expectedDeltas.promptCharacters);
    expect(result.stats.kanaCharacters).toBe(result.expectedDeltas.kanaCharacters);
    expect(result.stats.keystrokes).toBe(result.expectedDeltas.keystrokes);
    expect(result.stats.mistakes).toBe(result.expectedDeltas.mistakes);
    expect(result.metrics.promptCharactersPerSecond).toBe(
      result.expectedDeltas.promptCharacters / 300,
    );
    expect(result.metrics.kanaCharactersPerSecond).toBe(
      result.expectedDeltas.kanaCharacters / 300,
    );
    expect(result.metrics.accuracy).toBe(result.currentAccuracy);
    expect(result.metrics.accuracy).toBe(result.session.accuracy);
    expect(result.metrics.score).toBe(result.session.score);
    expect(result.currentRank).toBe(result.session.rank);
  });

  test("scores no composing characters when composition began without a committed prefix", () => {
    const result = runFixture("composition-empty");

    expect(result.isFinished).toBe(true);
    expect(result.scoringInput).toBe("");
    expect(result.expectedDeltas.promptCharacters).toBe(0);
    expect(result.expectedDeltas.kanaCharacters).toBe(0);
    expect(result.expectedDeltas.keystrokes).toBe(0);
    expect(result.stats.promptCharacters).toBe(0);
    expect(result.stats.kanaCharacters).toBe(0);
    expect(result.stats.keystrokes).toBe(0);
    expect(result.stats.mistakes).toBe(0);
    expect(result.metrics.accuracy).toBe(1);
    expect(result.metrics.score).toBe(result.session.score);
    expect(result.currentRank).toBe(result.session.rank);
  });
});
