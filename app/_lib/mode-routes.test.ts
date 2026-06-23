import { describe, expect, test } from "bun:test";
import {
  getModePath,
  getModeSelectPath,
  getRouteModeId,
  parseProductionDurationParam,
} from "./mode-routes";

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

  test("keeps selected production duration on dedicated production mode links", () => {
    expect(getModePath("production-ime-off", "ja", 600)).toBe(
      "/production/ime-off?duration=600",
    );
    expect(getModePath("production-ime-on", "en", 600)).toBe(
      "/en/production/ime-on?duration=600",
    );
    expect(getModePath("practice-flow", "ja", 600)).toBe("/practice/flow");
  });

  test("parses supported production duration route parameters", () => {
    expect(parseProductionDurationParam("600")).toBe(600);
    expect(parseProductionDurationParam("300")).toBe(300);
    expect(parseProductionDurationParam("1200")).toBe(300);
    expect(parseProductionDurationParam(undefined)).toBe(300);
    expect(parseProductionDurationParam(["600"])).toBe(600);
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

  test("keeps selected production duration on mode select paths", () => {
    expect(getModeSelectPath("ja", 600)).toBe("/?duration=600");
    expect(getModeSelectPath("en", 600)).toBe("/en?duration=600");
    expect(getModeSelectPath("ja", 300)).toBe("/");
  });

  test("rejects mismatched or unknown route segments", () => {
    expect(getRouteModeId("practice", "ime-off")).toBeNull();
    expect(getRouteModeId("production", "speed")).toBeNull();
    expect(getRouteModeId("arcade", "flow")).toBeNull();
  });
});
