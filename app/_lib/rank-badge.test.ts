import { describe, expect, test } from "bun:test";
import {
  getRankBadgeBorderWidth,
  getRankBadgeGlossAngleDegrees,
  getRankBadgeGlossBlur,
  getRankBadgeTextStrokeWidth,
  getRankBadgeSpec,
  getRankBadgeTextFont,
} from "./rank-badge";

describe("getRankBadgeSpec", () => {
  test("renders NR as a gray rounded badge with white text and no border", () => {
    expect(getRankBadgeSpec("NR")).toMatchObject({
      borderColor: null,
      fillColor: "#8a8a8a",
      foregroundColor: "#ffffff",
      glossy: false,
      shape: "round",
      text: "NR",
    });
  });

  test("renders G0 through S ranks as white round badges with colored borders", () => {
    expect(getRankBadgeSpec("G0")).toMatchObject({
      borderColor: "#8a8a8a",
      fillColor: "#ffffff",
      foregroundColor: "#2a2a2a",
      glossy: false,
      shape: "round",
      text: "G0",
    });
  });

  test("adds a glossy treatment to S rank while keeping the round bordered badge", () => {
    expect(getRankBadgeSpec("S3")).toMatchObject({
      borderColor: "#c99018",
      borderGloss: true,
      fillColor: "#ffffff",
      foregroundColor: "#2a2a2a",
      glossy: true,
      shape: "round",
      text: "S3",
    });
  });

  test("renders M0 through M19 as purple square badges", () => {
    expect(getRankBadgeSpec("M6")).toMatchObject({
      borderColor: null,
      fillColor: "#7b3ff2",
      foregroundColor: "#ffffff",
      glossy: true,
      shape: "square",
      text: "M6",
    });
  });

  test("renders M20 through M59 as black-purple and black square badges", () => {
    expect(getRankBadgeSpec("M20")).toMatchObject({
      borderColor: null,
      fillColor: "#3f225e",
      foregroundColor: "#ffffff",
      glossy: true,
      shape: "square",
      text: "M20",
    });

    expect(getRankBadgeSpec("M40")).toMatchObject({
      borderColor: null,
      fillColor: "#111111",
      foregroundColor: "#ffffff",
      glossy: true,
      shape: "square",
      text: "M40",
    });
  });

  test("renders UM ranks as rainbow square badges with black text", () => {
    expect(getRankBadgeSpec("UM0")).toMatchObject({
      borderColor: null,
      foregroundColor: "#111111",
      glossy: true,
      rainbow: true,
      shape: "square",
      textStrokeColor: "#ffffff",
      text: "UM0",
    });

    expect(getRankBadgeSpec("UM42")).toMatchObject({
      borderColor: null,
      foregroundColor: "#111111",
      glossy: true,
      rainbow: true,
      shape: "square",
      textStrokeColor: "#ffffff",
      text: "UM42",
    });
  });

  test("uses a heavier border for round bordered rank badges", () => {
    expect(getRankBadgeBorderWidth(36)).toBeGreaterThanOrEqual(5);
  });

  test("uses Quantico as the primary canvas font", () => {
    expect(getRankBadgeTextFont(20)).toBe('700 20px "Quantico", "Trispace", Arial, sans-serif');
  });

  test("uses a visible text stroke for UM ranks", () => {
    expect(getRankBadgeTextStrokeWidth(20)).toBeGreaterThanOrEqual(3);
  });

  test("applies glossy light as a diagonal band", () => {
    expect(getRankBadgeGlossAngleDegrees()).toBe(-22);
  });

  test("softens the diagonal glossy band with blur", () => {
    expect(getRankBadgeGlossBlur(36)).toBeGreaterThanOrEqual(3);
  });
});
