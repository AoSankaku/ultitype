import { readLocalStorageItem, writeLocalStorageItem } from "./browser-storage";
import type { ChallengeLanguage } from "./types";

export const practiceLanguageStorageKey = "ultitype:practice-language";
let runtimePracticeLanguage: ChallengeLanguage | null = null;

export function parsePracticeLanguage(value: unknown): ChallengeLanguage {
  return value === "en" ? "en" : "ja";
}

export function readPracticeLanguage(): ChallengeLanguage {
  return runtimePracticeLanguage ?? parsePracticeLanguage(readLocalStorageItem(practiceLanguageStorageKey));
}

export function rememberPracticeLanguage(language: ChallengeLanguage) {
  runtimePracticeLanguage = language;
  writeLocalStorageItem(practiceLanguageStorageKey, language);
}

export function resetPracticeLanguage() {
  runtimePracticeLanguage = null;
}

export function clearPracticeLanguagePreference() {
  // Keep the reset effective even if the browser refuses to remove saved data.
  runtimePracticeLanguage = "ja";
}
