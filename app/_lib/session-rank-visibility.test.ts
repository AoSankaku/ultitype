import { describe, expect, test } from "bun:test";
import { getVisibleSessionRank } from "./session-rank-visibility";

describe("session rank visibility", () => {
  test("conceals the in-progress rank number before 30 seconds", () => {
    expect(getVisibleSessionRank({ elapsedSeconds: 29.99, rankLabel: "A3" })).toEqual({
      isConcealed: true,
      label: "A?",
    });
  });

  test("keeps master rank prefixes visible while concealed", () => {
    expect(getVisibleSessionRank({ elapsedSeconds: 12, rankLabel: "M20" })).toEqual({
      isConcealed: true,
      label: "M?",
    });

    expect(getVisibleSessionRank({ elapsedSeconds: 12, rankLabel: "UM1" })).toEqual({
      isConcealed: true,
      label: "UM?",
    });
  });

  test("reveals the in-progress rank after the opening 30 seconds", () => {
    expect(getVisibleSessionRank({ elapsedSeconds: 30, rankLabel: "A3" })).toEqual({
      isConcealed: false,
      label: "A3",
    });
  });

  test("can reveal the full rank during the opening window", () => {
    expect(
      getVisibleSessionRank({
        concealOpeningRank: false,
        elapsedSeconds: 12,
        rankLabel: "A3",
      }),
    ).toEqual({
      isConcealed: false,
      label: "A3",
    });
  });

  test("keeps the rank concealed before the session starts", () => {
    expect(getVisibleSessionRank({ elapsedSeconds: null, rankLabel: "G0" })).toEqual({
      isConcealed: true,
      label: "G?",
    });
  });

  test("uses a bare question mark when there is no rank band yet", () => {
    expect(getVisibleSessionRank({ elapsedSeconds: null, rankLabel: "-" })).toEqual({
      isConcealed: true,
      label: "?",
    });
  });

  test("keeps NR visible because it has no numeric level to hide", () => {
    expect(getVisibleSessionRank({ elapsedSeconds: null, rankLabel: "NR" })).toEqual({
      isConcealed: true,
      label: "NR",
    });
  });
});
