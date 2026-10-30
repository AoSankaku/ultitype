import { translate } from "./locale-messages";
import type { AppLanguage } from "./types";

type ThemeMetadata = { id: string; label: string };

// IDs provide stable English names without translating the practice passages.
export function getThemeLabel(theme: ThemeMetadata | undefined, language: AppLanguage): string {
  if (!theme) return translate(language, "タイピングのコツ");
  if (language === "ja") return theme.label;
  const name = getThemeOptionLabel(theme, language);
  if (theme.id.startsWith("travel-jp-")) {
    return translate(language, "theme.domestic", { name });
  }
  if (theme.id.startsWith("travel-")) {
    return translate(language, "theme.international", { name });
  }
  return name;
}

export function getThemeOptionLabel(theme: ThemeMetadata, language: AppLanguage): string {
  if (language === "ja") return theme.label.replace(/^(?:国内|国外)旅行・/u, "");
  if (theme.id.startsWith("travel-jp-")) {
    const prefecture = theme.id.slice("travel-jp-".length);
    return `${prefecture.charAt(0).toUpperCase()}${prefecture.slice(1)}`;
  }
  if (theme.id.startsWith("travel-")) {
    const region = theme.id.slice("travel-".length).toUpperCase();
    return new Intl.DisplayNames([language], { type: "region" }).of(region) ?? region;
  }
  return translate(language, theme.label);
}
