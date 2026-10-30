// Locale identifiers are configuration; display names and translations live in YAML.
export const appLanguageCodes = [
  "ja", "en", "zh-CN", "zh-TW", "zh-HK", "hi", "es", "fr", "de", "pt-BR", "pt-PT",
  "ru", "ar", "id", "ko", "vi", "tr", "it", "pl", "cs", "ms", "ro",
] as const;

export type AppLanguage = typeof appLanguageCodes[number];

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === "string" && (appLanguageCodes as readonly string[]).includes(value);
}

export function normalizeAppLanguage(value: unknown): AppLanguage {
  return isAppLanguage(value) ? value : "ja";
}

export function getAppDirection(language: AppLanguage): "ltr" | "rtl" {
  return language === "ar" ? "rtl" : "ltr";
}
