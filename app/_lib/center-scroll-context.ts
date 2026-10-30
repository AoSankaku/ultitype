import type { JapaneseFuriganaEntry } from "@/src/lib/challenges";

export type CenterScrollChallenge = {
  display: string;
  furigana: JapaneseFuriganaEntry[];
  guide: string;
  reading: string;
};

export type CenterScrollContext = {
  previous: CenterScrollChallenge[];
  next: CenterScrollChallenge[];
};

export const centerScrollContextCharacterBudget = 512;
export const centerScrollContextMinimumChallenges = 2;
export const centerScrollContextMaximumChallenges = 64;

export function getQueuedChallengeIndexes({
  challengeCount,
  maxCount = centerScrollContextMaximumChallenges,
  order,
  position,
  upcomingOrder,
}: {
  challengeCount: number;
  maxCount?: number;
  order: number[];
  position: number;
  upcomingOrder: number[];
}) {
  if (challengeCount <= 0 || maxCount <= 0) {
    return [];
  }

  const indexes: number[] = [];
  const currentOffset = position % challengeCount;
  const knownUpcomingCount = Math.max(0, challengeCount * 2 - currentOffset - 1);
  for (let offset = 1; offset <= Math.min(maxCount, knownUpcomingCount); offset += 1) {
    const nextOffset = currentOffset + offset;
    const nextOrder = nextOffset < challengeCount ? order : upcomingOrder;
    const orderIndex = nextOffset % challengeCount;
    indexes.push(nextOrder[orderIndex] ?? orderIndex);
  }

  return indexes;
}

function collectWindowInOrder(
  challenges: Iterable<CenterScrollChallenge>,
  {
    characterBudget = centerScrollContextCharacterBudget,
    minimumChallenges = centerScrollContextMinimumChallenges,
    maximumChallenges = centerScrollContextMaximumChallenges,
  }: {
    characterBudget?: number;
    minimumChallenges?: number;
    maximumChallenges?: number;
  } = {},
) {
  const selected: CenterScrollChallenge[] = [];
  const lineCharacterCounts = { display: 0, guide: 0, reading: 0 };

  for (const challenge of challenges) {
    if (selected.length >= maximumChallenges) {
      break;
    }
    selected.push(challenge);
    lineCharacterCounts.display += Array.from(challenge.display).length;
    lineCharacterCounts.reading += Array.from(challenge.reading).length;
    lineCharacterCounts.guide += Array.from(challenge.guide).length;

    const visibleLines = Object.values(lineCharacterCounts).filter((count) => count > 0);
    if (
      selected.length >= minimumChallenges &&
      visibleLines.length > 0 &&
      visibleLines.every((count) => count >= characterBudget)
    ) {
      break;
    }
  }

  return selected;
}

export function selectCenterScrollChallengeWindow(
  challenges: CenterScrollChallenge[],
  options?: Parameters<typeof collectWindowInOrder>[1],
) {
  return collectWindowInOrder(challenges, options);
}

export function collectCenterScrollChallenges(
  challenges: Iterable<CenterScrollChallenge>,
  { reverse = false, ...windowOptions }: Parameters<typeof selectCenterScrollChallengeWindow>[1] & {
    reverse?: boolean;
  } = {},
) {
  const candidates: CenterScrollChallenge[] = [];
  const maximumChallenges = windowOptions.maximumChallenges ?? centerScrollContextMaximumChallenges;

  if (!reverse) {
    return collectWindowInOrder(challenges, windowOptions);
  }

  for (const challenge of challenges) {
    candidates.push(challenge);
    if (candidates.length > maximumChallenges) {
      candidates.shift();
    }
  }

  const selected = collectWindowInOrder(candidates.reverse(), windowOptions);
  return selected.reverse();
}

export function createCenterScrollContext(
  previous: Iterable<CenterScrollChallenge>,
  next: Iterable<CenterScrollChallenge>,
  options?: Parameters<typeof selectCenterScrollChallengeWindow>[1],
): CenterScrollContext {
  return {
    previous: collectCenterScrollChallenges(previous, { ...options, reverse: true }),
    next: collectCenterScrollChallenges(next, options),
  };
}
