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
    description: "時間を決めて行う本番測定。変換なしで長文を連続処理する。",
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
  scoreDurationSeconds?: number;
  keystrokes: number;
  kanaCharacters: number;
  promptCharacters: number;
  characterAttempts: number;
  correctCharacters: number;
  mistakes: number;
  intervals: number[];
  accuracyExponent: number;
  useFlowMultiplier?: boolean;
};

export type Metrics = {
  keysPerSecond: number;
  kanaCharactersPerSecond: number;
  promptCharactersPerSecond: number;
  accuracy: number;
  paceMs: number;
  consistency: number;
  score: number;
};

export type DirectTypingState = {
  input: string;
  scoredInputLength: number;
  mistakeDebt: number;
  mistakeInput?: string;
  characterAttempts: number;
  correctCharacters: number;
  mistakes: number;
  completedPrompts: number;
};

export type RomajiInputPreset = "custom" | "shortest" | "hepburn";
export type SpecialRomajiInputPreset = "split" | "integrated" | "custom";

export type StandardRomajiVariantId =
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

export type SpecialRomajiVariantId =
  | "ye"
  | "wha"
  | "wi"
  | "we"
  | "who"
  | "kwa"
  | "kwi"
  | "kwu"
  | "kwe"
  | "kwo"
  | "kye"
  | "kyi"
  | "gwa"
  | "gwi"
  | "gwe"
  | "gwo"
  | "she"
  | "je"
  | "che"
  | "swi"
  | "zwi"
  | "tsa"
  | "tsi"
  | "tse"
  | "tso"
  | "tha"
  | "thi"
  | "thu"
  | "the"
  | "tho"
  | "dha"
  | "dhi"
  | "dhu"
  | "dhe"
  | "dho"
  | "twu"
  | "dwu"
  | "fa"
  | "fi"
  | "fyu"
  | "fe"
  | "fo"
  | "va"
  | "vi"
  | "vyu"
  | "ve"
  | "vo";

export type RomajiVariantId = StandardRomajiVariantId | SpecialRomajiVariantId;

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
  selections: Partial<Record<StandardRomajiVariantId, RomajiVariantSelection>>;
  allowSplitYoon?: boolean;
  allowSplitSpecialYoon?: boolean;
  specialPreset?: SpecialRomajiInputPreset;
  specialSelections?: Partial<Record<SpecialRomajiVariantId, RomajiVariantSelection>>;
  sokuon?: SokuonInputSelection;
};

export type RomajiVariantOption = {
  id: RomajiVariantId;
  label: string;
  alternatives: string[];
  shortest: string;
  hepburn: string;
};

type StandardRomajiVariantOption = RomajiVariantOption & {
  id: StandardRomajiVariantId;
};

type SpecialRomajiVariantOption = RomajiVariantOption & {
  id: SpecialRomajiVariantId;
  integratedAlternatives: string[];
  pattern: string;
  splitAlternatives: string[];
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

export const standardRomajiVariantOptions: StandardRomajiVariantOption[] = [
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

export const specialRomajiVariantOptions: SpecialRomajiVariantOption[] = [
  createSpecialRomajiVariantOption({ id: "ye", label: "いぇ", integrated: ["ye"], splitPrefix: "i" }),
  createSpecialRomajiVariantOption({ id: "wha", label: "うぁ", integrated: ["wha"], splitPrefix: "u", splitSuffix: "a" }),
  createSpecialRomajiVariantOption({ id: "wi", label: "うぃ", integrated: ["wi", "whi"], splitPrefix: "u" }),
  createSpecialRomajiVariantOption({ id: "we", label: "うぇ", integrated: ["we", "whe"], splitPrefix: "u" }),
  createSpecialRomajiVariantOption({ id: "who", label: "うぉ", integrated: ["who", "wo"], splitPrefix: "u", splitSuffix: "o" }),
  createSpecialRomajiVariantOption({ id: "kyi", label: "きぃ", integrated: ["kyi"], splitPrefix: "ki" }),
  createSpecialRomajiVariantOption({ id: "kye", label: "きぇ", integrated: ["kye"], splitPrefix: "ki" }),
  createSpecialRomajiVariantOption({ id: "kwa", label: "くぁ", integrated: ["kwa"], splitPrefix: "ku", splitSuffix: "a" }),
  createSpecialRomajiVariantOption({ id: "kwi", label: "くぃ", integrated: ["kwi"], splitPrefix: "ku" }),
  createSpecialRomajiVariantOption({ id: "kwu", label: "くぅ", integrated: ["kwu"], splitPrefix: "ku" }),
  createSpecialRomajiVariantOption({ id: "kwe", label: "くぇ", integrated: ["kwe"], splitPrefix: "ku" }),
  createSpecialRomajiVariantOption({ id: "kwo", label: "くぉ", integrated: ["kwo"], splitPrefix: "ku", splitSuffix: "o" }),
  createSpecialRomajiVariantOption({ id: "gwa", label: "ぐぁ", integrated: ["gwa"], splitPrefix: "gu", splitSuffix: "a" }),
  createSpecialRomajiVariantOption({ id: "gwi", label: "ぐぃ", integrated: ["gwi"], splitPrefix: "gu" }),
  createSpecialRomajiVariantOption({ id: "gwe", label: "ぐぇ", integrated: ["gwe"], splitPrefix: "gu" }),
  createSpecialRomajiVariantOption({ id: "gwo", label: "ぐぉ", integrated: ["gwo"], splitPrefix: "gu", splitSuffix: "o" }),
  createSpecialRomajiVariantOption({ id: "she", label: "しぇ", integrated: ["she", "sye"], splitPrefix: "shi" }),
  createSpecialRomajiVariantOption({ id: "swi", label: "すぃ", integrated: ["swi"], splitPrefix: "su" }),
  createSpecialRomajiVariantOption({ id: "je", label: "じぇ", integrated: ["je", "jye", "zye"], splitPrefix: "ji" }),
  createSpecialRomajiVariantOption({ id: "zwi", label: "ずぃ", integrated: ["zwi"], splitPrefix: "zu" }),
  createSpecialRomajiVariantOption({ id: "che", label: "ちぇ", integrated: ["che", "tye", "cye"], splitPrefix: "chi" }),
  createSpecialRomajiVariantOption({ id: "tsa", label: "つぁ", integrated: ["tsa"], splitPrefix: "tsu", splitSuffix: "a" }),
  createSpecialRomajiVariantOption({ id: "tsi", label: "つぃ", integrated: ["tsi"], splitPrefix: "tsu" }),
  createSpecialRomajiVariantOption({ id: "tse", label: "つぇ", integrated: ["tse"], splitPrefix: "tsu" }),
  createSpecialRomajiVariantOption({ id: "tso", label: "つぉ", integrated: ["tso"], splitPrefix: "tsu", splitSuffix: "o" }),
  createSpecialRomajiVariantOption({ id: "tha", label: "てぁ", integrated: ["tha"], splitPrefix: "te", splitSuffix: "a" }),
  createSpecialRomajiVariantOption({ id: "thi", label: "てぃ", integrated: ["thi"], splitPrefix: "te" }),
  createSpecialRomajiVariantOption({ id: "thu", label: "てゅ", integrated: ["thu"], splitPrefix: "te", splitSuffix: "yu" }),
  createSpecialRomajiVariantOption({ id: "the", label: "てぇ", integrated: ["the"], splitPrefix: "te" }),
  createSpecialRomajiVariantOption({ id: "tho", label: "てょ", integrated: ["tho"], splitPrefix: "te", splitSuffix: "yo" }),
  createSpecialRomajiVariantOption({ id: "twu", label: "とぅ", integrated: ["twu"], splitPrefix: "to" }),
  createSpecialRomajiVariantOption({ id: "dha", label: "でぁ", integrated: ["dha"], splitPrefix: "de", splitSuffix: "a" }),
  createSpecialRomajiVariantOption({ id: "dhi", label: "でぃ", integrated: ["dhi", "di"], splitPrefix: "de" }),
  createSpecialRomajiVariantOption({ id: "dhu", label: "でゅ", integrated: ["dhu", "dyu"], splitPrefix: "de", splitSuffix: "yu" }),
  createSpecialRomajiVariantOption({ id: "dhe", label: "でぇ", integrated: ["dhe"], splitPrefix: "de" }),
  createSpecialRomajiVariantOption({ id: "dho", label: "でょ", integrated: ["dho"], splitPrefix: "de", splitSuffix: "yo" }),
  createSpecialRomajiVariantOption({ id: "dwu", label: "どぅ", integrated: ["dwu"], splitPrefix: "do" }),
  createSpecialRomajiVariantOption({ id: "fa", label: "ふぁ", integrated: ["fa"], splitPrefix: "fu", splitSuffix: "a" }),
  createSpecialRomajiVariantOption({ id: "fi", label: "ふぃ", integrated: ["fi"], splitPrefix: "fu" }),
  createSpecialRomajiVariantOption({ id: "fyu", label: "ふゅ", integrated: ["fyu"], splitPrefix: "fu", splitSuffix: "yu" }),
  createSpecialRomajiVariantOption({ id: "fe", label: "ふぇ", integrated: ["fe"], splitPrefix: "fu" }),
  createSpecialRomajiVariantOption({ id: "fo", label: "ふぉ", integrated: ["fo"], splitPrefix: "fu", splitSuffix: "o" }),
  createSpecialRomajiVariantOption({ id: "va", label: "ゔぁ", integrated: ["va"], splitPrefix: "vu", splitSuffix: "a" }),
  createSpecialRomajiVariantOption({ id: "vi", label: "ゔぃ", integrated: ["vi"], splitPrefix: "vu" }),
  createSpecialRomajiVariantOption({ id: "vyu", label: "ゔゅ", integrated: ["vyu"], splitPrefix: "vu", splitSuffix: "yu" }),
  createSpecialRomajiVariantOption({ id: "ve", label: "ゔぇ", integrated: ["ve"], splitPrefix: "vu" }),
  createSpecialRomajiVariantOption({ id: "vo", label: "ゔぉ", integrated: ["vo"], splitPrefix: "vu", splitSuffix: "o" }),
];

export const romajiVariantOptions: RomajiVariantOption[] = [
  ...standardRomajiVariantOptions,
  ...specialRomajiVariantOptions,
];

function createSpecialRomajiVariantOption({
  id,
  integrated,
  label,
  splitPrefix,
  splitSuffix,
}: {
  id: SpecialRomajiVariantId;
  integrated: string[];
  label: string;
  splitPrefix: string;
  splitSuffix?: string;
}): SpecialRomajiVariantOption {
  const hepburn = integrated[0] ?? "";
  const suffix = splitSuffix ?? hepburn.at(-1) ?? "";
  const splitAlternatives = [`${splitPrefix}l${suffix}`, `${splitPrefix}x${suffix}`];

  return {
    id,
    alternatives: uniqueStrings([...integrated, ...splitAlternatives]),
    hepburn,
    integratedAlternatives: integrated,
    label,
    pattern: hepburn,
    shortest: integrated.at(-1) ?? hepburn,
    splitAlternatives,
  };
}

export const sokuonInputOptions = ["ltsu", "xtsu", "ltu", "xtu"] as const satisfies readonly SokuonInputId[];

const sokuonSourceMarker = "^";

const defaultSokuonInputSelection: SokuonInputSelection = {
  allowSplit: true,
  accepted: [...sokuonInputOptions],
  preferred: "xtu",
};

const romajiVariantPatterns = standardRomajiVariantOptions
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

const specialRomajiVariantPatterns = specialRomajiVariantOptions
  .map((option) => ({
    pattern: option.pattern,
    option,
  }))
  .sort((left, right) => right.pattern.length - left.pattern.length);

const standardSplitYoonPatterns = [
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

export function countShortestRomajiKeystrokes(source: string) {
  const target = createRomajiInputTarget(source, {
    allowSplitYoon: true,
    allowSplitSpecialYoon: true,
    preset: "shortest",
    selections: {},
    specialPreset: "integrated",
    specialSelections: {},
  });

  return target.tokens.reduce((sum, token) => sum + token.preferred.length, 0);
}

export function countPreferredRomajiProgressKeystrokes(
  target: RomajiInputTarget,
  shortestTarget: RomajiInputTarget,
  input: string,
) {
  const progress = getRomajiInputProgress(target, input);
  if (!progress.accepted) {
    return 0;
  }

  const completedKeystrokes = shortestTarget.tokens
    .slice(0, progress.completedTokens)
    .reduce((sum, token) => sum + token.preferred.length, 0);
  const currentToken = shortestTarget.tokens[progress.currentTokenIndex];
  const currentKeystrokes =
    progress.currentOption && currentToken
      ? Math.min(progress.currentOptionOffset, currentToken.preferred.length)
      : 0;

  return completedKeystrokes + currentKeystrokes;
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
  const mistakeInput = state.mistakeInput ?? "";

  if (key === "Backspace") {
    if (lockMistakes && state.mistakeDebt > 0) {
      return {
        state: {
          ...state,
          mistakeDebt: state.mistakeDebt - 1,
          mistakeInput: mistakeInput.slice(0, -1),
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
        mistakeInput: mistakeInput + key,
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
        mistakeInput: lockMistakes ? mistakeInput + key : mistakeInput,
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
        standardRomajiVariantOptions.find((option) => option.id === variantId)!,
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
      standardRomajiVariantOptions.find((option) => option.id === "syllabicN")!,
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
  const standardMatch = standardSplitYoonPatterns.find(({ pattern }) =>
    source.startsWith(pattern, index),
  );
  if (standardMatch) {
    return {
      accepted:
        config.allowSplitYoon === false
          ? [standardMatch.pattern]
          : [standardMatch.pattern, ...standardMatch.splitAlternatives],
      consumed: standardMatch.pattern.length,
      preferred: standardMatch.pattern,
    };
  }

  const specialMatch = specialRomajiVariantPatterns.find(({ pattern }) =>
    source.startsWith(pattern, index),
  );
  if (specialMatch) {
    const selection = resolveSpecialRomajiSelection(specialMatch.option, config);

    return {
      accepted: selection.accepted,
      consumed: specialMatch.pattern.length,
      preferred: selection.preferred,
      variantId: selection.variantId,
    };
  }

  return null;
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
  option: StandardRomajiVariantOption,
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

function resolveSpecialRomajiSelection(
  option: SpecialRomajiVariantOption,
  config: RomajiInputConfig,
): RomajiInputToken {
  if (config.specialPreset === "split") {
    return {
      accepted: option.splitAlternatives,
      preferred: option.splitAlternatives.at(-1) ?? option.splitAlternatives[0] ?? option.hepburn,
      variantId: option.id,
    };
  }

  if (config.specialPreset === "custom") {
    return resolveCustomSpecialRomajiSelection(option, config.specialSelections?.[option.id]);
  }

  if (config.specialPreset === "integrated") {
    return {
      accepted: option.integratedAlternatives,
      preferred: option.hepburn,
      variantId: option.id,
    };
  }

  return {
    accepted:
      config.allowSplitSpecialYoon === true
        ? uniqueStrings([...option.integratedAlternatives, ...option.splitAlternatives])
        : option.integratedAlternatives,
    preferred: option.hepburn,
    variantId: option.id,
  };
}

function resolveCustomSpecialRomajiSelection(
  option: SpecialRomajiVariantOption,
  selection: RomajiVariantSelection | undefined,
): RomajiInputToken {
  const validAccepted = new Set(option.alternatives);
  const accepted = (selection?.accepted.length ? selection.accepted : option.integratedAlternatives).filter(
    (candidate) => validAccepted.has(candidate),
  );
  const preferred = validAccepted.has(selection?.preferred ?? "")
    ? (selection?.preferred ?? option.hepburn)
    : (accepted[0] ?? option.hepburn);
  const acceptedWithPreferred = accepted.includes(preferred)
    ? accepted
    : [...accepted, preferred].filter((candidate) => validAccepted.has(candidate));

  return {
    accepted: acceptedWithPreferred.length > 0 ? acceptedWithPreferred : option.integratedAlternatives,
    preferred: acceptedWithPreferred.includes(preferred)
      ? preferred
      : (acceptedWithPreferred[0] ?? option.hepburn),
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
  const kanaCharactersPerSecond = input.kanaCharacters / elapsed;
  const promptCharactersPerSecond = input.promptCharacters / elapsed;
  const scoreElapsed = Math.max(input.scoreDurationSeconds ?? input.elapsedSeconds, 0.001);
  const scoreKeysPerSecond = input.keystrokes / scoreElapsed;
  const accuracy =
    input.characterAttempts === 0
      ? 1
      : clamp(input.correctCharacters / input.characterAttempts, 0, 1);
  const paceMs = calculateAverage(input.intervals);
  const consistency = calculateConsistency(input.intervals);
  const flowMultiplier = input.useFlowMultiplier ? consistency : 1;
  const score =
    scoreKeysPerSecond * 1000 * Math.pow(accuracy, input.accuracyExponent) * flowMultiplier;

  return {
    keysPerSecond,
    kanaCharactersPerSecond,
    promptCharactersPerSecond,
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

export type ImeProductionScoreOptions = {
  forceComplete?: boolean;
  requireTrailingNewline?: boolean;
};

export type ImeProductionScore = {
  completedTargetLength: number;
  correctCharacters: number;
  inputLength: number;
  isComplete: boolean;
  mistakes: number;
  targetLength: number;
};

type ImeProductionScoreCell = {
  cost: number;
  correct: number;
};

function getBetterImeProductionScoreCell(
  current: ImeProductionScoreCell | null,
  candidate: ImeProductionScoreCell,
) {
  if (current === null || candidate.cost < current.cost) {
    return candidate;
  }

  return current;
}

function getMinimumImeProductionPrefixLength(inputCharacters: string[], targetCharacters: string[]) {
  let searchStartIndex = 0;
  let minimumPrefixLength = 0;

  for (const inputCharacter of inputCharacters) {
    const targetIndex = targetCharacters.indexOf(inputCharacter, searchStartIndex);
    if (targetIndex === -1) {
      continue;
    }

    searchStartIndex = targetIndex + 1;
    minimumPrefixLength = searchStartIndex;
  }

  return minimumPrefixLength;
}

function normalizeImeProductionPunctuationCharacter(character: string) {
  switch (character) {
    case ",":
    case "、":
      return "、";
    case ".":
    case "。":
      return "。";
    default:
      return character;
  }
}

function normalizeImeProductionPunctuationCharacters(characters: string[]) {
  return characters.map((character) => normalizeImeProductionPunctuationCharacter(character));
}

function countMixedImeProductionPunctuationMistake(characters: string[]) {
  let hasJapanesePunctuation = false;
  let hasWesternPunctuation = false;

  for (const character of characters) {
    if (character === "、" || character === "。") {
      hasJapanesePunctuation = true;
    } else if (character === "," || character === ".") {
      hasWesternPunctuation = true;
    }
  }

  return hasJapanesePunctuation && hasWesternPunctuation ? 1 : 0;
}

export function scoreImeProductionInput(
  input: string,
  target: string,
  options: ImeProductionScoreOptions = {},
): ImeProductionScore {
  const rawInputCharacters = Array.from(input);
  const rawTargetCharacters = Array.from(
    options.requireTrailingNewline && !target.endsWith("\n") ? `${target}\n` : target,
  );
  const inputCharacters = normalizeImeProductionPunctuationCharacters(rawInputCharacters);
  const targetCharacters = normalizeImeProductionPunctuationCharacters(rawTargetCharacters);
  const mixedPunctuationMistake =
    countMixedImeProductionPunctuationMistake(rawInputCharacters);
  const inputLength = inputCharacters.length;
  const targetLength = targetCharacters.length;
  const minimumPrefixLength = options.forceComplete
    ? targetLength
    : getMinimumImeProductionPrefixLength(inputCharacters, targetCharacters);

  const rows = inputLength + 1;
  const columns = targetLength + 1;
  const table: ImeProductionScoreCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => ({ cost: 0, correct: 0 })),
  );

  for (let inputIndex = 1; inputIndex <= inputLength; inputIndex += 1) {
    table[inputIndex][0] = { cost: inputIndex, correct: 0 };
  }

  for (let targetIndex = 1; targetIndex <= targetLength; targetIndex += 1) {
    table[0][targetIndex] = { cost: targetIndex, correct: 0 };
  }

  for (let inputIndex = 1; inputIndex <= inputLength; inputIndex += 1) {
    for (let targetIndex = 1; targetIndex <= targetLength; targetIndex += 1) {
      const charactersMatch =
        inputCharacters[inputIndex - 1] === targetCharacters[targetIndex - 1];
      let bestCell = getBetterImeProductionScoreCell(null, {
        cost: table[inputIndex - 1][targetIndex - 1].cost + (charactersMatch ? 0 : 1),
        correct: table[inputIndex - 1][targetIndex - 1].correct + (charactersMatch ? 1 : 0),
      });
      bestCell = getBetterImeProductionScoreCell(bestCell, {
        cost: table[inputIndex - 1][targetIndex].cost + 1,
        correct: table[inputIndex - 1][targetIndex].correct,
      });
      bestCell = getBetterImeProductionScoreCell(bestCell, {
        cost: table[inputIndex][targetIndex - 1].cost + 1,
        correct: table[inputIndex][targetIndex - 1].correct,
      });
      table[inputIndex][targetIndex] = bestCell;
    }
  }

  let completedTargetLength = minimumPrefixLength;
  let bestResult = table[inputLength][completedTargetLength];

  if (!options.forceComplete) {
    for (
      let targetIndex = minimumPrefixLength + 1;
      targetIndex <= targetLength;
      targetIndex += 1
    ) {
      const candidate = table[inputLength][targetIndex];
      if (candidate.cost < bestResult.cost) {
        completedTargetLength = targetIndex;
        bestResult = candidate;
      }
    }
  }

  return {
    completedTargetLength,
    correctCharacters: bestResult.correct,
    inputLength,
    isComplete: completedTargetLength === targetLength,
    mistakes: bestResult.cost + mixedPunctuationMistake,
    targetLength,
  };
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
