import { localeCatalogs } from "./locale-catalogs";
import type { AppLanguage } from "./locale-codes";

export type TranslationParams = Record<string, string | number>;

export function translate(language: AppLanguage, text: string, params: TranslationParams = {}) {
  const translated = localeCatalogs[language].messages[text]
    ?? localeCatalogs.en.messages[text] ?? localeCatalogs.ja.messages[text] ?? text;
  return translated.replace(/\{([\w]+)\}/gu, (placeholder, key: string) =>
    Object.hasOwn(params, key) ? String(params[key]) : placeholder,
  );
}
