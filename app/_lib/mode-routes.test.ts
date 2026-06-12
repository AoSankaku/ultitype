import { describe, expect, test } from "bun:test";
import { getModePath, getModeSelectPath, getRouteModeId } from "./mode-routes";

describe("mode routes", () => {
  test("maps each practice mode to its own page", () => {
    expect(getModePath("practice-accuracy")).toBe("/practice/accuracy");
    expect(getModePath("practice-flow")).toBe("/practice/flow");
    expect(getModePath("practice-speed")).toBe("/practice/speed");
  });

  test("maps each production mode to its own page", () => {
    expect(getModePath("production-ime-off")).toBe("/production/ime-off");
    expect(getModePath("production-ime-on")).toBe("/production/ime-on");
  });

  test("uses separate dedicated mode paths for English challenges", () => {
    expect(getModePath("practice-flow", "en")).toBe("/en/practice/flow");
    expect(getModePath("production-ime-off", "en")).toBe("/en/production/ime-off");
    expect(getModePath("practice-flow", "ja")).toBe("/practice/flow");
  });

  test("uses separate mode select paths for each challenge language", () => {
    expect(getModeSelectPath("ja")).toBe("/");
    expect(getModeSelectPath("en")).toBe("/en");
  });

  test("rejects mismatched or unknown route segments", () => {
    expect(getRouteModeId("practice", "ime-off")).toBeNull();
    expect(getRouteModeId("production", "speed")).toBeNull();
    expect(getRouteModeId("arcade", "flow")).toBeNull();
  });
});
