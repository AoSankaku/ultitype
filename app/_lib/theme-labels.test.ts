import { describe, expect, test } from "bun:test";
import { getThemeLabel } from "./theme-labels";

describe("theme labels", () => {
  test("localizes metadata without changing Japanese practice text", () => {
    const theme = { id: "english-learning", label: "英語学習" };
    expect(getThemeLabel(theme, "en")).toBe("Learning English");
    expect(getThemeLabel(theme, "ja")).toBe("英語学習");
    expect(theme.label).toBe("英語学習");
  });
  test("uses English names for country and prefecture options", () => {
    expect(getThemeLabel({ id: "travel-fr", label: "国外旅行・フランス" }, "en"))
      .toBe("Travel abroad · France");
    expect(getThemeLabel({ id: "travel-jp-hokkaido", label: "国内旅行・北海道" }, "en"))
      .toBe("Travel in Japan · Hokkaido");
  });
});
