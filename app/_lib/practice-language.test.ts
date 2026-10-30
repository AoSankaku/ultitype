import { afterEach, describe, expect, test } from "bun:test";
import {
  parsePracticeLanguage,
  practiceLanguageStorageKey,
  readPracticeLanguage,
  rememberPracticeLanguage,
  resetPracticeLanguage,
} from "./practice-language";

const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

afterEach(() => {
  resetPracticeLanguage();
  if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
  else Reflect.deleteProperty(globalThis, "window");
});

describe("practice language preference", () => {
  test("accepts English and defaults unsupported saved values to Japanese", () => {
    expect(parsePracticeLanguage("en")).toBe("en");
    for (const value of [null, undefined, "fr", "", {}, "ja"]) {
      expect(parsePracticeLanguage(value)).toBe("ja");
    }
  });

  test("stores a separate practice preference and restores it after a reload", () => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    } });
    rememberPracticeLanguage("en");
    expect(values.get(practiceLanguageStorageKey)).toBe("en");
    expect(values.has("ultitype:v0")).toBe(false);
    resetPracticeLanguage();
    expect(readPracticeLanguage()).toBe("en");
  });

  test("retains the selected language when browser storage is blocked", () => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: {
      get localStorage() { throw new Error("Storage blocked"); },
    } });
    rememberPracticeLanguage("en");
    expect(readPracticeLanguage()).toBe("en");
    resetPracticeLanguage();
    expect(readPracticeLanguage()).toBe("ja");
  });
});
