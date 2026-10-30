import { appLanguageCodes } from "./locale-codes";
import { storageKey } from "./constants";

// Runs in <head> before paint. It never changes React-owned content during hydration.
export function getLocaleBootstrapScript() {
  return `(()=>{const root=document.documentElement;let language="ja",theme="dark";try{const state=JSON.parse(localStorage.getItem(${JSON.stringify(storageKey)})||"null");const settings=state?.settings;if(${JSON.stringify(appLanguageCodes)}.includes(settings?.appLanguage))language=settings.appLanguage;if(settings?.theme==="light")theme="light";}catch{}root.lang=language;root.dir=language==="ar"?"rtl":"ltr";root.dataset.appLanguage=language;root.dataset.theme=theme;if(language!=="ja")root.dataset.localePending="true";})();`;
}
