import { describe, expect, test } from "bun:test";
import { modes } from "@/src/lib/typing";
import {
  createOrderedIndexes,
  createShuffledIndexes,
  getModeChallengeIndex,
  getNextModeChallengeIndex,
  getNextOrderedChallengeIndex,
  getOrderedChallengeIndex,
} from "./challenge-utils";

describe("practice challenge order", () => {
  test("can create a deterministic initial order for server-rendered mode pages", () => {
    expect(createOrderedIndexes(4)).toEqual([0, 1, 2, 3]);
  });

  test("shuffles indexes using the provided random source", () => {
    const randomValues = [0.99, 0, 0.5, 0.1];
    const order = createShuffledIndexes(5, () => randomValues.shift() ?? 0);

    expect(order).toEqual([2, 3, 1, 0, 4]);
  });

  test("keeps the first shuffled index different from the previous cycle's last index", () => {
    const randomValues = [0, 0];
    const order = createShuffledIndexes(3, () => randomValues.shift() ?? 0, 1);

    expect(order).toEqual([2, 1, 0]);
  });

  test("allows a single available challenge to repeat", () => {
    expect(createShuffledIndexes(1, () => 0, 0)).toEqual([0]);
  });

  test("resolves shuffled challenge indexes with wraparound", () => {
    const order = [2, 0, 1];

    expect(getOrderedChallengeIndex(0, 3, order)).toBe(2);
    expect(getOrderedChallengeIndex(4, 3, order)).toBe(0);
  });

  test("resolves the next challenge from the upcoming order at cycle boundaries", () => {
    const currentOrder = [2, 0, 1];
    const upcomingOrder = [0, 2, 1];

    expect(getNextOrderedChallengeIndex(0, 3, currentOrder, upcomingOrder)).toBe(0);
    expect(getNextOrderedChallengeIndex(2, 3, currentOrder, upcomingOrder)).toBe(0);
  });

  test("uses shuffled order for production challenge indexes too", () => {
    const order = [2, 0, 1];
    const upcomingOrder = [1, 2, 0];

    expect(getModeChallengeIndex("production", 0, 3, order)).toBe(2);
    expect(getNextModeChallengeIndex("production", 2, 3, order, upcomingOrder)).toBe(1);
  });

  test("prevents back-to-back cycle boundary repeats in speed practice", () => {
    const speedMode = modes.find((mode) => mode.id === "practice-speed");
    const currentOrder = [2, 0, 1];
    const upcomingOrder = createShuffledIndexes(3, () => 0, currentOrder.at(-1));

    expect(speedMode?.group).toBe("practice");
    expect(currentOrder.at(-1)).toBe(1);
    expect(upcomingOrder[0]).not.toBe(currentOrder.at(-1));
    expect(
      getNextModeChallengeIndex(
        speedMode?.group ?? "practice",
        2,
        3,
        currentOrder,
        upcomingOrder,
      ),
    ).toBe(upcomingOrder[0]);
  });
});
