import { spawnSync } from "node:child_process";
import { describe, expect, test } from "bun:test";

describe("useTypingSession timeout lifecycle", () => {
  test("counts committed IME input once in the final metrics and saved result", () => {
    const fixturePath = `${import.meta.dir}/test-fixtures/useTypingSession-timeout.ts`;
    const child = spawnSync(process.execPath, ["run", fixturePath], {
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "development" },
      timeout: 15_000,
    });

    expect(child.status, child.stderr || child.error?.message).toBe(0);
    const result = JSON.parse(child.stdout.trim()) as {
      input: string;
      target: string;
      stats: { promptCharacters: number; mistakes: number };
      metrics: {
        accuracy: number;
        keysPerSecond: number;
        promptCharactersPerSecond: number;
        score: number;
      };
      session: { accuracy: number; keysPerSecond: number; score: number };
      isFinished: boolean;
    };
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
});
