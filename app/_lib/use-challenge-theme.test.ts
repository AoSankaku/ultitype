import { describe, expect, test } from "bun:test";
import { getChallengeThemeOverride } from "./use-challenge-theme";

describe("development theme override", () => {
  test("accepts valid saved overrides only in development", () => {
    expect(getChallengeThemeOverride("ramen-types", "development")).toBe("ramen-types");
    expect(getChallengeThemeOverride("ramen-types", "production")).toBeNull();
  });

  test("treats invalid and missing preferences as automatic selection", () => {
    expect(getChallengeThemeOverride("unknown-theme", "development")).toBeNull();
    expect(getChallengeThemeOverride(null, "development")).toBeNull();
  });
});
