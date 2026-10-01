import { spawnSync } from "node:child_process";
import { describe, expect, test } from "bun:test";

type LifecycleResult = {
  committedInput: string;
  currentAccuracy: number;
  currentRank: string;
  expectedDeltas: {
    correctCharacters: number;
    keystrokes: number;
    kanaCharacters: number;
    promptCharacters: number;
    mistakes: number;
  };
  input: string;
  target: string;
  stats: {
    correctCharacters: number;
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
  finishReason: string | null;
  visibleRank: string;
  preFinishScore: number | null;
  sessionCount: number;
  sessions: Array<{
    accuracy: number;
    keysPerSecond: number;
    rank: string;
    score: number;
  }>;
  postReset: {
    isFinished: boolean;
    rank: string;
    score: number;
    sessionCount: number;
  } | null;
  retiredState: {
    finishReason: string | null;
    isFinished: boolean;
    metrics: LifecycleResult["metrics"];
    session: LifecycleResult["session"];
    visibleRank: string;
  } | null;
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

  test("shows the 0.7 retired score in the final metrics and saved session", () => {
    const result = runFixture("retire-direct");
    const retired = result.retiredState!;

    expect(retired.finishReason).toBe("retired");
    expect(result.preFinishScore!).toBeGreaterThan(0);
    expect(result.preFinishScore!).toBeLessThan(4820 / 0.7);
    expect(retired.session.score).toBeCloseTo(result.preFinishScore! * 0.7);
    expect(retired.metrics.score).toBe(retired.session.score);
    expect(retired.visibleRank).toBe(retired.session.rank);
  });

  test("shows the retired score cap and clears the final snapshot after reset", () => {
    const result = runFixture("retire-direct-cap-reset");
    const retired = result.retiredState!;

    expect(retired.finishReason).toBe("retired");
    expect(result.preFinishScore!).toBeGreaterThanOrEqual(4820 / 0.7);
    expect(retired.session.score).toBe(4820);
    expect(retired.metrics.score).toBe(4820);
    expect(retired.visibleRank).toBe(retired.session.rank);
    expect(result.postReset).toEqual({
      isFinished: false,
      score: 0,
      rank: "NR",
      sessionCount: 1,
    });
    expect(result.isFinished).toBe(false);
    expect(result.metrics.score).toBeGreaterThan(0);
    expect(result.metrics.score).not.toBe(4820);
    expect(result.visibleRank).toBe("NR");
    expect(result.visibleRank).not.toBe(retired.visibleRank);
  });

  test("keeps unsubmitted committed IME metrics visible after retirement", () => {
    const result = runFixture("retire-ime");
    const retired = result.retiredState!;

    expect(retired.finishReason).toBe("retired");
    expect(result.expectedDeltas.promptCharacters).toBeGreaterThan(0);
    expect(result.stats.promptCharacters).toBe(result.expectedDeltas.promptCharacters);
    expect(result.stats.correctCharacters).toBe(result.expectedDeltas.correctCharacters);
    expect(result.stats.kanaCharacters).toBe(result.expectedDeltas.kanaCharacters);
    expect(result.stats.keystrokes).toBe(result.expectedDeltas.keystrokes);
    expect(result.stats.mistakes).toBe(result.expectedDeltas.mistakes);
    expect(retired.metrics.promptCharactersPerSecond).toBe(
      result.expectedDeltas.promptCharacters / 5,
    );
    expect(retired.metrics.kanaCharactersPerSecond).toBe(
      result.expectedDeltas.kanaCharacters / 5,
    );
    expect(retired.metrics.accuracy).toBe(result.currentAccuracy);
    expect(retired.metrics.accuracy).toBe(retired.session.accuracy);
    expect(retired.metrics.score).toBe(retired.session.score);
    expect(retired.visibleRank).toBe(retired.session.rank);
  });

  test("lets a completed timeout win over an idle retirement at the same instant", () => {
    const result = runFixture("timeout-race");

    expect(result.finishReason).toBe("completed");
    expect(result.sessionCount).toBe(1);
    expect(result.session.score).toBe(result.preFinishScore!);
    expect(result.metrics.score).toBe(result.session.score);
  });
});
