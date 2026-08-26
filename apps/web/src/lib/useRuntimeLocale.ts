import { useEffect, useMemo, useState } from "react";

export type RuntimeLocale = "zh-CN" | "en-US";

function readLocale(): RuntimeLocale {
  if (typeof document === "undefined") return "zh-CN";
  return document.documentElement.lang.toLowerCase().startsWith("en") ? "en-US" : "zh-CN";
}

function interpolate(value: string, variables?: Record<string, string | number>) {
  if (!variables) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(variables[key] ?? `{{${key}}}`));
}

/**
 * Lightweight bridge for components that need to follow the document locale.
 * The main i18n provider owns language selection; this hook only observes the
 * resulting <html lang> value, so query-string, browser and manual switches
 * remain synchronized without a second source of truth.
 */
export function useRuntimeLocale() {
  const [locale, setLocale] = useState<RuntimeLocale>(readLocale);

  useEffect(() => {
    const update = () => setLocale(readLocale());
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"]
    });
    window.addEventListener("storage", update);
    window.addEventListener("astrocopy:localechange", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", update);
      window.removeEventListener("astrocopy:localechange", update);
    };
  }, []);

  return useMemo(() => ({
    locale,
    isEnglish: locale === "en-US",
    pick: (zh: string, en: string, variables?: Record<string, string | number>) =>
      interpolate(locale === "en-US" ? en : zh, variables)
  }), [locale]);
}
