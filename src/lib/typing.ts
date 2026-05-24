export type ModeId =
  | "practice-accuracy"
  | "practice-flow"
  | "practice-speed"
  | "production-ime-off"
  | "production-ime-on";

export type ModeGroup = "practice" | "production";

export type TypingMode = {
  id: ModeId;
  group: ModeGroup;
  label: string;
  shortLabel: string;
  durationSeconds: number;
  accuracyExponent: number;
  lockMistakes: boolean;
  requiresIme: boolean;
  description: string;
};

export const modes: TypingMode[] = [
  {
    id: "practice-accuracy",
    group: "practice",
    label: "正確無比",
    shortLabel: "精度",
    durationSeconds: 120,
    accuracyExponent: 4.5,
    lockMistakes: true,
    requiresIme: false,
    description: "ミス後は Backspace で修正。正確率の重みが最も高い練習。",
  },
  {
    id: "practice-flow",
    group: "practice",
    label: "行雲流水",
    shortLabel: "均等",
    durationSeconds: 120,
    accuracyExponent: 3,
    lockMistakes: false,
    requiresIme: false,
    description: "打鍵間隔の均等さをスコアに乗算するリズム練習。",
  },
  {
    id: "practice-speed",
    group: "practice",
    label: "音速打破",
    shortLabel: "速度",
    durationSeconds: 120,
    accuracyExponent: 1.5,
    lockMistakes: false,
    requiresIme: false,
    description: "正確率の重みを軽くし、速度の限界を測る練習。",
  },
  {
    id: "production-ime-off",
    group: "production",
    label: "本番 IMEなし",
    shortLabel: "本番",
    durationSeconds: 300,
    accuracyExponent: 3,
    lockMistakes: false,
    requiresIme: false,
    description: "5分の本番測定。変換なしで長文を連続処理する。",
  },
  {
    id: "production-ime-on",
    group: "production",
    label: "本番 IMEあり",
    shortLabel: "IME",
    durationSeconds: 300,
    accuracyExponent: 3,
    lockMistakes: true,
    requiresIme: true,
    description: "行単位で課題と一致させて Enter で提出する。",
  },
];

export function shouldAcceptTextInput(mode: TypingMode): boolean {
  return mode.id === "production-ime-on";
}

export type MetricsInput = {
  elapsedSeconds: number;
  keystrokes: number;
  characterAttempts: number;
  correctCharacters: number;
  mistakes: number;
  intervals: number[];
  accuracyExponent: number;
  useFlowMultiplier?: boolean;
};

export type Metrics = {
  keysPerSecond: number;
  wpm: number;
  accuracy: number;
  paceMs: number;
  consistency: number;
  score: number;
};

export type DirectTypingState = {
  input: string;
  mistakeDebt: number;
  characterAttempts: number;
  correctCharacters: number;
  mistakes: number;
  completedPrompts: number;
};

export type DirectKeyInput = {
  state: DirectTypingState;
  key: string;
  target: string;
  lockMistakes: boolean;
};

export function applyDirectKey({ state, key, target, lockMistakes }: DirectKeyInput) {
  if (key === "Backspace") {
    if (lockMistakes && state.mistakeDebt > 0) {
      return {
        state: {
          ...state,
          mistakeDebt: state.mistakeDebt - 1,
        },
      };
    }

    return {
      state: {
        ...state,
        input: state.input.slice(0, -1),
      },
    };
  }

  if (key.length !== 1) {
    return { state };
  }

  if (lockMistakes && state.mistakeDebt > 0) {
    return {
      state: {
        ...state,
        mistakeDebt: state.mistakeDebt + 1,
        characterAttempts: state.characterAttempts + 1,
        mistakes: state.mistakes + 1,
      },
    };
  }

  const expected = target[state.input.length] ?? "";
  const isCorrect = key === expected;

  if (!isCorrect) {
    return {
      state: {
        ...state,
        mistakeDebt: lockMistakes ? state.mistakeDebt + 1 : state.mistakeDebt,
        characterAttempts: state.characterAttempts + 1,
        mistakes: state.mistakes + 1,
      },
    };
  }

  const nextInput = state.input + key;
  const completed = nextInput.length >= target.length;

  return {
    state: {
      ...state,
      input: completed ? "" : nextInput,
      characterAttempts: state.characterAttempts + 1,
      correctCharacters: state.correctCharacters + 1,
      completedPrompts: completed ? state.completedPrompts + 1 : state.completedPrompts,
    },
  };
}

export function calculateMetrics(input: MetricsInput): Metrics {
  const elapsed = Math.max(input.elapsedSeconds, 0.001);
  const keysPerSecond = input.keystrokes / elapsed;
  const accuracy =
    input.characterAttempts === 0
      ? 1
      : clamp(input.correctCharacters / input.characterAttempts, 0, 1);
  const wpm = input.correctCharacters / 5 / (elapsed / 60);
  const paceMs = calculateAverage(input.intervals);
  const consistency = calculateConsistency(input.intervals);
  const flowMultiplier = input.useFlowMultiplier ? consistency : 1;
  const score =
    keysPerSecond * 1000 * Math.pow(accuracy, input.accuracyExponent) * flowMultiplier;

  return {
    keysPerSecond,
    wpm,
    accuracy,
    paceMs,
    consistency,
    score,
  };
}

export type Rank = {
  label: string;
  colorName: string;
  level: number;
};

const rankBands = [
  { prefix: "G", count: 7, colorName: "灰" },
  { prefix: "F", count: 7, colorName: "薄緑" },
  { prefix: "E", count: 7, colorName: "薄青" },
  { prefix: "D", count: 7, colorName: "緑" },
  { prefix: "C", count: 7, colorName: "青" },
  { prefix: "B", count: 7, colorName: "橙" },
  { prefix: "A", count: 7, colorName: "赤" },
  { prefix: "S", count: 7, colorName: "金" },
  { prefix: "M", count: 10, colorName: "薄紫" },
  { prefix: "GM", count: 10, colorName: "紫" },
  { prefix: "HM", count: 10, colorName: "黒紫" },
  { prefix: "XM", count: 10, colorName: "黒" },
] as const;

const ranks: Rank[] = rankBands.flatMap((band) =>
  Array.from({ length: band.count }, (_, index) => ({
    label: `${band.prefix}${index}`,
    colorName: band.colorName,
    level: 0,
  })),
);

ranks.forEach((rank, index) => {
  rank.level = index;
});

const ultimateRank: Rank = {
  label: "UM",
  colorName: "虹",
  level: ranks.length,
};

export const a0RankLevel = ranks.find((rank) => rank.label === "A0")?.level ?? 42;

export function getRank(score: number): Rank {
  if (score <= 500) {
    return ranks[0];
  }

  const level = Math.floor((score - 500) / 90) + 1;
  return ranks[level] ?? ultimateRank;
}

export function isProductionUnlocked(bestPracticeScore: number): boolean {
  return getRank(bestPracticeScore).level >= a0RankLevel;
}

export function normalizeJapanesePunctuation(value: string): string {
  return value
    .replaceAll("，", "、")
    .replaceAll(",", "、")
    .replaceAll("．", "。")
    .replaceAll(".", "。")
    .replaceAll("･", "・")
    .replaceAll("・", "・");
}

export function isImeSubmissionMatch(input: string, target: string): boolean {
  return normalizeJapanesePunctuation(input.trim()) === normalizeJapanesePunctuation(target.trim());
}

export function countCorrectAtSamePositions(input: string, target: string): number {
  let correct = 0;
  const length = Math.min(input.length, target.length);

  for (let index = 0; index < length; index += 1) {
    if (input[index] === target[index]) {
      correct += 1;
    }
  }

  return correct;
}

export function countImeCorrectCharacters(input: string, target: string): number {
  const normalizedInput = normalizeJapanesePunctuation(input.trim());
  const normalizedTarget = normalizeJapanesePunctuation(target.trim());
  return isImeSubmissionMatch(input, target)
    ? target.length
    : countCorrectAtSamePositions(normalizedInput, normalizedTarget);
}

export function formatTimer(seconds: number): string {
  const clamped = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(clamped / 60);
  const rest = clamped % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateConsistency(intervals: number[]): number {
  const rhythmIntervals = filterRhythmIntervals(intervals);

  if (rhythmIntervals.length < 2) {
    return 1;
  }

  const average = calculateAverage(rhythmIntervals);
  if (average === 0) {
    return 1;
  }

  const variance =
    rhythmIntervals.reduce((sum, interval) => sum + Math.pow(interval - average, 2), 0) /
    rhythmIntervals.length;
  const standardDeviation = Math.sqrt(variance);

  return clamp(1 - standardDeviation / average, 0, 1);
}

function filterRhythmIntervals(intervals: number[]): number[] {
  if (intervals.length < 3) {
    return intervals;
  }

  const sorted = [...intervals].sort((left, right) => left - right);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  const pauseThreshold = median * 2.5;
  const filtered = intervals.filter((interval) => interval <= pauseThreshold);

  return filtered.length >= 2 ? filtered : intervals;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
