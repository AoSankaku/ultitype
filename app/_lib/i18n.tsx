"use client";

import { createContext, useContext, useLayoutEffect, useMemo, type ReactNode } from "react";
import { getAppDirection, type AppLanguage } from "./locale-codes";
import { translate, type TranslationParams } from "./locale-messages";

export { translate, type TranslationParams } from "./locale-messages";

type LocaleContextValue = {
  language: AppLanguage;
  t: (text: string, params?: TranslationParams) => string;
};

const LocaleContext = createContext<LocaleContextValue>({
  language: "ja",
  t: (text, params) => translate("ja", text, params),
});

export function LocaleProvider({
  language, ready = true, children,
}: { language: AppLanguage; ready?: boolean; children: ReactNode }) {
  useLayoutEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    root.lang = language;
    root.dir = getAppDirection(language);
    root.dataset.appLanguage = language;
    // This layout effect runs after the translated DOM is committed, before paint.
    delete root.dataset.localePending;
  }, [language, ready]);

  const value = useMemo<LocaleContextValue>(
    () => ({ language, t: (text, params) => translate(language, text, params) }),
    [language],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  return useContext(LocaleContext);
}
