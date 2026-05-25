import englishProductionText from "./challenge-data/en-production.txt" with { type: "text" };
import englishPracticeText from "./challenge-data/en-practice.txt" with { type: "text" };
import japaneseProductionText from "./challenge-data/ja-production.txt" with { type: "text" };
import japanesePracticeText from "./challenge-data/ja-practice.txt" with { type: "text" };

export type DirectChallenge = {
  display: string;
  guide?: string;
  input: string;
};

export type JapaneseChallengeSource = {
  display: string;
  reading: string;
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
    .map((line, index) => {
      const columns = line.split("\t");

      if (columns.length !== 2 || !columns[0] || !columns[1]) {
        throw new Error(`Invalid Japanese challenge line ${index + 1}: expected display<TAB>reading`);
      }

      return {
        display: columns[0].trim(),
        reading: columns[1].trim(),
      };
    });
}

function createJapaneseDirectChallenges(challenges: JapaneseChallengeSource[]): DirectChallenge[] {
  return challenges.map(({ display, reading }) => {
    const guide = kanaReadingToRomaji(reading);

    return {
      display,
      guide,
      input: removeVisualSpaces(guide),
    };
  });
}

function kanaReadingToRomaji(reading: string): string {
  const characters = Array.from(reading);
  const result: string[] = [];

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index] ?? "";
    const next = characters[index + 1] ?? "";
    const pair = `${character}${next}`;

    if (character === "っ") {
      const nextRomaji = resolveKanaRomaji(next);
      result.push(nextRomaji ? nextRomaji[0] ?? "" : "");
      continue;
    }

    const pairedRomaji = kanaRomaji[pair];
    if (pairedRomaji) {
      result.push(pairedRomaji);
      index += 1;
      continue;
    }

    if (character === "ん") {
      const nextRomaji = resolveKanaRomaji(next);
      result.push(nextRomaji && /^[aiueoyn]/.test(nextRomaji) ? "n'" : "n");
      continue;
    }

    result.push(kanaRomaji[character] ?? character);
  }

  return result.join("");
}

function resolveKanaRomaji(character: string): string {
  return kanaRomaji[character] ?? character;
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
