import { describe, expect, test } from "bun:test";
import {
  centerScrollContextMaximumChallenges,
  collectCenterScrollChallenges,
  createCenterScrollContext,
  getQueuedChallengeIndexes,
  selectCenterScrollChallengeWindow,
  type CenterScrollChallenge,
} from "./center-scroll-context";

function challenge(index: number, guide = `g${index}`): CenterScrollChallenge {
  return {
    display: `d${index}`,
    furigana: [],
    guide,
    reading: `r${index}`,
  };
}

describe("center scroll context", () => {
  test("keeps multiple short challenges on both sides in chronological order", () => {
    const context = createCenterScrollContext(
      [challenge(1), challenge(2)],
      [challenge(4), challenge(5)],
      { characterBudget: 100 },
    );

    expect(context.previous.map(({ display }) => display)).toEqual(["d1", "d2"]);
    expect(context.next.map(({ display }) => display)).toEqual(["d4", "d5"]);
  });

  test("follows the current order through the upcoming shuffled order", () => {
    expect(
      getQueuedChallengeIndexes({
        challengeCount: 4,
        order: [2, 0, 3, 1],
        upcomingOrder: [1, 3, 0, 2],
        position: 2,
        maxCount: 5,
      }),
    ).toEqual([1, 1, 3, 0, 2]);
  });

  test("returns the closest prior challenges while preserving their order", () => {
    const context = createCenterScrollContext(
      [challenge(1), challenge(2), challenge(3), challenge(4)],
      [],
      { characterBudget: 4, minimumChallenges: 2 },
    );

    expect(context.previous.map(({ display }) => display)).toEqual(["d3", "d4"]);
  });

  test("keeps at least two challenges and stops after the character budget", () => {
    const challenges = Array.from({ length: 10 }, () => ({
      display: "d".repeat(20), guide: "g".repeat(20), reading: "r".repeat(20), furigana: [],
    }));
    const selected = selectCenterScrollChallengeWindow(challenges, {
      characterBudget: 25,
      minimumChallenges: 2,
    });

    expect(selected).toHaveLength(2);
    expect(selected[0]?.guide).toHaveLength(20);
  });

  test("bounds the number of rendered challenges", () => {
    const selected = selectCenterScrollChallengeWindow(
      Array.from({ length: centerScrollContextMaximumChallenges + 20 }, (_, index) => challenge(index)),
      { characterBudget: Number.MAX_SAFE_INTEGER },
    );

    expect(selected).toHaveLength(centerScrollContextMaximumChallenges);
  });

  test("stops at the end of the known upcoming shuffle", () => {
    expect(getQueuedChallengeIndexes({
      challengeCount: 3, order: [2, 0, 1], upcomingOrder: [0, 2, 1], position: 5,
    })).toEqual([0, 2, 1]);
    expect(getQueuedChallengeIndexes({
      challengeCount: 1, order: [0], upcomingOrder: [0], position: 2,
    })).toEqual([0]);
  });

  test("continues until each visible text row has enough surrounding characters", () => {
    const selected = selectCenterScrollChallengeWindow(
      Array.from({ length: 8 }, (_, index) => ({
        display: "d".repeat(3),
        furigana: [],
        guide: "g".repeat(12),
        reading: "r".repeat(4),
      })),
      { characterBudget: 12, minimumChallenges: 2 },
    );

    expect(selected).toHaveLength(4);
  });

  test("stops consuming a forward iterable as soon as the window is filled", () => {
    let visited = 0;
    function* challenges() {
      for (let index = 0; index < 20; index += 1) {
        visited += 1;
        yield challenge(index, "guide");
      }
    }

    const selected = collectCenterScrollChallenges(challenges(), {
      characterBudget: 5,
      minimumChallenges: 2,
    });

    expect(selected).toHaveLength(3);
    expect(visited).toBe(3);
  });
});
