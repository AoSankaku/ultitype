import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseDocument } from "yaml";
import { appLanguageCodes, getAppDirection } from "../app/_lib/locale-codes";

function readCatalog(code: string) {
  const document = parseDocument(readFileSync(resolve("locales", `${code}.yaml`), "utf8"), { uniqueKeys: true });
  if (document.errors.length) throw document.errors[0];
  return document.toJS({ maxAliasCount: 0 }) as {
    meta: { code: string; name: string; direction: string };
    messages: Record<string, unknown>;
  };
}

function placeholders(value: string) {
  return [...value.matchAll(/\{(\w+)\}/gu)].map(match => match[1]).sort().join(",");
}

export function verifyUiLocales() {
  const reference = readCatalog("en");
  const referenceKeys = Object.keys(reference.messages).sort();
  for (const code of appLanguageCodes) {
    const catalog = readCatalog(code);
    if (catalog.meta?.code !== code || !catalog.meta?.name || catalog.meta.direction !== getAppDirection(code)) {
      throw new Error(`${code}: invalid locale metadata`);
    }
    if (JSON.stringify(Object.keys(catalog.messages).sort()) !== JSON.stringify(referenceKeys)) {
      const missing = referenceKeys.filter(key => !Object.hasOwn(catalog.messages, key));
      const extra = Object.keys(catalog.messages).filter(key => !Object.hasOwn(reference.messages, key));
      throw new Error(`${code}: mismatched message keys; missing ${missing.join(" | ")}; extra ${extra.join(" | ")}`);
    }
    for (const key of referenceKeys) {
      const value = catalog.messages[key];
      if (typeof value !== "string" || !value.trim()) throw new Error(`${code}: empty or non-string message ${key}`);
      if (placeholders(value) !== placeholders(String(reference.messages[key]))) {
        throw new Error(`${code}: mismatched placeholders in ${key}`);
      }
    }
  }
  return { locales: appLanguageCodes.length, messages: referenceKeys.length };
}

if (import.meta.main) {
  const result = verifyUiLocales();
  console.log(`${result.locales} YAML locales verified; ${result.messages} messages each.`);
}
