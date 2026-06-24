"use client";

import {
  type ClipboardEvent,
  type CompositionEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type DirectChallenge,
  createJapaneseReadingGuideParts,
  englishLongChallenges,
  kanaReadingToRomaji,
  longChallengeFurigana,
  longChallengeReadings,
  longChallenges,
} from "@/src/lib/challenges";
import {
  type ModeId,
  type RomajiInputTarget,
  applyDirectKey,
  calculateMetrics,
  countPreferredRomajiProgressKeystrokes,
  countShortestRomajiKeystrokes,
  countCorrectDirectCharacters,
  createRomajiInputTarget,
  getRomajiInputProgress,
  getRank,
  isDirectKeyCorrect,
  isProductionUnlocked,
  modes,
  scoreImeProductionInput,
  shouldAcceptTextInput,
} from "@/src/lib/typing";
import {
  ignoredKeys,
  initialSettings,
  initialStats,
  storageKey,
} from "./constants";
import {
  cacheStoredState,
  getInitialStoredState,
  normalizeAppSettings,
  readStoredState,
  shouldPersistStoredState,
} from "./stored-state";
import {
  ALPHA_PRODUCTION_LOCK_MESSAGE,
  PRODUCTION_MODE_PLAYABILITY,
  canPlayProductionMode,
  type ProductionModeId,
} from "./release-gates";
import {
  createOrderedIndexes,
  createShuffledIndexes,
  getDirectChallenges,
  getModeChallengeIndex,
  getNextModeChallengeIndex,
} from "./challenge-utils";
import type {
  AppSettings,
  ChallengeLanguage,
  DirectKeyEvent,
  FinishReason,
  MistakeFlash,
  ProductionDuration,
  RuntimeStats,
  Screen,
  StoredSession,
  StoredState,
} from "./types";
import { getFinishSoundKind, useTypingSounds } from "./typing-sounds";

type KeyStabilityInput = {
  key: string;
  isCorrect: boolean;
  kind: "input" | "correction";
};

type ImeEmptyEnterLockAction = "pass" | "mistake-lock" | "locked" | "unlock";

type PreviousDirectChallengeSnapshot = {
  display: string;
  furigana: DirectChallenge["furigana"];
  guide: string;
  reading: string;
};

export type UseTypingSessionOptions = {
  initialChallengeLanguage?: ChallengeLanguage;
  initialModeId?: ModeId;
  initialProductionDuration?: ProductionDuration;
  initialScreen?: Screen;
};

const directCodeKeyMap: Record<string, [normal: string, shifted: string]> = {
  Backquote: ["`", "~"],
  BracketLeft: ["[", "{"],
  BracketRight: ["]", "}"],
  Backslash: ["\\", "|"],
  Comma: [",", "<"],
  Digit0: ["0", ")"],
  Digit1: ["1", "!"],
  Digit2: ["2", "@"],
  Digit3: ["3", "#"],
  Digit4: ["4", "$"],
  Digit5: ["5", "%"],
  Digit6: ["6", "^"],
  Digit7: ["7", "&"],
  Digit8: ["8", "*"],
  Digit9: ["9", "("],
  Equal: ["=", "+"],
  IntlRo: ["\\", "_"],
  Minus: ["-", "_"],
  Period: [".", ">"],
  Quote: ["'", "\""],
  Semicolon: [";", ":"],
  Slash: ["/", "?"],
};

export function getDirectInputKey(event: DirectKeyEvent): string | null {
  if (ignoredKeys.has(event.key)) {
    return null;
  }

  if (event.key === "Backspace") {
    return "Backspace";
  }

  if (event.code === "Backspace") {
    return "Backspace";
  }

  if (event.key.length === 1) {
    return event.key;
  }

  if (/^Key[A-Z]$/.test(event.code)) {
    const key = event.code.at(-1);
    return event.shiftKey ? (key ?? null) : (key?.toLowerCase() ?? null);
  }

  if (event.code === "Space") {
    return " ";
  }

  const mapped = directCodeKeyMap[event.code];
  if (mapped) {
    return mapped[event.shiftKey ? 1 : 0];
  }

  return null;
}

export function countTrailingMistypes(history: RuntimeStats["keyStabilityHistory"]) {
  let count = 0;

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const sample = history[index];
    if (sample.kind !== "input" || sample.isCorrect) {
      break;
    }

    count += 1;
  }

  return count;
}

export function shouldAutoRetireSession({
  accuracy,
  accuracyRetireMinimumCompletedPrompts = 0,
  allowConsecutiveMistypeRetire = true,
  isFinished,
  isProductionBlocked,
  now,
  settings,
  startedAt,
  stats,
}: {
  accuracy: number;
  accuracyRetireMinimumCompletedPrompts?: number;
  allowConsecutiveMistypeRetire?: boolean;
  isFinished: boolean;
  isProductionBlocked: boolean;
  now: number;
  settings: Pick<
    AppSettings,
    "idleRetireSeconds" | "consecutiveMistypeRetireCount" | "accuracyRetireBorderPercent"
  >;
  startedAt: number | null;
  stats: Pick<
    RuntimeStats,
    "characterAttempts" | "completedPrompts" | "keyStabilityHistory" | "lastInputAt"
  >;
}) {
  if (startedAt === null || isFinished || isProductionBlocked) {
    return false;
  }

  const idleRetireMs = settings.idleRetireSeconds * 1000;
  const lastActivityAt = stats.lastInputAt ?? startedAt;
  if (idleRetireMs > 0 && now - lastActivityAt >= idleRetireMs) {
    return true;
  }

  if (
    allowConsecutiveMistypeRetire &&
    settings.consecutiveMistypeRetireCount > 0 &&
    countTrailingMistypes(stats.keyStabilityHistory) >= settings.consecutiveMistypeRetireCount
  ) {
    return true;
  }

  return (
    settings.accuracyRetireBorderPercent > 0 &&
    stats.characterAttempts >= 20 &&
    stats.completedPrompts >= accuracyRetireMinimumCompletedPrompts &&
    accuracy * 100 < settings.accuracyRetireBorderPercent
  );
}

export const autoRetireScoreMultiplier = 0.7;
export const autoRetireScoreCap = 4820;

export function applyAutoRetireScorePenalty(score: number) {
  return Math.min(score * autoRetireScoreMultiplier, autoRetireScoreCap);
}

export function markTextInputActivity(stats: RuntimeStats, timestamp: number): RuntimeStats {
  return {
    ...stats,
    lastInputAt: timestamp,
  };
}

function countMetricCharacters(value: string) {
  return Array.from(value).filter((character) => !/\s/.test(character)).length;
}

function takeMetricCharacterPrefix(value: string, count: number) {
  let remaining = Math.max(0, count);
  let prefix = "";

  for (const character of Array.from(value)) {
    if (/\s/.test(character)) {
      prefix += character;
      continue;
    }

    if (remaining <= 0) {
      break;
    }

    prefix += character;
    remaining -= 1;
  }

  return prefix;
}

function countCompletedReadingCharacters(reading: string, completedTokens: number) {
  return createJapaneseReadingGuideParts(reading).reduce((sum, part) => {
    if (part.kind !== "reading" || part.tokenEnd > completedTokens) {
      return sum;
    }

    return sum + countMetricCharacters(part.text);
  }, 0);
}

function countCurrentDirectKanaCharacters({
  challengeLanguage,
  currentReading,
  currentRomajiTarget,
  input,
}: {
  challengeLanguage: ChallengeLanguage;
  currentReading: string;
  currentRomajiTarget: RomajiInputTarget | null;
  input: string;
}) {
  if (challengeLanguage !== "ja") {
    return countMetricCharacters(input);
  }

  if (!currentRomajiTarget) {
    return 0;
  }

  const progress = getRomajiInputProgress(currentRomajiTarget, input);
  return progress.accepted
    ? countCompletedReadingCharacters(currentReading, progress.completedTokens)
    : 0;
}

function getCurrentKanaCharacters({
  challengeLanguage,
  currentReading,
  currentRomajiTarget,
  input,
  modeRequiresIme,
  targetLength,
  targetProgress,
}: {
  challengeLanguage: ChallengeLanguage;
  currentReading: string;
  currentRomajiTarget: RomajiInputTarget | null;
  input: string;
  modeRequiresIme: boolean;
  targetLength: number;
  targetProgress: number;
}) {
  if (!modeRequiresIme) {
    return countCurrentDirectKanaCharacters({
      challengeLanguage,
      currentReading,
      currentRomajiTarget,
      input,
    });
  }

  const readingCharacters = countMetricCharacters(currentReading);
  if (readingCharacters === 0 || targetLength <= 0) {
    return 0;
  }

  return Math.min(
    readingCharacters,
    Math.floor((readingCharacters * targetProgress) / targetLength),
  );
}

function countCurrentImeEstimatedKeystrokes({
  challengeLanguage,
  currentDisplay,
  currentReading,
  kanaCharacters,
  targetProgress,
}: {
  challengeLanguage: ChallengeLanguage;
  currentDisplay: string;
  currentReading: string;
  kanaCharacters: number;
  targetProgress: number;
}) {
  if (targetProgress <= 0) {
    return 0;
  }

  if (challengeLanguage !== "ja") {
    return countMetricCharacters(
      Array.from(currentDisplay).slice(0, targetProgress).join(""),
    );
  }

  const readingPrefix = takeMetricCharacterPrefix(currentReading, kanaCharacters);
  return readingPrefix ? countShortestRomajiKeystrokes(kanaReadingToRomaji(readingPrefix)) : 0;
}

export function calculateCurrentImeMetricDeltas({
  challengeLanguage,
  currentDisplay,
  currentReading,
  input,
}: {
  challengeLanguage: ChallengeLanguage;
  currentDisplay: string;
  currentReading: string;
  input: string;
}) {
  const score = scoreImeProductionInput(input, currentDisplay);
  const targetLength = Array.from(currentDisplay).length;
  const kanaCharacters = getCurrentKanaCharacters({
    challengeLanguage,
    currentReading,
    currentRomajiTarget: null,
    input,
    modeRequiresIme: true,
    targetLength,
    targetProgress: score.completedTargetLength,
  });
  const keystrokes = countCurrentImeEstimatedKeystrokes({
    challengeLanguage,
    currentDisplay,
    currentReading,
    kanaCharacters,
    targetProgress: score.completedTargetLength,
  });

  return {
    keystrokes,
    kanaCharacters,
    promptCharacters: score.completedTargetLength,
    characterAttempts: score.correctCharacters + score.mistakes,
    correctCharacters: score.correctCharacters,
    mistakes: score.mistakes,
  };
}

export function getScoredImeProductionInput({
  committedInputBeforeComposition,
  input,
}: {
  committedInputBeforeComposition: string | null;
  input: string;
}) {
  return committedInputBeforeComposition ?? input;
}

export function finalizeTimedOutImeProductionStats({
  challengeLanguage,
  currentDisplay,
  currentReading,
  input,
  stats,
}: {
  challengeLanguage: ChallengeLanguage;
  currentDisplay: string;
  currentReading: string;
  input: string;
  stats: RuntimeStats;
}): RuntimeStats {
  if (input.length === 0) {
    return stats;
  }

  const deltas = calculateCurrentImeMetricDeltas({
    challengeLanguage,
    currentDisplay,
    currentReading,
    input,
  });

  return {
    ...stats,
    keystrokes: stats.keystrokes + deltas.keystrokes,
    scoredInputLength: 0,
    kanaCharacters: stats.kanaCharacters + deltas.kanaCharacters,
    promptCharacters: stats.promptCharacters + deltas.promptCharacters,
    characterAttempts: stats.characterAttempts + deltas.characterAttempts,
    correctCharacters: stats.correctCharacters + deltas.correctCharacters,
    mistakes: stats.mistakes + deltas.mistakes,
  };
}

export function getImeEmptyEnterLockAction({
  input,
  isLocked,
  key,
  shiftKey,
}: {
  input: string;
  isLocked: boolean;
  key: string;
  shiftKey: boolean;
}): ImeEmptyEnterLockAction {
  if (isLocked && key === "Backspace") {
    return "unlock";
  }

  if (isLocked && (key !== "Enter" || shiftKey)) {
    return "locked";
  }

  if (key !== "Enter" || shiftKey) {
    return "pass";
  }

  if (isLocked && Array.from(input).length > 0) {
    return "locked";
  }

  return Array.from(input).length === 0 ? "mistake-lock" : "pass";
}

export function shouldAcceptImeTextInputChange({
  acceptsTextInput,
  imeEmptyEnterDebt,
}: {
  acceptsTextInput: boolean;
  imeEmptyEnterDebt: number;
}) {
  return acceptsTextInput && imeEmptyEnterDebt <= 0;
}

export function shouldSubmitImeProductionInputOnEnter({
  input,
  target,
}: {
  input: string;
  target: string;
}) {
  const inputCharacters = Array.from(input.trimEnd());
  const targetCharacters = Array.from(target.trimEnd());
  const requiredTailMatchLength = 8;
  const requiredMatchRatio = 0.88;

  if (inputCharacters.length === 0 || targetCharacters.length === 0) {
    return false;
  }

  if (
    inputCharacters.length >= requiredTailMatchLength &&
    targetCharacters.length >= requiredTailMatchLength
  ) {
    const inputTail = inputCharacters.slice(-requiredTailMatchLength).join("");
    const targetTail = targetCharacters.slice(-requiredTailMatchLength).join("");
    const tailScore = scoreImeProductionInput(inputTail, targetTail, {
      forceComplete: true,
    });

    if (tailScore.mistakes === 0 && tailScore.correctCharacters === tailScore.targetLength) {
      return true;
    }
  }

  const score = scoreImeProductionInput(input, target);
  return (
    score.targetLength > 0 &&
    score.correctCharacters / score.targetLength >= requiredMatchRatio
  );
}

export function getVisibleCorrectionDebt({
  acceptsTextInput,
  directMistakeDebt,
  imeEmptyEnterDebt,
  modeLockMistakes,
}: {
  acceptsTextInput: boolean;
  directMistakeDebt: number;
  imeEmptyEnterDebt: number;
  modeLockMistakes: boolean;
}) {
  if (acceptsTextInput) {
    return imeEmptyEnterDebt;
  }

  return modeLockMistakes ? directMistakeDebt : 0;
}

export function useTypingSession({
  initialChallengeLanguage = "ja",
  initialModeId = "practice-accuracy",
  initialProductionDuration = 300,
  initialScreen = "mode-select",
}: UseTypingSessionOptions = {}) {
  const initialPracticeChallengeOrder = createOrderedIndexes(
    getDirectChallenges(initialChallengeLanguage, "practice").length,
  );
  const initialProductionChallengeOrder = createOrderedIndexes(
    getDirectChallenges(initialChallengeLanguage, "production").length,
  );
  const [stored, setStored] = useState<StoredState>(getInitialStoredState);
  const [modeId, setModeId] = useState<ModeId>(initialModeId);
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [challengeLanguage, setChallengeLanguage] =
    useState<ChallengeLanguage>(initialChallengeLanguage);
  const [productionDuration, setProductionDuration] =
    useState<ProductionDuration>(initialProductionDuration);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [practiceChallengeOrder, setPracticeChallengeOrder] = useState(
    () => initialPracticeChallengeOrder,
  );
  const [nextPracticeChallengeOrder, setNextPracticeChallengeOrder] = useState(() =>
    initialPracticeChallengeOrder,
  );
  const [productionChallengeOrder, setProductionChallengeOrder] = useState(
    () => initialProductionChallengeOrder,
  );
  const [nextProductionChallengeOrder, setNextProductionChallengeOrder] = useState(() =>
    initialProductionChallengeOrder,
  );
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<RuntimeStats>(initialStats);
  const [previousDirectChallenge, setPreviousDirectChallenge] =
    useState<PreviousDirectChallengeSnapshot | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [finishReason, setFinishReason] = useState<FinishReason | null>(null);
  const [imeError, setImeError] = useState("");
  const [imeEmptyEnterDebt, setImeEmptyEnterDebt] = useState(0);
  const [committedInputBeforeComposition, setCommittedInputBeforeComposition] =
    useState<string | null>(null);
  const [mistakeFlash, setMistakeFlash] = useState<MistakeFlash | null>(null);
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const skipNextPersistRef = useRef(false);
  const playTypingSound = useTypingSounds(stored.settings);

  const mode = modes.find((item) => item.id === modeId) ?? modes[0];
  const acceptsTextInput = shouldAcceptTextInput(mode);
  const durationSeconds = mode.group === "production" ? productionDuration : mode.durationSeconds;
  const elapsedSeconds = startedAt ? Math.min((now - startedAt) / 1000, durationSeconds) : 0;
  const remainingSeconds = durationSeconds - elapsedSeconds;
  const productionUnlocked = isProductionUnlocked(stored.bestPracticeScore);
  const directChallenges = getDirectChallenges(challengeLanguage, mode.group);
  const directChallengeOrder =
    mode.group === "practice" ? practiceChallengeOrder : productionChallengeOrder;
  const nextDirectChallengeOrder =
    mode.group === "practice" ? nextPracticeChallengeOrder : nextProductionChallengeOrder;
  const directChallengeIndex = getModeChallengeIndex(
    mode.group,
    challengeIndex,
    directChallenges.length,
    directChallengeOrder,
  );
  const currentDirectChallenge =
    directChallenges[directChallengeIndex] ??
    ({
      display: "",
      guide: "",
      input: "",
    } satisfies DirectChallenge);
  const nextDirectChallengeIndex = getNextModeChallengeIndex(
    mode.group,
    challengeIndex,
    directChallenges.length,
    directChallengeOrder,
    nextDirectChallengeOrder,
  );
  const nextDirectChallenge = directChallenges[nextDirectChallengeIndex] ?? null;
  const imeChallenges = challengeLanguage === "ja" ? longChallenges : englishLongChallenges;
  const currentImeChallenge = imeChallenges[directChallengeIndex] ?? "";
  const nextImeChallenge = imeChallenges[nextDirectChallengeIndex] ?? "";
  const currentDirectGuideSource = currentDirectChallenge.guide ?? currentDirectChallenge.input;
  const currentDirectRomajiSource =
    currentDirectChallenge.romajiSource ?? currentDirectGuideSource;
  const nextDirectGuideSource =
    nextDirectChallenge?.guide ?? nextDirectChallenge?.input ?? "";
  const nextDirectRomajiSource =
    nextDirectChallenge?.romajiSource ?? nextDirectGuideSource;
  const currentRomajiTarget =
    challengeLanguage === "ja" && !mode.requiresIme
      ? createRomajiInputTarget(currentDirectRomajiSource, {
          preset: stored.settings.romajiInputPreset,
          selections: stored.settings.romajiInputSelections,
          allowSplitYoon: stored.settings.allowSplitYoon,
          specialPreset: stored.settings.specialRomajiInputPreset,
          specialSelections: stored.settings.specialRomajiInputSelections,
          sokuon: stored.settings.sokuonInput,
        })
      : null;
  const currentShortestRomajiTarget =
    challengeLanguage === "ja" && !mode.requiresIme
      ? createRomajiInputTarget(currentDirectRomajiSource, {
          preset: "shortest",
          selections: {},
          allowSplitYoon: true,
          allowSplitSpecialYoon: true,
          specialPreset: "integrated",
          specialSelections: {},
        })
      : null;
  const nextRomajiTarget =
    challengeLanguage === "ja" && !mode.requiresIme && nextDirectChallenge
      ? createRomajiInputTarget(nextDirectRomajiSource, {
          preset: stored.settings.romajiInputPreset,
          selections: stored.settings.romajiInputSelections,
          allowSplitYoon: stored.settings.allowSplitYoon,
          specialPreset: stored.settings.specialRomajiInputPreset,
          specialSelections: stored.settings.specialRomajiInputSelections,
          sokuon: stored.settings.sokuonInput,
        })
      : null;
  const currentDisplay = mode.requiresIme
    ? currentImeChallenge
    : currentDirectChallenge.display;
  const currentFurigana =
    challengeLanguage === "ja"
      ? mode.requiresIme
        ? (longChallengeFurigana[directChallengeIndex % longChallengeFurigana.length] ?? [])
        : (currentDirectChallenge.furigana ?? [])
      : [];
  const currentRawReading =
    challengeLanguage === "ja"
      ? mode.requiresIme
        ? (longChallengeReadings[directChallengeIndex % longChallengeReadings.length] ?? "")
        : (currentDirectChallenge.reading ?? "")
      : "";
  const currentReading = currentRawReading;
  const nextReading =
    challengeLanguage === "ja" && !mode.requiresIme
      ? (nextDirectChallenge?.reading ?? "")
      : "";
  const currentInputTarget = mode.requiresIme
    ? currentImeChallenge
    : (currentRomajiTarget ?? currentDirectChallenge.input);
  const currentGuide =
    challengeLanguage === "ja" && !mode.requiresIme
      ? currentRomajiTarget?.guide
      : currentDirectChallenge.guide;
  const bestPracticeRank = getRank(stored.bestPracticeScore);
  const bestProductionRank = getRank(stored.bestProductionScore);
  const productionPlayableModes = PRODUCTION_MODE_PLAYABILITY;
  const currentProductionPlayable =
    mode.group === "production" ? productionPlayableModes[mode.id as ProductionModeId] : true;

  function randomizePracticeChallengeOrder(language: ChallengeLanguage = challengeLanguage) {
    const nextOrder = createShuffledIndexes(getDirectChallenges(language, "practice").length);

    setPracticeChallengeOrder(nextOrder);
    setNextPracticeChallengeOrder(
      createShuffledIndexes(nextOrder.length, Math.random, nextOrder.at(-1)),
    );
  }

  function randomizeProductionChallengeOrder(language: ChallengeLanguage = challengeLanguage) {
    const nextOrder = createShuffledIndexes(getDirectChallenges(language, "production").length);

    setProductionChallengeOrder(nextOrder);
    setNextProductionChallengeOrder(
      createShuffledIndexes(nextOrder.length, Math.random, nextOrder.at(-1)),
    );
  }

  function randomizeChallengeOrders(language: ChallengeLanguage = challengeLanguage) {
    randomizePracticeChallengeOrder(language);
    randomizeProductionChallengeOrder(language);
  }

  function advanceChallenge() {
    const nextChallengeIndex = challengeIndex + 1;

    setPreviousDirectChallenge(
      !mode.requiresIme
        ? {
            display: currentDisplay,
            furigana: currentFurigana,
            guide: currentRomajiTarget?.guide ?? currentDirectGuideSource,
            reading: currentReading,
          }
        : null,
    );

    if (directChallenges.length > 0 && nextChallengeIndex % directChallenges.length === 0) {
      const nextOrder =
        nextDirectChallengeOrder.length === directChallenges.length
          ? nextDirectChallengeOrder
          : createShuffledIndexes(directChallenges.length, Math.random, directChallengeIndex);
      const upcomingOrder = createShuffledIndexes(
        directChallenges.length,
        Math.random,
        nextOrder.at(-1),
      );

      if (mode.group === "practice") {
        setPracticeChallengeOrder(nextOrder);
        setNextPracticeChallengeOrder(upcomingOrder);
      } else {
        setProductionChallengeOrder(nextOrder);
        setNextProductionChallengeOrder(upcomingOrder);
      }
    }

    setChallengeIndex(nextChallengeIndex);
  }

  const currentImeScore = mode.requiresIme
    ? scoreImeProductionInput(
        getScoredImeProductionInput({
          committedInputBeforeComposition,
          input,
        }),
        currentDisplay,
        { requireTrailingNewline: true },
      )
    : null;
  const scoringInput = getScoredImeProductionInput({
    committedInputBeforeComposition,
    input,
  });
  const currentImeMetricDeltas = mode.requiresIme && !isFinished
    ? calculateCurrentImeMetricDeltas({
        challengeLanguage,
        currentDisplay,
        currentReading,
        input: scoringInput,
      })
    : null;
  const currentKanaCharacters = getCurrentKanaCharacters({
    challengeLanguage,
    currentReading,
    currentRomajiTarget,
    input,
    modeRequiresIme: mode.requiresIme,
    targetLength: mode.requiresIme ? Array.from(currentDisplay).length : currentDisplay.length,
    targetProgress: currentImeScore?.completedTargetLength ?? 0,
  });
  const currentPromptCharacters =
    mode.requiresIme && currentImeScore ? currentImeScore.completedTargetLength : 0;

  const metrics = useMemo(
    () =>
      calculateMetrics({
        elapsedSeconds,
        keystrokes: stats.keystrokes + (currentImeMetricDeltas?.keystrokes ?? 0),
        kanaCharacters: stats.kanaCharacters + currentKanaCharacters,
        promptCharacters: stats.promptCharacters + currentPromptCharacters,
        characterAttempts:
          stats.characterAttempts + (currentImeMetricDeltas?.characterAttempts ?? 0),
        correctCharacters:
          stats.correctCharacters + (currentImeMetricDeltas?.correctCharacters ?? 0),
        mistakes: stats.mistakes + (currentImeMetricDeltas?.mistakes ?? 0),
        intervals: stats.intervals,
        accuracyExponent: mode.accuracyExponent,
        scoreDurationSeconds:
          stored.settings.rankCalculationMode === "actual" ? durationSeconds : undefined,
        useFlowMultiplier: mode.id === "practice-flow",
      }),
    [
      durationSeconds,
      elapsedSeconds,
      currentKanaCharacters,
      currentImeMetricDeltas,
      currentPromptCharacters,
      mode.accuracyExponent,
      mode.id,
      stats,
      stored.settings.rankCalculationMode,
    ],
  );

  const currentRank = getRank(metrics.score);
  const currentCorrect = currentImeScore
    ? currentImeScore.correctCharacters
    : countCorrectDirectCharacters(input, currentInputTarget);
  const currentAccuracy =
    currentImeScore
      ? currentImeScore.correctCharacters + currentImeScore.mistakes > 0
        ? currentImeScore.correctCharacters /
          (currentImeScore.correctCharacters + currentImeScore.mistakes)
        : 1
      : input.length > 0
        ? currentCorrect / input.length
        : 1;
  const isProductionBlocked =
    mode.group === "production" &&
    !canPlayProductionMode({ modeId: mode.id as ProductionModeId, unlocked: productionUnlocked });
  const productionBlockReason = currentProductionPlayable
    ? "本番モードは仮レーティング A0 以上で解放されます。"
    : ALPHA_PRODUCTION_LOCK_MESSAGE;
  const progress = Math.min(100, (elapsedSeconds / durationSeconds) * 100);
  const correctionDebt = getVisibleCorrectionDebt({
    acceptsTextInput,
    directMistakeDebt: stats.mistakeDebt,
    imeEmptyEnterDebt,
    modeLockMistakes: mode.lockMistakes,
  });
  const nextChallengePreview =
    mode.group === "practice" &&
    stored.settings.nextChallengePreviewMode !== "none"
      ? (nextDirectChallenge?.display ?? "")
      : "";

  useEffect(() => {
    const nextStored = readStoredState(window.localStorage);
    cacheStoredState(nextStored);
    setStored(nextStored);
    setHasLoadedStoredState(true);
  }, []);

  useEffect(() => {
    if (
      !shouldPersistStoredState({
        hasLoadedStoredState,
        skipNextPersist: skipNextPersistRef.current,
      })
    ) {
      if (skipNextPersistRef.current) {
        skipNextPersistRef.current = false;
      }
      return;
    }

    cacheStoredState(stored);
    window.localStorage.setItem(storageKey, JSON.stringify(stored));
  }, [hasLoadedStoredState, stored]);

  useEffect(() => {
    document.documentElement.dataset.theme = stored.settings.theme;
  }, [stored.settings.theme]);

  useEffect(() => {
    if (!startedAt || isFinished) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => window.clearInterval(timer);
  }, [isFinished, startedAt]);

  useEffect(() => {
    if (startedAt && !isFinished && remainingSeconds <= 0) {
      finishTimedOutSession();
    }
  });

  useEffect(() => {
    if (
      shouldAutoRetireSession({
        accuracy: metrics.accuracy,
        accuracyRetireMinimumCompletedPrompts: acceptsTextInput ? 2 : 0,
        allowConsecutiveMistypeRetire: !acceptsTextInput,
        isFinished,
        isProductionBlocked,
        now,
        settings: stored.settings,
        startedAt,
        stats,
      })
    ) {
      finishSession("retired");
    }
  });

  useEffect(() => {
    if (screen !== "typing" || acceptsTextInput || isProductionBlocked) {
      return;
    }

    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      handleDirectKeyDown(event);
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  });

  useEffect(() => {
    if (!mistakeFlash) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMistakeFlash(null);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [mistakeFlash]);

  function triggerMistakeFlash() {
    setMistakeFlash((previous) => ({
      id: (previous?.id ?? 0) + 1,
      input,
    }));
  }

  function prepareSession() {
    setStats(initialStats);
    setInput("");
    setChallengeIndex(0);
    setPreviousDirectChallenge(null);
    randomizeChallengeOrders();
    setStartedAt(null);
    setNow(Date.now());
    setIsFinished(false);
    setFinishReason(null);
    setImeError("");
    setImeEmptyEnterDebt(0);
    setCommittedInputBeforeComposition(null);
    setMistakeFlash(null);
    window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }

  function beginSession() {
    const timestamp = Date.now();
    setStartedAt(timestamp);
    setNow(timestamp);
    setIsFinished(false);
  }

  function resetSession(language: ChallengeLanguage = challengeLanguage) {
    setStats(initialStats);
    setInput("");
    setChallengeIndex(0);
    setPreviousDirectChallenge(null);
    randomizeChallengeOrders(language);
    setStartedAt(null);
    setNow(Date.now());
    setIsFinished(false);
    setFinishReason(null);
    setImeError("");
    setImeEmptyEnterDebt(0);
    setCommittedInputBeforeComposition(null);
    setMistakeFlash(null);
  }

  function finishSession(reason: FinishReason = "completed") {
    if (isFinished) {
      return;
    }

    setIsFinished(true);
    setFinishReason(reason);

    const sessionScore =
      reason === "retired" ? applyAutoRetireScorePenalty(metrics.score) : metrics.score;
    const sessionRank = getRank(sessionScore);

    if (reason !== "retired") {
      playTypingSound(
        getFinishSoundKind({
          modeGroup: mode.group,
          score: sessionScore,
          bestPracticeScore: stored.bestPracticeScore,
          bestProductionScore: stored.bestProductionScore,
        }),
      );
    }

    const session: StoredSession = {
      modeId,
      challengeLanguage,
      score: sessionScore,
      rank: sessionRank.label,
      accuracy: metrics.accuracy,
      keysPerSecond: metrics.keysPerSecond,
      createdAt: new Date().toISOString(),
    };

    setStored((previous) => ({
      settings: previous.settings,
      bestPracticeScore:
        mode.group === "practice"
          ? Math.max(previous.bestPracticeScore, sessionScore)
          : previous.bestPracticeScore,
      bestProductionScore:
        mode.group === "production"
          ? Math.max(previous.bestProductionScore, sessionScore)
          : previous.bestProductionScore,
      sessions: [session, ...previous.sessions].slice(0, 8),
    }));
  }

  function finishTimedOutSession() {
    if (acceptsTextInput) {
      setStats((previous) =>
        finalizeTimedOutImeProductionStats({
          challengeLanguage,
          currentDisplay,
          currentReading,
          input,
          stats: previous,
        }),
      );
      setImeEmptyEnterDebt(0);
    }

    finishSession();
  }

  function selectMode(nextModeId: ModeId) {
    const nextMode = modes.find((item) => item.id === nextModeId);
    if (
      !nextMode ||
      (nextMode.group === "production" &&
        !canPlayProductionMode({
          modeId: nextMode.id as ProductionModeId,
          unlocked: productionUnlocked,
        }))
    ) {
      return;
    }

    setModeId(nextModeId);
    resetSession();
    setScreen("typing");
  }

  function returnToModeSelect() {
    resetSession();
    setScreen("mode-select");
  }

  function changeChallengeLanguage(nextLanguage: ChallengeLanguage) {
    if (challengeLanguage === nextLanguage) {
      return;
    }

    setChallengeLanguage(nextLanguage);
    resetSession(nextLanguage);
  }

  function updateSettings(nextSettings: Partial<AppSettings>) {
    setStored((previous) => ({
      ...previous,
      settings: normalizeAppSettings({
        ...previous.settings,
        ...nextSettings,
      }),
    }));
  }

  function clearLocalData() {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("ultitype:")) {
        window.localStorage.removeItem(key);
      }
    }

    skipNextPersistRef.current = true;
    const nextStored = {
      ...getInitialStoredState(),
      bestPracticeScore: 0,
      bestProductionScore: 0,
      sessions: [],
      settings: { ...initialSettings },
    };
    cacheStoredState(nextStored);
    setStored(nextStored);
    setModeId("practice-accuracy");
    setChallengeLanguage("ja");
    setProductionDuration(300);
    resetSession();
    setScreen("mode-select");
  }

  function recordKey(
    metricKeystrokes = 1,
    physicalKeystrokes = 1,
    stabilityInput?: KeyStabilityInput,
  ) {
    const timestamp = Date.now();

    setStats((previous) => {
      const intervalMs = previous.lastKeyAt === null ? null : timestamp - previous.lastKeyAt;
      const nextHistory = stabilityInput
        ? [
            ...previous.keyStabilityHistory,
            {
              id: previous.keyStabilityHistory.length,
              key: stabilityInput.key,
              intervalMs,
              isCorrect: stabilityInput.isCorrect,
              kind: stabilityInput.kind,
              promptIndex: previous.completedPrompts,
              at: timestamp,
            },
          ]
        : previous.keyStabilityHistory;

      return {
        ...previous,
        keystrokes: previous.keystrokes + metricKeystrokes,
        physicalKeystrokes: previous.physicalKeystrokes + physicalKeystrokes,
        intervals:
          intervalMs === null
            ? previous.intervals
            : [...previous.intervals, intervalMs],
        keyStabilityHistory: nextHistory,
        lastKeyAt: timestamp,
        lastInputAt: timestamp,
      };
    });
  }

  function handleDirectKeyDown(event: DirectKeyEvent) {
    if (acceptsTextInput || isFinished) {
      return;
    }

    const key = getDirectInputKey(event);
    if (!key) {
      return;
    }

    event.preventDefault();

    const directState = {
      input,
      scoredInputLength: stats.scoredInputLength,
      mistakeDebt: stats.mistakeDebt,
      mistakeInput: stats.mistakeInput,
      characterAttempts: stats.characterAttempts,
      correctCharacters: stats.correctCharacters,
      mistakes: stats.mistakes,
      completedPrompts: stats.completedPrompts,
    };

    if (
      !startedAt &&
      !isDirectKeyCorrect({
        state: directState,
        key,
        target: currentInputTarget,
      })
    ) {
      playTypingSound("mistake");
      triggerMistakeFlash();
      return;
    }

    if (!startedAt) {
      beginSession();
    }

    const result = applyDirectKey({
      state: directState,
      key,
      target: currentInputTarget,
      lockMistakes: mode.lockMistakes,
    });
    const didMistype = result.state.mistakes > directState.mistakes;
    const didCompletePrompt = result.state.completedPrompts > directState.completedPrompts;
    let metricKeystrokes = result.scoredKeystrokes;

    if (
      mode.group === "production" &&
      !mode.requiresIme &&
      challengeLanguage === "ja" &&
      currentRomajiTarget &&
      currentShortestRomajiTarget &&
      key.length === 1 &&
      !didMistype
    ) {
      const previousPredictedKeystrokes = countPreferredRomajiProgressKeystrokes(
        currentRomajiTarget,
        currentShortestRomajiTarget,
        input,
      );
      const nextPredictedKeystrokes = didCompletePrompt
        ? countShortestRomajiKeystrokes(currentDirectRomajiSource)
        : countPreferredRomajiProgressKeystrokes(
            currentRomajiTarget,
            currentShortestRomajiTarget,
            input + key,
          );
      metricKeystrokes = Math.max(0, nextPredictedKeystrokes - previousPredictedKeystrokes);
    }

    playTypingSound(didMistype ? "mistake" : "normal");
    if (didMistype) {
      triggerMistakeFlash();
    }
    recordKey(metricKeystrokes, 1, {
      key,
      isCorrect: key === "Backspace" ? true : !didMistype,
      kind: key === "Backspace" ? "correction" : "input",
    });
    setStats((previous) => ({
      ...previous,
      scoredInputLength: result.state.scoredInputLength,
      characterAttempts: result.state.characterAttempts,
      correctCharacters: result.state.correctCharacters,
      mistakes: result.state.mistakes,
      mistakeDebt: result.state.mistakeDebt,
      mistakeInput: result.state.mistakeInput ?? "",
      kanaCharacters:
        previous.kanaCharacters +
        (didCompletePrompt
          ? countMetricCharacters(challengeLanguage === "ja" ? currentReading : currentDisplay)
          : 0),
      completedPrompts: result.state.completedPrompts,
      lastKeyAt:
        result.state.completedPrompts > previous.completedPrompts ? null : previous.lastKeyAt,
    }));

    setInput(result.state.input);

    if (didCompletePrompt) {
      advanceChallenge();
    }
  }

  function handleImeKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (!acceptsTextInput || isFinished) {
      return;
    }

    const emptyEnterLockAction = getImeEmptyEnterLockAction({
      input,
      isLocked: imeEmptyEnterDebt > 0,
      key: event.key,
      shiftKey: event.shiftKey,
    });

    if (emptyEnterLockAction === "unlock") {
      event.preventDefault();
      setImeEmptyEnterDebt((previous) => Math.max(0, previous - 1));
      setImeError("");
      if (startedAt) {
        playTypingSound("normal");
        recordKey(0, 1, {
          key: "Backspace",
          isCorrect: true,
          kind: "correction",
        });
      }
      return;
    }

    if (emptyEnterLockAction === "locked") {
      event.preventDefault();
      return;
    }

    if (emptyEnterLockAction === "mistake-lock") {
      event.preventDefault();
      setImeEmptyEnterDebt((previous) => previous + 1);
      playTypingSound("mistake");
      if (startedAt) {
        recordKey(0, 1, {
          key: "Enter",
          isCorrect: false,
          kind: "input",
        });
        setStats((previous) => ({
          ...previous,
          characterAttempts: previous.characterAttempts + 1,
          mistakes: previous.mistakes + 1,
        }));
      }
      return;
    }

    if (!ignoredKeys.has(event.key) && event.key !== "Enter" && startedAt) {
      playTypingSound("normal");
      recordKey(0, 1, {
        key: event.key,
        isCorrect: true,
        kind: "input",
      });
    }

    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!startedAt) {
      return;
    }

    if (
      !shouldSubmitImeProductionInputOnEnter({
        input,
        target: currentDisplay,
      })
    ) {
      setImeEmptyEnterDebt((previous) => previous + 1);
      playTypingSound("mistake");
      recordKey(0, 1, {
        key: "Enter",
        isCorrect: false,
        kind: "input",
      });
      setStats((previous) => ({
        ...previous,
        characterAttempts: previous.characterAttempts + 1,
        mistakes: previous.mistakes + 1,
      }));
      return;
    }

    const score = scoreImeProductionInput(input, currentDisplay, {
      forceComplete: true,
      requireTrailingNewline: true,
    });
    const estimatedKeystrokes =
      challengeLanguage === "ja"
        ? countShortestRomajiKeystrokes(kanaReadingToRomaji(currentReading))
        : countMetricCharacters(currentDisplay);
    playTypingSound(score.mistakes > 0 ? "mistake" : "normal");
    setStats((previous) => ({
      ...previous,
      keystrokes: previous.keystrokes + estimatedKeystrokes,
      scoredInputLength: 0,
      kanaCharacters:
        previous.kanaCharacters +
        countMetricCharacters(challengeLanguage === "ja" ? currentReading : currentDisplay),
      promptCharacters: previous.promptCharacters + score.targetLength,
      characterAttempts:
        previous.characterAttempts + score.correctCharacters + score.mistakes,
      correctCharacters: previous.correctCharacters + score.correctCharacters,
      mistakes: previous.mistakes + score.mistakes,
      completedPrompts: previous.completedPrompts + 1,
    }));
    setInput("");
    setImeError("");
    setImeEmptyEnterDebt(0);
    setCommittedInputBeforeComposition(null);
    advanceChallenge();
  }

  function handleImeInput(nextInput: string) {
    if (
      !shouldAcceptImeTextInputChange({
        acceptsTextInput,
        imeEmptyEnterDebt,
      })
    ) {
      return;
    }

    if (!startedAt && nextInput.length > 0) {
      beginSession();
      playTypingSound("normal");
      recordKey(0, 1, {
        key: nextInput.at(-1) ?? "",
        isCorrect: true,
        kind: "input",
      });
    }

    setInput(nextInput);
    if (startedAt) {
      setStats((previous) => markTextInputActivity(previous, Date.now()));
    }
    if (imeError && imeEmptyEnterDebt <= 0) {
      setImeError("");
    }
  }

  function handleImeCompositionStart(currentInput: string) {
    if (!acceptsTextInput || imeEmptyEnterDebt > 0) {
      return;
    }

    setCommittedInputBeforeComposition(currentInput);
  }

  function handleImeCompositionEnd(nextInput: string) {
    setCommittedInputBeforeComposition(null);
    handleImeInput(nextInput);
  }

  function preventDirectTextInput(
    event:
      | FormEvent<HTMLTextAreaElement>
      | ClipboardEvent<HTMLTextAreaElement>
      | CompositionEvent<HTMLTextAreaElement>
      | DragEvent<HTMLTextAreaElement>,
  ) {
    if (!acceptsTextInput) {
      event.preventDefault();
    }
  }

  return {
    bestPracticeRank,
    bestProductionRank,
    challengeLanguage,
    currentAccuracy,
    productionDuration,
    productionPlayableModes,
    productionUnlocked,
    screen,
    settings: stored.settings,
    sessions: stored.sessions,
    typingPanelProps: {
      acceptsTextInput,
      challengeLanguage,
      correctionDebt,
      currentAccuracy,
      currentDisplay,
      currentFurigana,
      currentReading,
      elapsedSeconds: startedAt ? elapsedSeconds : null,
      currentGuide:
        currentGuide ?? (typeof currentInputTarget === "string" ? currentInputTarget : currentInputTarget.guide),
      currentRomajiTarget,
      currentRank,
      finishReason,
      imeError,
      input,
      inputRef,
      scoringInput,
      isFinished,
      isProductionBlocked,
      productionBlockReason,
      mistakeFlash: mistakeFlash?.input === input ? mistakeFlash : null,
      metrics,
      mode,
      nextChallengeDisplay: mode.requiresIme
        ? nextImeChallenge
        : (nextDirectChallenge?.display ?? ""),
      nextChallengeFurigana:
        mode.requiresIme && challengeLanguage === "ja"
          ? (longChallengeFurigana[nextDirectChallengeIndex % longChallengeFurigana.length] ?? [])
          : (nextDirectChallenge?.furigana ?? []),
      nextChallengeGuide: nextRomajiTarget?.guide ?? nextDirectGuideSource,
      nextChallengePreview,
      nextChallengePreviewMode: stored.settings.nextChallengePreviewMode,
      targetDisplayOrder: stored.settings.targetDisplayOrder,
      nextChallengeReading: nextReading,
      nextChallengeRomajiTarget: nextRomajiTarget,
      previousChallengeDisplay: previousDirectChallenge?.display ?? "",
      previousChallengeFurigana: previousDirectChallenge?.furigana ?? [],
      previousChallengeGuide: previousDirectChallenge?.guide ?? "",
      previousChallengeReading: previousDirectChallenge?.reading ?? "",
      progress,
      remainingSeconds,
      showFuriganaDisplay: stored.settings.showFuriganaDisplay,
      showFuriganaMarker: stored.settings.showFuriganaMarker,
      showHiraganaDisplay: stored.settings.showHiraganaDisplay,
      showHiraganaMarker: stored.settings.showHiraganaMarker,
      showKanjiDisplay: stored.settings.showKanjiDisplay,
      showKanjiMarker: stored.settings.showKanjiMarker,
      showKanjiInputProgress: stored.settings.showKanjiInputProgress,
      showHiraganaInputProgress: stored.settings.showHiraganaInputProgress,
      showRomajiMarker: stored.settings.showRomajiMarker,
      romajiMarkerMode: stored.settings.romajiMarkerMode,
      japaneseFontFamily: stored.settings.japaneseFontFamily,
      englishFontFamily: stored.settings.englishFontFamily,
      kanjiFontSize: stored.settings.kanjiFontSize,
      kanjiInputProgressFontSize: stored.settings.kanjiInputProgressFontSize,
      furiganaFontScale: stored.settings.furiganaFontScale,
      hiraganaFontSize: stored.settings.hiraganaFontSize,
      hiraganaInputProgressFontSize: stored.settings.hiraganaInputProgressFontSize,
      romajiFontSize: stored.settings.romajiFontSize,
      kanjiLineHeight: stored.settings.kanjiLineHeight,
      kanjiMarginBottom: stored.settings.kanjiMarginBottom,
      kanjiInputProgressLineHeight: stored.settings.kanjiInputProgressLineHeight,
      kanjiInputProgressMarginBottom: stored.settings.kanjiInputProgressMarginBottom,
      furiganaLineHeight: stored.settings.furiganaLineHeight,
      furiganaMarginBottom: stored.settings.furiganaMarginBottom,
      hiraganaLineHeight: stored.settings.hiraganaLineHeight,
      hiraganaMarginBottom: stored.settings.hiraganaMarginBottom,
      hiraganaInputProgressLineHeight: stored.settings.hiraganaInputProgressLineHeight,
      hiraganaInputProgressMarginBottom: stored.settings.hiraganaInputProgressMarginBottom,
      romajiLineHeight: stored.settings.romajiLineHeight,
      romajiMarginBottom: stored.settings.romajiMarginBottom,
      productionLongTextLineCount: stored.settings.productionLongTextLineCount,
      soundSettings: stored.settings,
      startedAt,
      stats,
      rankCalculationMode: stored.settings.rankCalculationMode,
      strictMistakeDisplayMode: stored.settings.strictMistakeDisplayMode,
      strictMistakeInput: stats.mistakeInput,
      topDisplayMetricIds: stored.settings.topDisplayMetricIds,
      enSpaceDisplay: stored.settings.enSpaceDisplay,
      onBackToModeSelect: returnToModeSelect,
      onImeInput: handleImeInput,
      onImeCompositionEnd: handleImeCompositionEnd,
      onImeCompositionStart: handleImeCompositionStart,
      onImeKeyDown: handleImeKeyDown,
      onPrepareSession: prepareSession,
      onPreventDirectTextInput: preventDirectTextInput,
      onResetSession: () => resetSession(),
    },
    bestPracticeScore: stored.bestPracticeScore,
    bestProductionScore: stored.bestProductionScore,
    metrics,
    stats,
    changeChallengeLanguage,
    clearLocalData,
    selectMode,
    setProductionDuration,
    showModeSelect: () => setScreen("mode-select"),
    updateSettings,
  };
}
