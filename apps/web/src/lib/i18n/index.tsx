import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { dictionary as zh } from "./zh";
import { dictionary as en } from "./en";

export type Locale = "zh-CN" | "en-US";
export type TranslationVariables = Record<string, string | number>;

const STORAGE_KEY = "astrocopy-locale-v1";

function localeFromPath(pathname: string): Locale | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/en") return "en-US";
  if (path === "/zh") return "zh-CN";
  return null;
}

function localeFromQuery(search: string): Locale | null {
  const query = new URLSearchParams(search).get("lang")?.toLowerCase();
  if (query === "en" || query === "en-us") return "en-US";
  if (query === "zh" || query === "zh-cn") return "zh-CN";
  return null;
}

function localizedPath(locale: Locale) {
  return locale === "en-US" ? "/en/" : "/zh/";
}

function initialLocale(): Locale {
  if (typeof window === "undefined") return "zh-CN";
  const pathLocale = localeFromPath(window.location.pathname);
  if (pathLocale) return pathLocale;
  const queryLocale = localeFromQuery(window.location.search);
  if (queryLocale) return queryLocale;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en-US" || stored === "zh-CN") return stored;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}

function interpolate(value: string, variables?: TranslationVariables) {
  if (!variables) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(variables[key] ?? `{{${key}}}`));
}

interface I18nContextValue {
  locale: Locale;
  isEnglish: boolean;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, variables?: TranslationVariables) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const previousLocale = useRef<Locale | null>(null);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((current) => current === "en-US" ? "zh-CN" : "en-US");
  }, []);

  useEffect(() => {
    const dictionary = locale === "en-US" ? en : zh;
    document.documentElement.lang = locale;
    document.title = dictionary["meta.title"];
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = dictionary["meta.description"];
    window.localStorage.setItem(STORAGE_KEY, locale);
    const url = new URL(window.location.href);
    const pathLocale = localeFromPath(url.pathname);
    const queryLocale = localeFromQuery(url.search);
    const isFirstEffect = previousLocale.current === null;
    const isLegacyQuery = !pathLocale && queryLocale !== null;
    const isLocaleSwitch = !isFirstEffect && previousLocale.current !== locale;
    if (isLegacyQuery || isLocaleSwitch) {
      url.pathname = localizedPath(locale);
      url.searchParams.delete("lang");
      window.history.replaceState({}, "", url);
    } else if (pathLocale) {
      url.searchParams.delete("lang");
      window.history.replaceState({}, "", url);
    }
    previousLocale.current = locale;
  }, [locale]);

  const t = useCallback((key: string, variables?: TranslationVariables) => {
    const dictionary: Record<string, string> = locale === "en-US" ? en : zh;
    const fallback: Record<string, string> = zh;
    return interpolate(dictionary[key] ?? fallback[key] ?? key, variables);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    isEnglish: locale === "en-US",
    setLocale,
    toggleLocale,
    t
  }), [locale, setLocale, t, toggleLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside LocaleProvider");
  return value;
}

export function getTranslationKeys(locale: Locale) {
  return Object.keys(locale === "en-US" ? en : zh).sort();
}
