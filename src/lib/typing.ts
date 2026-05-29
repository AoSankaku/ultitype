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
    shortLabel: "安定",
    durationSeconds: 120,
    accuracyExponent: 3,
    lockMistakes: false,
    requiresIme: false,
    description: "自然な揺れを許容し、打鍵リズムの安定度をスコアに乗算する練習。",
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
  scoredInputLength: number;
  mistakeDebt: number;
  characterAttempts: number;
  correctCharacters: number;
  mistakes: number;
  completedPrompts: number;
};

export type RomajiInputPreset = "custom" | "shortest" | "hepburn";

export type RomajiVariantId =
  | "syllabicN"
  | "syllabicNBeforeVowel"
  | "syllabicNBeforeNaRow"
  | "shi"
  | "chi"
  | "tsu"
  | "fu"
  | "ji"
  | "sha"
  | "shu"
  | "sho"
  | "cha"
  | "chu"
  | "cho"
  | "ja"
  | "ju"
  | "jo";

export type RomajiVariantSelection = {
  accepted: string[];
  preferred: string;
};

export type SokuonInputId = "ltsu" | "xtsu" | "ltu" | "xtu";

export type SokuonInputSelection = {
  allowSplit: boolean;
  accepted: SokuonInputId[];
  preferred: SokuonInputId;
};

export type RomajiInputConfig = {
  preset: RomajiInputPreset;
  selections: Partial<Record<RomajiVariantId, RomajiVariantSelection>>;
  allowSplitYoon?: boolean;
  sokuon?: SokuonInputSelection;
};

export type RomajiVariantOption = {
  id: RomajiVariantId;
  label: string;
  alternatives: string[];
  shortest: string;
  hepburn: string;
};

type RomajiInputToken = {
  accepted: string[];
  preferred: string;
  variantId?: RomajiVariantId;
};

export type RomajiGuidePart =
  | {
      kind: "visual";
      text: string;
    }
  | {
      kind: "input";
      text: string;
      tokenIndex: number;
      variantId?: RomajiVariantId;
    };

export type RomajiInputTarget = {
  guide: string;
  parts: RomajiGuidePart[];
  tokens: RomajiInputToken[];
};

export type DirectKeyInput = {
  state: DirectTypingState;
  key: string;
  target: string | RomajiInputTarget;
  lockMistakes: boolean;
};

export type DirectKeyCorrectnessInput = Omit<DirectKeyInput, "lockMistakes">;

export type DirectKeyResult = {
  state: DirectTypingState;
  scoredKeystrokes: number;
};

export const romajiVariantOptions: RomajiVariantOption[] = [
  {
    id: "syllabicN",
    label: "ん",
    alternatives: ["n", "nn"],
    shortest: "n",
    hepburn: "n",
  },
  {
    id: "syllabicNBeforeVowel",
    label: "ん（母音・や行の前）",
    alternatives: ["nn"],
    shortest: "nn",
    hepburn: "nn",
  },
  {
    id: "syllabicNBeforeNaRow",
    label: "ん（な行の前）",
    alternatives: ["nn"],
    shortest: "nn",
    hepburn: "nn",
  },
  { id: "shi", label: "し", alternatives: ["shi", "si", "ci"], shortest: "si", hepburn: "shi" },
  { id: "chi", label: "ち", alternatives: ["chi", "ti"], shortest: "ti", hepburn: "chi" },
  { id: "tsu", label: "つ", alternatives: ["tsu", "tu"], shortest: "tu", hepburn: "tsu" },
  { id: "fu", label: "ふ", alternatives: ["fu", "hu"], shortest: "hu", hepburn: "fu" },
  { id: "ji", label: "じ", alternatives: ["ji", "zi"], shortest: "zi", hepburn: "ji" },
  { id: "sha", label: "しゃ", alternatives: ["sha", "sya"], shortest: "sya", hepburn: "sha" },
  { id: "shu", label: "しゅ", alternatives: ["shu", "syu"], shortest: "syu", hepburn: "shu" },
  { id: "sho", label: "しょ", alternatives: ["sho", "syo"], shortest: "syo", hepburn: "sho" },
  { id: "cha", label: "ちゃ", alternatives: ["cha", "tya"], shortest: "tya", hepburn: "cha" },
  { id: "chu", label: "ちゅ", alternatives: ["chu", "tyu"], shortest: "tyu", hepburn: "chu" },
  { id: "cho", label: "ちょ", alternatives: ["cho", "tyo"], shortest: "tyo", hepburn: "cho" },
  { id: "ja", label: "じゃ", alternatives: ["ja", "zya"], shortest: "zya", hepburn: "ja" },
  { id: "ju", label: "じゅ", alternatives: ["ju", "zyu"], shortest: "zyu", hepburn: "ju" },
  { id: "jo", label: "じょ", alternatives: ["jo", "zyo"], shortest: "zyo", hepburn: "jo" },
];

export const sokuonInputOptions = ["ltsu", "xtsu", "ltu", "xtu"] as const satisfies readonly SokuonInputId[];

const sokuonSourceMarker = "^";

const defaultSokuonInputSelection: SokuonInputSelection = {
  allowSplit: true,
  accepted: [...sokuonInputOptions],
  preferred: "xtu",
};

const romajiVariantPatterns = romajiVariantOptions
  .filter(
    (option) =>
      option.id !== "syllabicN" &&
      option.id !== "syllabicNBeforeVowel" &&
      option.id !== "syllabicNBeforeNaRow",
  )
  .flatMap((option) =>
    option.alternatives.map((pattern) => ({
      pattern,
      option,
    })),
  )
  .sort((left, right) => right.pattern.length - left.pattern.length);

const splitYoonPatterns = [
  { pattern: "kya", splitPrefix: "ki" },
  { pattern: "kyu", splitPrefix: "ki" },
  { pattern: "kyo", splitPrefix: "ki" },
  { pattern: "gya", splitPrefix: "gi" },
  { pattern: "gyu", splitPrefix: "gi" },
  { pattern: "gyo", splitPrefix: "gi" },
  { pattern: "nya", splitPrefix: "ni" },
  { pattern: "nyu", splitPrefix: "ni" },
  { pattern: "nyo", splitPrefix: "ni" },
  { pattern: "hya", splitPrefix: "hi" },
  { pattern: "hyu", splitPrefix: "hi" },
  { pattern: "hyo", splitPrefix: "hi" },
  { pattern: "bya", splitPrefix: "bi" },
  { pattern: "byu", splitPrefix: "bi" },
  { pattern: "byo", splitPrefix: "bi" },
  { pattern: "pya", splitPrefix: "pi" },
  { pattern: "pyu", splitPrefix: "pi" },
  { pattern: "pyo", splitPrefix: "pi" },
  { pattern: "mya", splitPrefix: "mi" },
  { pattern: "myu", splitPrefix: "mi" },
  { pattern: "myo", splitPrefix: "mi" },
  { pattern: "rya", splitPrefix: "ri" },
  { pattern: "ryu", splitPrefix: "ri" },
  { pattern: "ryo", splitPrefix: "ri" },
].map(({ pattern, splitPrefix }) => ({
  pattern,
  splitAlternatives: [`${splitPrefix}l${pattern.at(-1)}`, `${splitPrefix}x${pattern.at(-1)}`],
}));

export function createRomajiInputTarget(guide: string, config: RomajiInputConfig) {
  const parts: RomajiGuidePart[] = [];
  const tokens: RomajiInputToken[] = [];
  const source = guide.toLowerCase();
  let index = 0;

  while (index < source.length) {
    const character = source[index] ?? "";

    if (/\s/.test(character)) {
      parts.push({ kind: "visual", text: character });
      index += 1;
      continue;
    }

    const sokuon = readSokuon(source, index, config);
    if (sokuon) {
      pushRomajiToken(parts, tokens, sokuon);
      index += sokuon.consumed;
      continue;
    }

    const syllabicN = readSyllabicN(source, index, config);
    if (syllabicN) {
      pushRomajiToken(parts, tokens, syllabicN);
      index += syllabicN.consumed;
      continue;
    }

    const splitYoon = readSplitYoon(source, index, config);
    if (splitYoon) {
      pushRomajiToken(parts, tokens, splitYoon);
      index += splitYoon.consumed;
      continue;
    }

    const variant = readVariant(source, index, config);
    if (variant) {
      pushRomajiToken(parts, tokens, variant);
      index += variant.consumed;
      continue;
    }

    pushRomajiToken(parts, tokens, {
      accepted: [character],
      consumed: 1,
      preferred: character,
    });
    index += 1;
  }

  return {
    guide: parts.map((part) => part.text).join(""),
    parts,
    tokens,
  } satisfies RomajiInputTarget;
}

export function getRomajiInputProgress(target: RomajiInputTarget, input: string) {
  type ActiveState = {
    tokenIndex: number;
    option: string | null;
    offset: number;
    selectedOptions: string[];
  };

  let states: ActiveState[] = [{ tokenIndex: 0, option: null, offset: 0, selectedOptions: [] }];

  for (const character of input) {
    const nextStates: ActiveState[] = [];

    for (const state of states) {
      if (state.option) {
        if (state.option[state.offset] === character) {
          const nextOffset = state.offset + 1;
          const selectedOptions =
            nextOffset >= state.option.length
              ? selectRomajiOption(state.selectedOptions, state.tokenIndex, state.option)
              : state.selectedOptions;
          nextStates.push(
            nextOffset >= state.option.length
              ? {
                  tokenIndex: state.tokenIndex + 1,
                  option: null,
                  offset: 0,
                  selectedOptions,
                }
              : { ...state, offset: nextOffset, selectedOptions },
          );
        }
        continue;
      }

      const token = target.tokens[state.tokenIndex];
      if (!token) {
        continue;
      }

      for (const option of token.accepted) {
        if (option[0] !== character) {
          continue;
        }

        nextStates.push(
          option.length === 1
            ? {
                tokenIndex: state.tokenIndex + 1,
                option: null,
                offset: 0,
                selectedOptions: selectRomajiOption(
                  state.selectedOptions,
                  state.tokenIndex,
                  option,
                ),
              }
            : { tokenIndex: state.tokenIndex, option, offset: 1, selectedOptions: state.selectedOptions },
        );
      }
    }

    states = dedupeRomajiStates(nextStates);
    if (states.length === 0) {
      return {
        accepted: false,
        completed: false,
        completedTokens: 0,
        selectedOptions: [],
        currentOption: null,
        currentOptionOffset: 0,
        currentTokenIndex: 0,
      };
    }
  }

  const bestState = selectBestRomajiState(states);

  return {
    accepted: true,
    completed: states.some(
      (state) => state.option === null && state.tokenIndex >= target.tokens.length,
    ),
    completedTokens: bestState.tokenIndex,
    selectedOptions: bestState.selectedOptions,
    currentOption: bestState.option,
    currentOptionOffset: bestState.option ? bestState.offset : 0,
    currentTokenIndex: bestState.tokenIndex,
  };
}

export function getRomajiGuideDisplay(target: RomajiInputTarget, input: string) {
  const progress = getRomajiInputProgress(target, input);

  return target.parts
    .map((part) => {
      if (part.kind === "visual") {
        return part.text;
      }

      if (progress.currentTokenIndex === part.tokenIndex && progress.currentOption) {
        return progress.currentOption;
      }

      return progress.selectedOptions[part.tokenIndex] ?? part.text;
    })
    .join("");
}

export function isDirectKeyCorrect({
  state,
  key,
  target,
}: DirectKeyCorrectnessInput) {
  if (key.length !== 1) {
    return false;
  }

  const nextInput = state.input + key;
  const match =
    typeof target === "string"
      ? {
          accepted: key === (target[state.input.length] ?? ""),
        }
      : getRomajiInputProgress(target, nextInput);

  return match.accepted;
}

export function applyDirectKey({
  state,
  key,
  target,
  lockMistakes,
}: DirectKeyInput): DirectKeyResult {
  if (key === "Backspace") {
    if (lockMistakes && state.mistakeDebt > 0) {
      return {
        state: {
          ...state,
          mistakeDebt: state.mistakeDebt - 1,
        },
        scoredKeystrokes: 0,
      };
    }

    return {
      state: {
        ...state,
        input: state.input.slice(0, -1),
      },
      scoredKeystrokes: 0,
    };
  }

  if (key.length !== 1) {
    return { state, scoredKeystrokes: 0 };
  }

  if (lockMistakes && state.mistakeDebt > 0) {
    return {
      state: {
        ...state,
        mistakeDebt: state.mistakeDebt + 1,
        characterAttempts: state.characterAttempts + 1,
        mistakes: state.mistakes + 1,
      },
      scoredKeystrokes: 0,
    };
  }

  const nextInput = state.input + key;
  const match =
    typeof target === "string"
      ? {
          accepted: key === (target[state.input.length] ?? ""),
          completed: nextInput.length >= target.length,
        }
      : getRomajiInputProgress(target, nextInput);
  const isCorrect = match.accepted;

  if (!isCorrect) {
    return {
      state: {
        ...state,
        mistakeDebt: lockMistakes ? state.mistakeDebt + 1 : state.mistakeDebt,
        characterAttempts: state.characterAttempts + 1,
        mistakes: state.mistakes + 1,
      },
      scoredKeystrokes: 0,
    };
  }

  const completed = match.completed;
  const scoredKeystrokes = nextInput.length > state.scoredInputLength ? 1 : 0;

  return {
    state: {
      ...state,
      input: completed ? "" : nextInput,
      scoredInputLength: completed
        ? 0
        : Math.max(state.scoredInputLength, nextInput.length),
      characterAttempts: state.characterAttempts + 1,
      correctCharacters: state.correctCharacters + 1,
      completedPrompts: completed ? state.completedPrompts + 1 : state.completedPrompts,
    },
    scoredKeystrokes,
  };
}

type ReadRomajiTokenResult = RomajiInputToken & {
  consumed: number;
};

function readSyllabicN(
  source: string,
  index: number,
  config: RomajiInputConfig,
): ReadRomajiTokenResult | null {
  if (source[index] !== "n") {
    return null;
  }

  if (source[index + 1] === "'") {
    const variantId = source[index + 2] === "n" ? "syllabicNBeforeNaRow" : "syllabicNBeforeVowel";

    return {
      ...resolveRomajiSelection(
        romajiVariantOptions.find((option) => option.id === variantId)!,
        config,
      ),
      consumed: 2,
    };
  }

  if (!isSyllabicNContext(source, index)) {
    return null;
  }

  return {
    ...resolveRomajiSelection(
      romajiVariantOptions.find((option) => option.id === "syllabicN")!,
      config,
    ),
    consumed: 1,
  };
}

function readVariant(
  source: string,
  index: number,
  config: RomajiInputConfig,
): ReadRomajiTokenResult | null {
  const match = romajiVariantPatterns.find(({ pattern }) => source.startsWith(pattern, index));
  if (!match) {
    return null;
  }

  return {
    ...resolveRomajiSelection(match.option, config),
    consumed: match.pattern.length,
  };
}

function readSokuon(
  source: string,
  index: number,
  config: RomajiInputConfig,
): ReadRomajiTokenResult | null {
  if (source[index] !== sokuonSourceMarker) {
    return null;
  }

  const selection = resolveSokuonSelection(config);
  const geminatePrefixes = getSokuonGeminatePrefixes(source, index + 1, config);
  const accepted =
    geminatePrefixes.length > 0
      ? selection.allowSplit
        ? uniqueStrings([...geminatePrefixes, ...selection.accepted])
        : geminatePrefixes
      : selection.accepted;

  return {
    accepted,
    consumed: 1,
    preferred: geminatePrefixes[0] ?? selection.preferred,
  };
}

function getSokuonGeminatePrefixes(
  source: string,
  index: number,
  config: RomajiInputConfig,
): string[] {
  const next = source[index] ?? "";
  if (next === "" || next === "n" || !/[a-z]/.test(next)) {
    return [];
  }

  const nextToken =
    readVariant(source, index, config) ?? readSplitYoon(source, index, config);
  const candidates = nextToken?.accepted ?? [next];

  return uniqueStrings(
    candidates
      .map((candidate) => candidate[0] ?? "")
      .filter((candidate) => candidate !== "" && candidate !== "n" && /[a-z]/.test(candidate)),
  );
}

function readSplitYoon(
  source: string,
  index: number,
  config: RomajiInputConfig,
): ReadRomajiTokenResult | null {
  const match = splitYoonPatterns.find(({ pattern }) => source.startsWith(pattern, index));
  if (!match) {
    return null;
  }

  return {
    accepted:
      config.allowSplitYoon === false
        ? [match.pattern]
        : [match.pattern, ...match.splitAlternatives],
    consumed: match.pattern.length,
    preferred: match.pattern,
  };
}

function resolveSokuonSelection(config: RomajiInputConfig): SokuonInputSelection {
  const validOptions = new Set<SokuonInputId>(sokuonInputOptions);
  const configuredAccepted =
    config.sokuon?.accepted.filter((candidate) => validOptions.has(candidate)) ?? [];
  const accepted = configuredAccepted.length > 0
    ? configuredAccepted
    : defaultSokuonInputSelection.accepted;
  const preferred =
    config.sokuon?.preferred && accepted.includes(config.sokuon.preferred)
      ? config.sokuon.preferred
      : accepted.includes(defaultSokuonInputSelection.preferred)
        ? defaultSokuonInputSelection.preferred
        : accepted[0]!;

  return {
    allowSplit: config.sokuon?.allowSplit ?? defaultSokuonInputSelection.allowSplit,
    accepted,
    preferred,
  };
}

function resolveRomajiSelection(
  option: RomajiVariantOption,
  config: RomajiInputConfig,
): RomajiInputToken {
  const presetPreferred = config.preset === "shortest" ? option.shortest : option.hepburn;
  const selection = config.preset === "custom" ? config.selections[option.id] : undefined;
  const validAccepted = new Set(option.alternatives);
  const accepted = (selection?.accepted.length ? selection.accepted : option.alternatives).filter(
    (candidate) => validAccepted.has(candidate),
  );
  const preferred = validAccepted.has(selection?.preferred ?? "")
    ? (selection?.preferred ?? presetPreferred)
    : presetPreferred;
  const acceptedWithPreferred = accepted.includes(preferred)
    ? accepted
    : [...accepted, preferred].filter((candidate) => validAccepted.has(candidate));

  return {
    accepted: acceptedWithPreferred.length > 0 ? acceptedWithPreferred : option.alternatives,
    preferred: acceptedWithPreferred.includes(preferred)
      ? preferred
      : (acceptedWithPreferred[0] ?? option.alternatives[0] ?? ""),
    variantId: option.id,
  };
}

function pushRomajiToken(
  parts: RomajiGuidePart[],
  tokens: RomajiInputToken[],
  token: ReadRomajiTokenResult,
) {
  const tokenIndex = tokens.length;
  tokens.push({
    accepted: token.accepted,
    preferred: token.preferred,
    variantId: token.variantId,
  });
  parts.push({
    kind: "input",
    text: token.preferred,
    tokenIndex,
    variantId: token.variantId,
  });
}

function isSyllabicNContext(source: string, index: number) {
  const next = source[index + 1] ?? "";
  return next === "" || !/[a-z]/.test(next) || !["a", "i", "u", "e", "o", "y"].includes(next);
}

function selectRomajiOption(options: string[], tokenIndex: number, option: string) {
  const next = [...options];
  next[tokenIndex] = option;
  return next;
}

function selectBestRomajiState<
  T extends { tokenIndex: number; option: string | null; offset: number },
>(states: T[]) {
  return states.reduce((best, state) => {
    if (state.tokenIndex !== best.tokenIndex) {
      return state.tokenIndex > best.tokenIndex ? state : best;
    }

    return state.offset > best.offset ? state : best;
  }, states[0]!);
}

function dedupeRomajiStates<
  T extends {
    tokenIndex: number;
    option: string | null;
    offset: number;
    selectedOptions: string[];
  },
>(states: T[]) {
  const seen = new Set<string>();
  return states.filter((state) => {
    const key = `${state.tokenIndex}:${state.option ?? ""}:${state.offset}:${state.selectedOptions.join("\u0000")}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function uniqueStrings<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values));
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

export type RankProgressionItem = Rank & {
  requiredScore: number;
};

const noRank: Rank = {
  label: "NR",
  colorName: "なし",
  level: -1,
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
  { prefix: "M", count: 20, colorName: "紫", start: 0 },
  { prefix: "M", count: 20, colorName: "黒紫", start: 20 },
  { prefix: "M", count: 20, colorName: "黒", start: 40 },
] as const;

const ranks: Rank[] = rankBands.flatMap((band) =>
  Array.from({ length: band.count }, (_, index) => ({
    label: `${band.prefix}${("start" in band ? band.start : 0) + index}`,
    colorName: band.colorName,
    level: 0,
  })),
);

ranks.forEach((rank, index) => {
  rank.level = index;
});

export const a0RankLevel = ranks.find((rank) => rank.label === "A0")?.level ?? 42;

export function getRankRequiredScore(level: number): number {
  return 500 + Math.max(0, level) * 90;
}

export function getRankProgression(): RankProgressionItem[] {
  return [...ranks, createUltimateRank(0)].map((rank) => ({
    ...rank,
    requiredScore: getRankRequiredScore(rank.level),
  }));
}

export function getRank(score: number): Rank {
  if (score < 500) {
    return noRank;
  }

  const level = Math.floor((score - 500) / 90);
  return ranks[level] ?? createUltimateRank(level - ranks.length);
}

function createUltimateRank(index: number): Rank {
  return {
    label: `UM${Math.max(0, index)}`,
    colorName: "虹",
    level: ranks.length + Math.max(0, index),
  };
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

export function countCorrectDirectCharacters(
  input: string,
  target: string | RomajiInputTarget,
): number {
  if (typeof target === "string") {
    return countCorrectAtSamePositions(input, target);
  }

  return getRomajiInputProgress(target, input).accepted ? input.length : 0;
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
  const perfectToleranceMs = 24 + average * 0.1;
  const unstableThresholdMs = 70 + average * 0.3;

  if (standardDeviation <= perfectToleranceMs) {
    return 1;
  }

  const instability =
    (standardDeviation - perfectToleranceMs) / (unstableThresholdMs - perfectToleranceMs);

  return 1 - smoothstep(clamp(instability, 0, 1));
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
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
