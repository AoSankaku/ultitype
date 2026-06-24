import { describe, expect, test } from "bun:test";
import { initialSettings, initialStats } from "./constants";
import {
  applyAutoRetireScorePenalty,
  calculateCurrentImeMetricDeltas,
  finalizeTimedOutImeProductionStats,
  countTrailingMistypes,
  getImeEmptyEnterLockAction,
  getScoredImeProductionInput,
  getVisibleCorrectionDebt,
  markTextInputActivity,
  shouldAcceptImeTextInputChange,
  shouldSubmitImeProductionInputOnEnter,
  getDirectInputKey,
  shouldAutoRetireSession,
} from "./useTypingSession";
import type { DirectKeyEvent, KeyStabilitySample } from "./types";

function keyEvent(input: Partial<DirectKeyEvent>): DirectKeyEvent {
  return {
    code: "",
    key: "",
    preventDefault: () => undefined,
    shiftKey: false,
    ...input,
  };
}

describe("getDirectInputKey", () => {
  test("uses printable key values when IME is off", () => {
    expect(getDirectInputKey(keyEvent({ code: "KeyN", key: "n" }))).toBe("n");
    expect(getDirectInputKey(keyEvent({ code: "Backspace", key: "Backspace" }))).toBe(
      "Backspace",
    );
  });

  test("falls back to physical key codes when IME reports Process", () => {
    expect(getDirectInputKey(keyEvent({ code: "KeyN", key: "Process" }))).toBe("n");
    expect(getDirectInputKey(keyEvent({ code: "KeyY", key: "Process" }))).toBe("y");
    expect(getDirectInputKey(keyEvent({ code: "KeyU", key: "Process" }))).toBe("u");
    expect(getDirectInputKey(keyEvent({ code: "KeyA", key: "Process", shiftKey: true }))).toBe(
      "A",
    );
    expect(getDirectInputKey(keyEvent({ code: "Space", key: "Process" }))).toBe(" ");
    expect(getDirectInputKey(keyEvent({ code: "Backspace", key: "Process" }))).toBe(
      "Backspace",
    );
  });

  test("falls back to punctuation codes for direct romaji prompts", () => {
    expect(getDirectInputKey(keyEvent({ code: "Period", key: "Process" }))).toBe(".");
    expect(getDirectInputKey(keyEvent({ code: "Slash", key: "Process", shiftKey: true }))).toBe(
      "?",
    );
  });

  test("ignores navigation and unknown non-printable keys", () => {
    expect(getDirectInputKey(keyEvent({ code: "ShiftLeft", key: "Shift" }))).toBeNull();
    expect(getDirectInputKey(keyEvent({ code: "Convert", key: "Process" }))).toBeNull();
  });
});

function keySample(
  id: number,
  input: Partial<KeyStabilitySample>,
): KeyStabilitySample {
  return {
    id,
    key: "a",
    intervalMs: null,
    isCorrect: true,
    kind: "input",
    promptIndex: 0,
    at: id,
    ...input,
  };
}

describe("auto retire performance conditions", () => {
  test("counts only trailing wrong input keys as consecutive mistypes", () => {
    expect(
      countTrailingMistypes([
        keySample(0, { isCorrect: false, key: "x" }),
        keySample(1, { isCorrect: true, key: "a" }),
        keySample(2, { isCorrect: false, key: "y" }),
        keySample(3, { isCorrect: false, key: "z" }),
      ]),
    ).toBe(2);

    expect(
      countTrailingMistypes([
        keySample(0, { isCorrect: false, key: "x" }),
        keySample(1, { isCorrect: true, key: "Backspace", kind: "correction" }),
      ]),
    ).toBe(0);
  });

  test("retires when any enabled auto retire condition is met", () => {
    expect(
      shouldAutoRetireSession({
        accuracy: 0.95,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings: {
          ...initialSettings,
          idleRetireSeconds: 0,
          consecutiveMistypeRetireCount: 2,
          accuracyRetireBorderPercent: 90,
        },
        startedAt: 100,
        stats: {
          ...initialStats,
          characterAttempts: 2,
          keyStabilityHistory: [
            keySample(0, { isCorrect: false, key: "x" }),
            keySample(1, { isCorrect: false, key: "y" }),
          ],
        },
      }),
    ).toBe(true);

    expect(
      shouldAutoRetireSession({
        accuracy: 0.89,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings: {
          ...initialSettings,
          idleRetireSeconds: 0,
          consecutiveMistypeRetireCount: 0,
          accuracyRetireBorderPercent: 90,
        },
        startedAt: 100,
        stats: {
          ...initialStats,
          characterAttempts: 20,
          keyStabilityHistory: [keySample(0, { isCorrect: true, key: "a" })],
        },
      }),
    ).toBe(true);
  });

  test("can disable consecutive mistype retire while keeping idle and accuracy retire", () => {
    const settings = {
      ...initialSettings,
      idleRetireSeconds: 1,
      consecutiveMistypeRetireCount: 2,
      accuracyRetireBorderPercent: 90,
    };
    const mistypedStats = {
      ...initialStats,
      characterAttempts: 2,
      keyStabilityHistory: [
        keySample(0, { isCorrect: false, key: "Enter" }),
        keySample(1, { isCorrect: false, key: "Enter" }),
      ],
      lastInputAt: 900,
    };

    expect(
      shouldAutoRetireSession({
        accuracy: 1,
        allowConsecutiveMistypeRetire: false,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings,
        startedAt: 100,
        stats: mistypedStats,
      }),
    ).toBe(false);

    expect(
      shouldAutoRetireSession({
        accuracy: 1,
        allowConsecutiveMistypeRetire: false,
        isFinished: false,
        isProductionBlocked: false,
        now: 2_000,
        settings,
        startedAt: 100,
        stats: mistypedStats,
      }),
    ).toBe(true);

    expect(
      shouldAutoRetireSession({
        accuracy: 0.5,
        allowConsecutiveMistypeRetire: false,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings,
        startedAt: 100,
        stats: {
          ...mistypedStats,
          characterAttempts: 20,
        },
      }),
    ).toBe(true);
  });

  test("marks IME text changes as activity for idle retire", () => {
    expect(markTextInputActivity(initialStats, 1_234).lastInputAt).toBe(1_234);
  });

  test("does not retire for disabled performance conditions or before accuracy exists", () => {
    expect(
      shouldAutoRetireSession({
        accuracy: 0,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings: {
          ...initialSettings,
          idleRetireSeconds: 0,
          consecutiveMistypeRetireCount: 0,
          accuracyRetireBorderPercent: 90,
        },
        startedAt: 100,
        stats: initialStats,
      }),
    ).toBe(false);
  });

  test("waits for at least 20 character attempts before retiring by accuracy border", () => {
    expect(
      shouldAutoRetireSession({
        accuracy: 0.5,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings: {
          ...initialSettings,
          idleRetireSeconds: 0,
          consecutiveMistypeRetireCount: 0,
          accuracyRetireBorderPercent: 90,
        },
        startedAt: 100,
        stats: {
          ...initialStats,
          characterAttempts: 19,
        },
      }),
    ).toBe(false);
  });

  test("can require two submitted prompts before accuracy retire", () => {
    const settings = {
      ...initialSettings,
      idleRetireSeconds: 0,
      consecutiveMistypeRetireCount: 0,
      accuracyRetireBorderPercent: 90,
    };

    expect(
      shouldAutoRetireSession({
        accuracy: 0.5,
        accuracyRetireMinimumCompletedPrompts: 2,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings,
        startedAt: 100,
        stats: {
          ...initialStats,
          characterAttempts: 20,
          completedPrompts: 1,
        },
      }),
    ).toBe(false);

    expect(
      shouldAutoRetireSession({
        accuracy: 0.5,
        accuracyRetireMinimumCompletedPrompts: 2,
        isFinished: false,
        isProductionBlocked: false,
        now: 1_000,
        settings,
        startedAt: 100,
        stats: {
          ...initialStats,
          characterAttempts: 20,
          completedPrompts: 2,
        },
      }),
    ).toBe(true);
  });

  test("applies a 0.7 rating multiplier and caps retired scores at the A6 score", () => {
    expect(applyAutoRetireScorePenalty(1_000)).toBe(700);
    expect(applyAutoRetireScorePenalty(10_000)).toBe(4_820);
  });
});

describe("current IME production metric deltas", () => {
  test("ignores unconfirmed composition text for real-time IME scoring", () => {
    const scoringInput = getScoredImeProductionInput({
      committedInputBeforeComposition: "ラーメン",
      input: "ラーメンを食べt",
    });

    expect(scoringInput).toBe("ラーメン");
    expect(
      calculateCurrentImeMetricDeltas({
        challengeLanguage: "ja",
        currentDisplay: "ラーメン食べたいという気持ちがあった",
        currentReading: "らーめんたべたいというきもちがあった",
        input: scoringInput,
      }),
    ).toMatchObject({
      characterAttempts: 4,
      correctCharacters: 4,
      mistakes: 0,
      promptCharacters: 4,
    });
  });

  test("estimates current Japanese IME keystrokes from the confirmed converted prefix", () => {
    expect(
      calculateCurrentImeMetricDeltas({
        challengeLanguage: "ja",
        currentDisplay: "知っていた",
        currentReading: "しっていた",
        input: "知って",
      }),
    ).toMatchObject({
      characterAttempts: 3,
      correctCharacters: 3,
      kanaCharacters: 3,
      keystrokes: 5,
      mistakes: 0,
      promptCharacters: 3,
    });
  });

  test("includes current IME mistakes before the prompt is submitted", () => {
    expect(
      calculateCurrentImeMetricDeltas({
        challengeLanguage: "en",
        currentDisplay: "ABCD",
        currentReading: "",
        input: "ABCX",
      }),
    ).toMatchObject({
      characterAttempts: 4,
      correctCharacters: 3,
      keystrokes: 3,
      mistakes: 1,
      promptCharacters: 3,
    });
  });
});

describe("timed out IME production finalization", () => {
  test("finalizes the text field by shortest match without scoring untyped suffix", () => {
    expect(
      finalizeTimedOutImeProductionStats({
        challengeLanguage: "ja",
        currentDisplay: "ラーメン食べたいという気持ちがあった",
        currentReading: "らーめんたべたいというきもちがあった",
        input: "ラーメンを食べt",
        stats: initialStats,
      }),
    ).toMatchObject({
      characterAttempts: 8,
      correctCharacters: 6,
      mistakes: 2,
      promptCharacters: 6,
      completedPrompts: 0,
    });
  });
});

describe("IME empty Enter lock", () => {
  test("treats the first empty Enter as a lockable mistake", () => {
    expect(
      getImeEmptyEnterLockAction({
        input: "",
        isLocked: false,
        key: "Enter",
        shiftKey: false,
      }),
    ).toBe("mistake-lock");
  });

  test("counts repeated empty Enter until Backspace clears each lock", () => {
    expect(
      getImeEmptyEnterLockAction({
        input: "",
        isLocked: true,
        key: "Enter",
        shiftKey: false,
      }),
    ).toBe("mistake-lock");
    expect(
      getImeEmptyEnterLockAction({
        input: "",
        isLocked: true,
        key: "Backspace",
        shiftKey: false,
      }),
    ).toBe("unlock");
  });

  test("blocks non-Backspace text keys while empty Enter debt remains", () => {
    expect(
      getImeEmptyEnterLockAction({
        input: "途中",
        isLocked: true,
        key: "a",
        shiftKey: false,
      }),
    ).toBe("locked");
    expect(
      shouldAcceptImeTextInputChange({
        acceptsTextInput: true,
        imeEmptyEnterDebt: 1,
      }),
    ).toBe(false);
  });

  test("does not lock Enter when IME input has confirmed text", () => {
    expect(
      getImeEmptyEnterLockAction({
        input: "入力",
        isLocked: false,
        key: "Enter",
        shiftKey: false,
      }),
    ).toBe("pass");
  });
});

describe("IME production Enter submission gate", () => {
  test("blocks Enter before the input reaches the end or 88 percent match", () => {
    expect(
      shouldSubmitImeProductionInputOnEnter({
        input: "高速なタイピングでは",
        target: "高速なタイピングでは限界が来る",
      }),
    ).toBe(false);
  });

  test("allows Enter when the last eight target characters match", () => {
    expect(
      shouldSubmitImeProductionInputOnEnter({
        input: "前半は違うEFGHIJKL",
        target: "ABCDEFGHIJKL",
      }),
    ).toBe(true);
  });

  test("allows Enter when at least 88 percent of the target matches", () => {
    expect(
      shouldSubmitImeProductionInputOnEnter({
        input: "123456789",
        target: "1234567890",
      }),
    ).toBe(true);
    expect(
      shouldSubmitImeProductionInputOnEnter({
        input: "12345678",
        target: "1234567890",
      }),
    ).toBe(false);
  });
});

describe("visible correction debt", () => {
  test("shows strict Backspace debt for direct accuracy mode and IME Enter lock", () => {
    expect(
      getVisibleCorrectionDebt({
        acceptsTextInput: false,
        directMistakeDebt: 2,
        imeEmptyEnterDebt: 0,
        modeLockMistakes: true,
      }),
    ).toBe(2);
    expect(
      getVisibleCorrectionDebt({
        acceptsTextInput: true,
        directMistakeDebt: 0,
        imeEmptyEnterDebt: 5,
        modeLockMistakes: true,
      }),
    ).toBe(5);
  });
});
