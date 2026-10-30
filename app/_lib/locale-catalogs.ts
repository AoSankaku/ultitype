import ja from "@/locales/ja.yaml";
import en from "@/locales/en.yaml";
import zhCN from "@/locales/zh-CN.yaml";
import zhTW from "@/locales/zh-TW.yaml";
import zhHK from "@/locales/zh-HK.yaml";
import hi from "@/locales/hi.yaml";
import es from "@/locales/es.yaml";
import fr from "@/locales/fr.yaml";
import de from "@/locales/de.yaml";
import ptBR from "@/locales/pt-BR.yaml";
import ptPT from "@/locales/pt-PT.yaml";
import ru from "@/locales/ru.yaml";
import ar from "@/locales/ar.yaml";
import id from "@/locales/id.yaml";
import ko from "@/locales/ko.yaml";
import vi from "@/locales/vi.yaml";
import tr from "@/locales/tr.yaml";
import it from "@/locales/it.yaml";
import pl from "@/locales/pl.yaml";
import cs from "@/locales/cs.yaml";
import ms from "@/locales/ms.yaml";
import ro from "@/locales/ro.yaml";
import { appLanguageCodes, type AppLanguage } from "./locale-codes";

// Bundled synchronously: switching locale never waits on a request or displays fallback copy.
export type LocaleCatalog = {
  meta: { code: string; name: string; direction: "ltr" | "rtl" };
  messages: Record<string, string>;
};

export const localeCatalogs: Record<AppLanguage, LocaleCatalog> = {
  ja, en, "zh-CN": zhCN, "zh-TW": zhTW, "zh-HK": zhHK, hi, es, fr, de,
  "pt-BR": ptBR, "pt-PT": ptPT, ru, ar, id, ko, vi, tr, it, pl, cs, ms, ro,
};

export const appLanguages = appLanguageCodes.map(code => ({
  code,
  name: localeCatalogs[code].meta.name,
  direction: localeCatalogs[code].meta.direction,
}));
