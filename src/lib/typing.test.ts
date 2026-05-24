import { describe, expect, test } from "bun:test";
import {
  applyDirectKey,
  calculateMetrics,
  getRank,
  isImeSubmissionMatch,
  isProductionUnlocked,
  modes,
  shouldAcceptTextInput,
} from "./typing";

describe("calculateMetrics", () => {
  test("uses all keystrokes for keys per second and character attempts for accuracy", () => {
    const metrics = calculateMetrics({
      elapsedSeconds: 10,
      keystrokes: 70,
      characterAttempts: 60,
      correctCharacters: 54,
      mistakes: 6,
      intervals: [120, 130, 125],
      accuracyExponent: 3,
    });

    expect(metrics.keysPerSecond).toBeCloseTo(7);
    expect(metrics.accuracy).toBeCloseTo(0.9);
    expect(metrics.score).toBeCloseTo(5103);
  });

  test("keeps consistency usable when fast typing has natural interval variance", () => {
    const metrics = calculateMetrics({
      elapsedSeconds: 2,
      keystrokes: 16,
      characterAttempts: 16,
      correctCharacters: 16,
      mistakes: 0,
      intervals: [85, 170, 95, 210, 120, 180, 90, 160, 115, 190, 100, 150, 650],
      accuracyExponent: 3,
    });

    expect(metrics.consistency).toBeGreaterThanOrEqual(0.65);
  });
});

describe("rank", () => {
  test("keeps scores at or below 500 in G0", () => {
    expect(getRank(500).label).toBe("G0");
  });

  test("unlocks production at A0", () => {
    expect(isProductionUnlocked(4190)).toBe(true);
    expect(isProductionUnlocked(4189)).toBe(false);
  });
});

describe("IME submission matching", () => {
  test("allows Japanese punctuation variants but preserves alphabet differences", () => {
    expect(isImeSubmissionMatch("高速入力，正確性。", "高速入力、正確性。")).toBe(true);
    expect(isImeSubmissionMatch("Type", "type")).toBe(false);
  });
});

describe("applyDirectKey", () => {
  test("requires one Backspace per wrong key in strict accuracy mode", () => {
    const firstMiss = applyDirectKey({
      state: {
        input: "",
        mistakeDebt: 0,
        characterAttempts: 0,
        correctCharacters: 0,
        mistakes: 0,
        completedPrompts: 0,
      },
      key: "x",
      target: "ab",
      lockMistakes: true,
    });

    const secondMiss = applyDirectKey({
      state: firstMiss.state,
      key: "y",
      target: "ab",
      lockMistakes: true,
    });

    const stillLocked = applyDirectKey({
      state: secondMiss.state,
      key: "a",
      target: "ab",
      lockMistakes: true,
    });

    const oneBackspace = applyDirectKey({
      state: stillLocked.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const twoBackspaces = applyDirectKey({
      state: oneBackspace.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const stillBlockedAfterTwo = applyDirectKey({
      state: twoBackspaces.state,
      key: "a",
      target: "ab",
      lockMistakes: true,
    });

    const threeBackspaces = applyDirectKey({
      state: stillBlockedAfterTwo.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const fourBackspaces = applyDirectKey({
      state: threeBackspaces.state,
      key: "Backspace",
      target: "ab",
      lockMistakes: true,
    });

    const correct = applyDirectKey({
      state: fourBackspaces.state,
      key: "a",
      target: "ab",
      lockMistakes: true,
    });

    expect(secondMiss.state.input).toBe("");
    expect(secondMiss.state.mistakeDebt).toBe(2);
    expect(stillLocked.state.mistakeDebt).toBe(3);
    expect(oneBackspace.state.mistakeDebt).toBe(2);
    expect(twoBackspaces.state.mistakeDebt).toBe(1);
    expect(stillBlockedAfterTwo.state.input).toBe("");
    expect(stillBlockedAfterTwo.state.mistakeDebt).toBe(2);
    expect(threeBackspaces.state.mistakeDebt).toBe(1);
    expect(fourBackspaces.state.mistakeDebt).toBe(0);
    expect(correct.state.input).toBe("a");
    expect(correct.state.mistakeDebt).toBe(0);
  });

  test("ignores wrong characters outside strict accuracy mode without advancing", () => {
    const miss = applyDirectKey({
      state: {
        input: "a",
        mistakeDebt: 0,
        characterAttempts: 1,
        correctCharacters: 1,
        mistakes: 0,
        completedPrompts: 0,
      },
      key: "x",
      target: "ab",
      lockMistakes: false,
    });

    const correct = applyDirectKey({
      state: miss.state,
      key: "b",
      target: "ab",
      lockMistakes: false,
    });

    expect(miss.state.input).toBe("a");
    expect(miss.state.mistakes).toBe(1);
    expect(miss.state.characterAttempts).toBe(2);
    expect(correct.state.input).toBe("");
    expect(correct.state.completedPrompts).toBe(1);
  });
});

describe("shouldAcceptTextInput", () => {
  test("accepts text input only in production IME-on mode", () => {
    const results = Object.fromEntries(modes.map((mode) => [mode.id, shouldAcceptTextInput(mode)]));

    expect(results["production-ime-on"]).toBe(true);
    expect(results["practice-accuracy"]).toBe(false);
    expect(results["practice-flow"]).toBe(false);
    expect(results["practice-speed"]).toBe(false);
    expect(results["production-ime-off"]).toBe(false);
  });
});
