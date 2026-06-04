import englishProductionText from "./challenge-data/en-production.txt" with { type: "text" };
import englishPracticeText from "./challenge-data/en-practice.txt" with { type: "text" };
import japaneseProductionText from "./challenge-data/ja-production.txt" with { type: "text" };
import japanesePracticeText from "./challenge-data/ja-practice.txt" with { type: "text" };
import { createRomajiInputTarget } from "./typing";

export type DirectChallenge = {
  display: string;
  furigana?: JapaneseFuriganaEntry[];
  guide?: string;
  input: string;
  reading?: string;
  romajiSource?: string;
};

export type JapaneseChallengeSource = {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  reading: string;
};

export type JapaneseReadingGuidePart =
  | {
      kind: "visual";
      text: string;
    }
  | {
      kind: "reading";
      text: string;
      tokenStart: number;
      tokenEnd: number;
    };

export type JapaneseFuriganaPart = {
  text: string;
  ruby?: string;
};

export type JapaneseFuriganaEntry = {
  text: string;
  ruby: string;
};

export function parseEnglishChallengeText(source: string): string[] {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parseJapaneseChallengeText(source: string): JapaneseChallengeSource[] {
  return source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => parseAnnotatedJapaneseChallengeLine(line, index));
}

function parseAnnotatedJapaneseChallengeLine(
  line: string,
  lineIndex: number,
): JapaneseChallengeSource {
  const displayParts: string[] = [];
  const readingParts: string[] = [];
  const furigana: JapaneseFuriganaEntry[] = [];
  const characters = Array.from(line);

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index] ?? "";

    if (character === "\\") {
      const escaped = characters[index + 1];
      if (!escaped) {
        throw new Error(`Invalid Japanese challenge line ${lineIndex + 1}: dangling escape`);
      }
      displayParts.push(escaped);
      readingParts.push(normalizeKana(escaped));
      index += 1;
      continue;
    }

    if (character === "[") {
      const base = readAnnotatedValue(characters, index + 1, "]");
      const openParenIndex = base.nextIndex;
      if (characters[openParenIndex] !== "(") {
        throw new Error(
          `Invalid Japanese challenge line ${lineIndex + 1}: expected ruby text after annotation`,
        );
      }

      const ruby = readAnnotatedValue(characters, openParenIndex + 1, ")");
      if (!base.value || !ruby.value) {
        throw new Error(
          `Invalid Japanese challenge line ${lineIndex + 1}: annotation text and ruby are required`,
        );
      }

      displayParts.push(base.value);
      readingParts.push(normalizeKana(ruby.value));
      furigana.push({ text: base.value, ruby: ruby.value });
      index = ruby.nextIndex - 1;
      continue;
    }

    if (character === "]" || character === "(" || character === ")") {
      throw new Error(
        `Invalid Japanese challenge line ${lineIndex + 1}: escape literal markdown characters`,
      );
    }

    if (containsKanji(character)) {
      throw new Error(
        `Invalid Japanese challenge line ${lineIndex + 1}: unannotated kanji requires ruby annotation`,
      );
    }

    displayParts.push(character);
    readingParts.push(normalizeKana(character));
  }

  return {
    display: displayParts.join(""),
    furigana,
    reading: readingParts.join(""),
  };
}

function readAnnotatedValue(characters: string[], startIndex: number, closingCharacter: string) {
  const value: string[] = [];

  for (let index = startIndex; index < characters.length; index += 1) {
    const character = characters[index] ?? "";

    if (character === "\\") {
      const escaped = characters[index + 1];
      if (!escaped) {
        throw new Error("Invalid Japanese challenge annotation: dangling escape");
      }
      value.push(escaped);
      index += 1;
      continue;
    }

    if (character === closingCharacter) {
      return {
        nextIndex: index + 1,
        value: value.join(""),
      };
    }

    value.push(character);
  }

  throw new Error("Invalid Japanese challenge annotation: unterminated annotation");
}

export function createJapaneseDirectChallenges(
  challenges: JapaneseChallengeSource[],
): DirectChallenge[] {
  return challenges.map(({ display, furigana, reading }) => {
    const romajiSource = kanaReadingToRomaji(reading);
    const guide = createVisibleRomajiGuide(romajiSource);

    return {
      display,
      furigana,
      guide,
      input: removeVisualSpaces(guide),
      reading,
      romajiSource,
    };
  });
}

const sokuonSourceMarker = "^";

function kanaReadingToRomaji(reading: string): string {
  return createJapaneseReadingSourceParts(reading)
    .map((part) => part.source)
    .join("");
}

export function createJapaneseReadingGuideParts(reading: string): JapaneseReadingGuidePart[] {
  let tokenIndex = 0;

  return createJapaneseReadingSourceParts(reading).map((part) => {
    if (part.kind === "visual") {
      return {
        kind: "visual",
        text: part.text,
      };
    }

    const tokenCount = countRomajiInputTokens(part.source);
    const guidePart = {
      kind: "reading",
      text: part.text,
      tokenStart: tokenIndex,
      tokenEnd: tokenIndex + tokenCount,
    } satisfies JapaneseReadingGuidePart;
    tokenIndex += tokenCount;
    return guidePart;
  });
}

export function createJapaneseFuriganaParts(
  display: string,
  furigana: JapaneseFuriganaEntry[],
): JapaneseFuriganaPart[] {
  const parts: JapaneseFuriganaPart[] = [];
  let plainText = "";
  let furiganaIndex = 0;
  const displayCharacters = Array.from(display);

  function flushPlainText() {
    if (!plainText) {
      return;
    }
    parts.push({ text: plainText });
    plainText = "";
  }

  for (let displayIndex = 0; displayIndex < displayCharacters.length; displayIndex += 1) {
    const entry = furigana[furiganaIndex];
    if (entry && matchesAt(displayCharacters, displayIndex, entry.text)) {
      flushPlainText();
      parts.push({ text: entry.text, ruby: entry.ruby });
      displayIndex += Array.from(entry.text).length - 1;
      furiganaIndex += 1;
      continue;
    }

    const character = displayCharacters[displayIndex] ?? "";
    if (!containsKanji(character)) {
      plainText += character;
      continue;
    }

    plainText += character;
  }

  flushPlainText();
  return parts;
}

function matchesAt(characters: string[], startIndex: number, value: string) {
  const valueCharacters = Array.from(value);
  return valueCharacters.every(
    (character, index) => characters[startIndex + index] === character,
  );
}

function containsKanji(value: string) {
  return /\p{Script=Han}/u.test(value);
}

function normalizeKana(value: string) {
  return Array.from(value)
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint >= 0x30a1 && codePoint <= 0x30f6
        ? String.fromCodePoint(codePoint - 0x60)
        : character;
    })
    .join("");
}

function mergeAdjacentPlainFuriganaParts(parts: JapaneseFuriganaPart[]) {
  return parts.reduce<JapaneseFuriganaPart[]>((merged, part) => {
    const previous = merged.at(-1);
    if (previous && !previous.ruby && !part.ruby) {
      previous.text += part.text;
      return merged;
    }

    merged.push({ ...part });
    return merged;
  }, []);
}

type JapaneseReadingSourcePart = {
  kind: "reading" | "visual";
  source: string;
  text: string;
};

function createJapaneseReadingSourceParts(reading: string): JapaneseReadingSourcePart[] {
  const characters = Array.from(reading);
  const parts: JapaneseReadingSourcePart[] = [];

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index] ?? "";
    const next = characters[index + 1] ?? "";
    const pair = `${character}${next}`;

    if (/\s/.test(character)) {
      parts.push({ kind: "visual", source: character, text: character });
      continue;
    }

    if (character === "っ") {
      parts.push({ kind: "reading", source: sokuonSourceMarker, text: character });
      continue;
    }

    const pairedRomaji = kanaRomaji[pair];
    if (pairedRomaji) {
      parts.push({ kind: "reading", source: pairedRomaji, text: pair });
      index += 1;
      continue;
    }

    if (character === "ん") {
      const nextRomaji = resolveKanaRomaji(findNextNonSpaceCharacter(characters, index + 1));
      parts.push({
        kind: "reading",
        source: nextRomaji && /^[aiueoyn]/.test(nextRomaji) ? "n'" : "n",
        text: character,
      });
      continue;
    }

    parts.push({ kind: "reading", source: kanaRomaji[character] ?? character, text: character });
  }

  return parts;
}

function countRomajiInputTokens(source: string): number {
  return createRomajiInputTarget(source, {
    allowSplitYoon: true,
    preset: "hepburn",
    selections: {},
  }).tokens.length;
}

function createVisibleRomajiGuide(source: string): string {
  const result: string[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index] ?? "";
    if (character === "n" && source[index + 1] === "'") {
      result.push("nn");
      index += 1;
      continue;
    }

    if (character === "'") {
      continue;
    }

    if (character !== sokuonSourceMarker) {
      result.push(character);
      continue;
    }

    const next = source[index + 1] ?? "";
    result.push(next !== "n" && /[a-z]/.test(next) ? next : "xtu");
  }

  return result.join("");
}

function resolveKanaRomaji(character: string): string {
  return kanaRomaji[character] ?? character;
}

function findNextNonSpaceCharacter(characters: string[], startIndex: number): string {
  for (let index = startIndex; index < characters.length; index += 1) {
    const character = characters[index] ?? "";
    if (!/\s/.test(character)) {
      return character;
    }
  }

  return "";
}

const kanaRomaji: Record<string, string> = {
  きゃ: "kya",
  きゅ: "kyu",
  きょ: "kyo",
  ぎゃ: "gya",
  ぎゅ: "gyu",
  ぎょ: "gyo",
  しゃ: "sha",
  しゅ: "shu",
  しょ: "sho",
  じゃ: "ja",
  じゅ: "ju",
  じょ: "jo",
  ちゃ: "cha",
  ちゅ: "chu",
  ちょ: "cho",
  てぃ: "thi",
  にゃ: "nya",
  にゅ: "nyu",
  にょ: "nyo",
  ひゃ: "hya",
  ひゅ: "hyu",
  ひょ: "hyo",
  ふぁ: "fa",
  ゔぁ: "va",
  ゔぃ: "vi",
  ゔぇ: "ve",
  ゔぉ: "vo",
  びゃ: "bya",
  びゅ: "byu",
  びょ: "byo",
  ぴゃ: "pya",
  ぴゅ: "pyu",
  ぴょ: "pyo",
  みゃ: "mya",
  みゅ: "myu",
  みょ: "myo",
  りゃ: "rya",
  りゅ: "ryu",
  りょ: "ryo",
  あ: "a",
  い: "i",
  う: "u",
  ゔ: "vu",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  だ: "da",
  ぢ: "ji",
  づ: "du",
  で: "de",
  ど: "do",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "wo",
  ぁ: "la",
  ぃ: "li",
  ぅ: "lu",
  ぇ: "le",
  ぉ: "lo",
  ゃ: "lya",
  ゅ: "lyu",
  ょ: "lyo",
  "、": ",",
  "。": ".",
  "　": " ",
};

function removeVisualSpaces(value: string): string {
  return value.replace(/[\s　]/g, "");
}

const japanesePracticeChallenges = parseJapaneseChallengeText(japanesePracticeText);
const japaneseProductionChallenges = parseJapaneseChallengeText(japaneseProductionText);

export const shortChallenges = japanesePracticeChallenges.map(({ display }) => display);
export const longChallenges = japaneseProductionChallenges.map(({ display }) => display);
export const shortChallengeReadings = japanesePracticeChallenges.map(({ reading }) => reading);
export const longChallengeReadings = japaneseProductionChallenges.map(({ reading }) => reading);
export const shortChallengeFurigana = japanesePracticeChallenges.map(({ furigana }) => furigana);
export const longChallengeFurigana = japaneseProductionChallenges.map(({ furigana }) => furigana);

export const directShortChallenges = createJapaneseDirectChallenges(japanesePracticeChallenges);
export const directLongChallenges = createJapaneseDirectChallenges(japaneseProductionChallenges);

export const englishShortChallenges = parseEnglishChallengeText(englishPracticeText);
export const englishLongChallenges = parseEnglishChallengeText(englishProductionText);

export const englishDirectShortChallenges: DirectChallenge[] = englishShortChallenges.map(
  (display) => ({
    display,
    input: display,
  }),
);

export const englishDirectLongChallenges: DirectChallenge[] = englishLongChallenges.map(
  (display) => ({
    display,
    input: display,
  }),
);
