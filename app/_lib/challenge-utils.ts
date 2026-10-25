import {
  directLongChallenges,
  directShortChallenges,
  englishDirectLongChallenges,
  englishDirectShortChallenges,
} from "@/src/lib/challenges";
import type { ModeGroup } from "@/src/lib/typing";
import { getChallengeTheme } from "@/src/lib/challenge-themes";
import type { ChallengeThemeId } from "./challenge-theme-schedule";
import type { ChallengeLanguage } from "./types";

export function getDirectChallenges(
  language: ChallengeLanguage,
  group: ModeGroup,
  themeId: ChallengeThemeId = "typing-tips",
) {
  if (language === "en") {
    return group === "practice" ? englishDirectShortChallenges : englishDirectLongChallenges;
  }

  if (themeId === "typing-tips") {
    return group === "practice" ? directShortChallenges : directLongChallenges;
  }

  const theme = getChallengeTheme(themeId);
  return group === "practice" ? theme.shortChallenges : theme.longChallenges;
}

export function removeRomajiVisualSpaces(value: string) {
  return value.replace(/\s/g, "");
}

export function estimateImeKeystrokes(target: string): number {
  const kanaLike = Array.from(target).filter((character) => !/\s/.test(character)).length;
  return Math.ceil(kanaLike * 1.15);
}

export function clampInteger(value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return min;
  }

  return Math.min(max, Math.max(min, parsed));
}

export function createOrderedIndexes(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

export function createShuffledIndexes(
  length: number,
  random: () => number = Math.random,
  previousLastIndex?: number,
): number[] {
  const indexes = createOrderedIndexes(length);

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [indexes[index], indexes[randomIndex]] = [indexes[randomIndex], indexes[index]];
  }

  if (indexes.length > 1 && indexes[0] === previousLastIndex) {
    [indexes[0], indexes[1]] = [indexes[1], indexes[0]];
  }

  return indexes;
}

export function getOrderedChallengeIndex(position: number, challengeCount: number, order: number[]) {
  if (challengeCount <= 0) {
    return 0;
  }

  return order[position % challengeCount] ?? position % challengeCount;
}

export function getNextOrderedChallengeIndex(
  position: number,
  challengeCount: number,
  order: number[],
  upcomingOrder: number[],
) {
  if (challengeCount <= 0) {
    return 0;
  }

  const nextPosition = position + 1;
  const nextOrder = nextPosition % challengeCount === 0 ? upcomingOrder : order;

  return getOrderedChallengeIndex(nextPosition, challengeCount, nextOrder);
}

export function getModeChallengeIndex(
  _group: ModeGroup,
  position: number,
  challengeCount: number,
  order: number[],
) {
  return getOrderedChallengeIndex(position, challengeCount, order);
}

export function getNextModeChallengeIndex(
  _group: ModeGroup,
  position: number,
  challengeCount: number,
  order: number[],
  upcomingOrder: number[],
) {
  return getNextOrderedChallengeIndex(position, challengeCount, order, upcomingOrder);
}
