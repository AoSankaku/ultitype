import englishLearningPracticeText from "./challenge-data/themes/english-learning-practice.txt" with { type: "text" };
import englishLearningProductionText from "./challenge-data/themes/english-learning-production.txt" with { type: "text" };
import fishTypesPracticeText from "./challenge-data/themes/fish-types-practice.txt" with { type: "text" };
import fishTypesProductionText from "./challenge-data/themes/fish-types-production.txt" with { type: "text" };
import conveyorSushiPracticeText from "./challenge-data/themes/conveyor-sushi-practice.txt" with { type: "text" };
import conveyorSushiProductionText from "./challenge-data/themes/conveyor-sushi-production.txt" with { type: "text" };
import luxurySushiPracticeText from "./challenge-data/themes/luxury-sushi-practice.txt" with { type: "text" };
import luxurySushiProductionText from "./challenge-data/themes/luxury-sushi-production.txt" with { type: "text" };
import ramenHistoryPracticeText from "./challenge-data/themes/ramen-history-practice.txt" with { type: "text" };
import ramenHistoryProductionText from "./challenge-data/themes/ramen-history-production.txt" with { type: "text" };
import ramenTypesPracticeText from "./challenge-data/themes/ramen-types-practice.txt" with { type: "text" };
import ramenTypesProductionText from "./challenge-data/themes/ramen-types-production.txt" with { type: "text" };
import musicGenresPracticeText from "./challenge-data/themes/music-genres-practice.txt" with { type: "text" };
import musicGenresProductionText from "./challenge-data/themes/music-genres-production.txt" with { type: "text" };
import commuterTrainsPracticeText from "./challenge-data/themes/commuter-trains-practice.txt" with { type: "text" };
import commuterTrainsProductionText from "./challenge-data/themes/commuter-trains-production.txt" with { type: "text" };
import { createJapaneseDirectChallenges, parseJapaneseChallengeText } from "./challenges";
import { directLongChallenges, directShortChallenges } from "./challenges";
import type { ChallengeThemeId } from "@/app/_lib/challenge-theme-schedule";

export type ChallengeTheme = {
  id: ChallengeThemeId;
  label: string;
  shortChallenges: ReturnType<typeof createJapaneseDirectChallenges>;
  longChallenges: ReturnType<typeof createJapaneseDirectChallenges>;
};

function createTheme(
  id: ChallengeThemeId,
  label: string,
  practiceText: string,
  productionText: string,
): ChallengeTheme {
  return {
    id,
    label,
    shortChallenges: createJapaneseDirectChallenges(parseJapaneseChallengeText(practiceText)),
    longChallenges: createJapaneseDirectChallenges(parseJapaneseChallengeText(productionText)),
  };
}

export const challengeThemes: readonly ChallengeTheme[] = [
  createTheme("english-learning", "英語学習", englishLearningPracticeText, englishLearningProductionText),
  createTheme("fish-types", "魚の種類", fishTypesPracticeText, fishTypesProductionText),
  createTheme("conveyor-sushi", "回転すし", conveyorSushiPracticeText, conveyorSushiProductionText),
  createTheme("luxury-sushi", "高級寿司", luxurySushiPracticeText, luxurySushiProductionText),
  createTheme("ramen-history", "ラーメンの歴史", ramenHistoryPracticeText, ramenHistoryProductionText),
  createTheme("ramen-types", "ラーメンの種類", ramenTypesPracticeText, ramenTypesProductionText),
  createTheme("music-genres", "音楽のジャンル", musicGenresPracticeText, musicGenresProductionText),
  createTheme("commuter-trains", "通勤電車", commuterTrainsPracticeText, commuterTrainsProductionText),
  {
    id: "typing-tips",
    label: "タイピングのコツ",
    shortChallenges: directShortChallenges,
    longChallenges: directLongChallenges,
  },
];

const challengeThemeById = new Map(challengeThemes.map((theme) => [theme.id, theme]));

export function getChallengeTheme(themeId: ChallengeThemeId): ChallengeTheme {
  return challengeThemeById.get(themeId) ?? challengeThemes.at(-1)!;
}
