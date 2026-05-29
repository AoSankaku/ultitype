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
import { type DirectChallenge, englishLongChallenges, longChallenges } from "@/src/lib/challenges";
import {
  type ModeId,
  applyDirectKey,
  calculateMetrics,
  countCorrectDirectCharacters,
  countImeCorrectCharacters,
  createRomajiInputTarget,
  getRank,
  isDirectKeyCorrect,
  isImeSubmissionMatch,
  isProductionUnlocked,
  modes,
  shouldAcceptTextInput,
} from "@/src/lib/typing";
import {
  ignoredKeys,
  initialSettings,
  initialStats,
  initialStoredState,
  storageKey,
} from "./constants";
import { shouldPersistStoredState } from "./stored-state";
import {
  createShuffledIndexes,
  estimateImeKeystrokes,
  getDirectChallenges,
  getOrderedChallengeIndex,
  removeRomajiVisualSpaces,
} from "./challenge-utils";
import type {
  AppSettings,
  ChallengeLanguage,
  DirectKeyEvent,
  FinishReason,
  ProductionDuration,
  RuntimeStats,
  Screen,
  StoredSession,
  StoredState,
} from "./types";
import { getFinishSoundKind, useTypingSounds } from "./typing-sounds";

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

export function useTypingSession() {
  const [stored, setStored] = useState<StoredState>(initialStoredState);
  const [modeId, setModeId] = useState<ModeId>("practice-accuracy");
  const [screen, setScreen] = useState<Screen>("mode-select");
  const [challengeLanguage, setChallengeLanguage] = useState<ChallengeLanguage>("ja");
  const [productionDuration, setProductionDuration] = useState<ProductionDuration>(300);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [practiceChallengeOrder, setPracticeChallengeOrder] = useState(() =>
    createShuffledIndexes(getDirectChallenges("ja", "practice").length),
  );
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<RuntimeStats>(initialStats);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isFinished, setIsFinished] = useState(false);
  const [finishReason, setFinishReason] = useState<FinishReason | null>(null);
  const [imeError, setImeError] = useState("");
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
  const directChallengeIndex =
    mode.group === "practice"
      ? getOrderedChallengeIndex(challengeIndex, directChallenges.length, practiceChallengeOrder)
      : getOrderedChallengeIndex(challengeIndex, directChallenges.length, []);
  const currentDirectChallenge =
    directChallenges[directChallengeIndex] ??
    ({
      display: "",
      guide: "",
      input: "",
    } satisfies DirectChallenge);
  const imeChallenges = challengeLanguage === "ja" ? longChallenges : englishLongChallenges;
  const currentImeChallenge = imeChallenges[challengeIndex % imeChallenges.length] ?? "";
  const currentDirectGuideSource = currentDirectChallenge.guide ?? currentDirectChallenge.input;
  const currentDirectRomajiSource =
    currentDirectChallenge.romajiSource ?? currentDirectGuideSource;
  const currentVisibleDirectRomajiSource =
    challengeLanguage === "ja" &&
    !mode.requiresIme &&
    !stored.settings.showRomajiWordSpaces
      ? removeRomajiVisualSpaces(currentDirectRomajiSource)
      : currentDirectRomajiSource;
  const currentRomajiTarget =
    challengeLanguage === "ja" && !mode.requiresIme
      ? createRomajiInputTarget(currentVisibleDirectRomajiSource, {
          preset: stored.settings.romajiInputPreset,
          selections: stored.settings.romajiInputSelections,
          allowSplitYoon: stored.settings.allowSplitYoon,
          sokuon: stored.settings.sokuonInput,
        })
      : null;
  const currentDisplay = mode.requiresIme
    ? currentImeChallenge
    : currentDirectChallenge.display;
  const currentInputTarget = mode.requiresIme
    ? currentImeChallenge
    : (currentRomajiTarget ?? currentDirectChallenge.input);
  const currentGuide =
    challengeLanguage === "ja" && !mode.requiresIme
      ? currentRomajiTarget?.guide
      : currentDirectChallenge.guide;
  const bestPracticeRank = getRank(stored.bestPracticeScore);
  const bestProductionRank = getRank(stored.bestProductionScore);

  function randomizePracticeChallengeOrder(language: ChallengeLanguage = challengeLanguage) {
    setPracticeChallengeOrder(
      createShuffledIndexes(getDirectChallenges(language, "practice").length),
    );
  }

  function advanceChallenge() {
    const nextChallengeIndex = challengeIndex + 1;

    if (
      mode.group === "practice" &&
      directChallenges.length > 0 &&
      nextChallengeIndex % directChallenges.length === 0
    ) {
      setPracticeChallengeOrder(
        createShuffledIndexes(directChallenges.length, Math.random, directChallengeIndex),
      );
    }

    setChallengeIndex(nextChallengeIndex);
  }

  const metrics = useMemo(
    () =>
      calculateMetrics({
        elapsedSeconds,
        keystrokes: stats.keystrokes,
        characterAttempts: stats.characterAttempts,
        correctCharacters: stats.correctCharacters,
        mistakes: stats.mistakes,
        intervals: stats.intervals,
        accuracyExponent: mode.accuracyExponent,
        useFlowMultiplier: mode.id === "practice-flow",
      }),
    [elapsedSeconds, mode.accuracyExponent, mode.id, stats],
  );

  const currentRank = getRank(metrics.score);
  const currentCorrect = mode.requiresIme
    ? countImeCorrectCharacters(input, currentDisplay)
    : countCorrectDirectCharacters(input, currentInputTarget);
  const currentAccuracy =
    mode.requiresIme && currentDisplay.length > 0
      ? currentCorrect / currentDisplay.length
      : input.length > 0
        ? currentCorrect / input.length
        : 1;
  const isProductionBlocked = mode.group === "production" && !productionUnlocked;
  const progress = Math.min(100, (elapsedSeconds / durationSeconds) * 100);
  const correctionDebt = !acceptsTextInput && mode.lockMistakes ? stats.mistakeDebt : 0;

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setHasLoadedStoredState(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      setStored({
        ...initialStoredState,
        ...parsed,
        settings: {
          ...initialSettings,
          ...parsed.settings,
          sokuonInput: {
            ...initialSettings.sokuonInput,
            ...parsed.settings?.sokuonInput,
          },
        },
      });
    } catch {
      window.localStorage.removeItem(storageKey);
    }

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
      finishSession();
    }
  });

  useEffect(() => {
    const idleRetireMs = stored.settings.idleRetireSeconds * 1000;
    if (!startedAt || isFinished || idleRetireMs <= 0 || isProductionBlocked) {
      return;
    }

    const lastActivityAt = stats.lastInputAt ?? startedAt;
    if (now - lastActivityAt >= idleRetireMs) {
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

  function prepareSession() {
    setStats(initialStats);
    setInput("");
    setChallengeIndex(0);
    randomizePracticeChallengeOrder();
    setStartedAt(null);
    setNow(Date.now());
    setIsFinished(false);
    setFinishReason(null);
    setImeError("");
    window.requestAnimationFrame(() => {
      if (acceptsTextInput) {
        inputRef.current?.focus();
        return;
      }

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
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
    randomizePracticeChallengeOrder(language);
    setStartedAt(null);
    setNow(Date.now());
    setIsFinished(false);
    setFinishReason(null);
    setImeError("");
  }

  function finishSession(reason: FinishReason = "completed") {
    if (isFinished) {
      return;
    }

    setIsFinished(true);
    setFinishReason(reason);

    if (reason === "retired") {
      return;
    }

    playTypingSound(
      getFinishSoundKind({
        modeGroup: mode.group,
        score: metrics.score,
        bestPracticeScore: stored.bestPracticeScore,
        bestProductionScore: stored.bestProductionScore,
      }),
    );

    const session: StoredSession = {
      modeId,
      challengeLanguage,
      score: metrics.score,
      rank: currentRank.label,
      accuracy: metrics.accuracy,
      keysPerSecond: metrics.keysPerSecond,
      createdAt: new Date().toISOString(),
    };

    setStored((previous) => ({
      settings: previous.settings,
      bestPracticeScore:
        mode.group === "practice"
          ? Math.max(previous.bestPracticeScore, metrics.score)
          : previous.bestPracticeScore,
      bestProductionScore:
        mode.group === "production"
          ? Math.max(previous.bestProductionScore, metrics.score)
          : previous.bestProductionScore,
      sessions: [session, ...previous.sessions].slice(0, 8),
    }));
  }

  function selectMode(nextModeId: ModeId) {
    const nextMode = modes.find((item) => item.id === nextModeId);
    if (!nextMode || (nextMode.group === "production" && !productionUnlocked)) {
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
      settings: {
        ...previous.settings,
        ...nextSettings,
      },
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
    setStored({
      ...initialStoredState,
      sessions: [],
      settings: { ...initialSettings },
    });
    setModeId("practice-accuracy");
    setChallengeLanguage("ja");
    setProductionDuration(300);
    resetSession();
    setScreen("mode-select");
  }

  function recordKey(metricKeystrokes = 1, physicalKeystrokes = 1) {
    const timestamp = Date.now();

    setStats((previous) => ({
      ...previous,
      keystrokes: previous.keystrokes + metricKeystrokes,
      physicalKeystrokes: previous.physicalKeystrokes + physicalKeystrokes,
      intervals:
        previous.lastKeyAt === null
          ? previous.intervals
          : [...previous.intervals, timestamp - previous.lastKeyAt],
      lastKeyAt: timestamp,
      lastInputAt: timestamp,
    }));
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

    playTypingSound(didMistype ? "mistake" : "normal");
    recordKey(result.scoredKeystrokes);
    setStats((previous) => ({
      ...previous,
      scoredInputLength: result.state.scoredInputLength,
      characterAttempts: result.state.characterAttempts,
      correctCharacters: result.state.correctCharacters,
      mistakes: result.state.mistakes,
      mistakeDebt: result.state.mistakeDebt,
      completedPrompts: result.state.completedPrompts,
      lastKeyAt:
        result.state.completedPrompts > previous.completedPrompts ? null : previous.lastKeyAt,
    }));

    setInput(result.state.input);

    if (result.state.completedPrompts > stats.completedPrompts) {
      advanceChallenge();
    }
  }

  function handleImeKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (!acceptsTextInput || isFinished) {
      return;
    }

    if (!ignoredKeys.has(event.key) && event.key !== "Enter" && startedAt) {
      playTypingSound("normal");
      recordKey(0, 1);
    }

    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!startedAt) {
      return;
    }

    const matches = isImeSubmissionMatch(input, currentDisplay);

    if (!matches) {
      playTypingSound("mistake");
      setImeError("課題文と一致していません。修正してから Enter で提出してください。");
      setStats((previous) => ({ ...previous, mistakes: previous.mistakes + 1 }));
      return;
    }

    playTypingSound("normal");
    const estimatedKeystrokes = estimateImeKeystrokes(currentDisplay);
    setStats((previous) => ({
      ...previous,
      keystrokes: previous.keystrokes + estimatedKeystrokes,
      scoredInputLength: 0,
      characterAttempts: previous.characterAttempts + currentDisplay.length,
      correctCharacters: previous.correctCharacters + currentDisplay.length,
      completedPrompts: previous.completedPrompts + 1,
    }));
    setInput("");
    setImeError("");
    advanceChallenge();
  }

  function handleImeInput(nextInput: string) {
    if (!acceptsTextInput) {
      return;
    }

    if (!startedAt && nextInput.length > 0) {
      beginSession();
      playTypingSound("normal");
      recordKey(0, 1);
    }

    setInput(nextInput);
    if (imeError) {
      setImeError("");
    }
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
    productionUnlocked,
    screen,
    settings: stored.settings,
    sessions: stored.sessions,
    typingPanelProps: {
      acceptsTextInput,
      challengeLanguage,
      correctionDebt,
      currentDisplay,
      elapsedSeconds: startedAt ? elapsedSeconds : null,
      currentGuide:
        currentGuide ?? (typeof currentInputTarget === "string" ? currentInputTarget : currentInputTarget.guide),
      currentRomajiTarget,
      currentRank,
      finishReason,
      imeError,
      input,
      inputRef,
      isFinished,
      isProductionBlocked,
      metrics,
      mode,
      progress,
      remainingSeconds,
      soundSettings: stored.settings,
      startedAt,
      stats,
      onBackToModeSelect: returnToModeSelect,
      onImeInput: handleImeInput,
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
