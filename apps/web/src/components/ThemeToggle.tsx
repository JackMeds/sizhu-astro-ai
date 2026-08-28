import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { getBrandMarkSource } from "@/lib/brand";
import { useI18n } from "@/lib/i18n";

type Theme = "system" | "light" | "dark";

const THEME_KEY = "sizhu-theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "system" || stored === "light" || stored === "dark") return stored;
  if (stored === "modern") return "light";
  if (stored === "classical") return "dark";
  return "system";
}

function systemPrefersLight() {
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ?? false;
}

function resolveTheme(theme: Theme) {
  if (theme === "system") return systemPrefersLight() ? "light" : "dark";
  return theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    return resolveTheme(getInitialTheme());
  });

  useEffect(() => {
    const applyTheme = () => {
      const resolved = resolveTheme(theme);
      setResolvedTheme(resolved);
      document.documentElement.setAttribute("data-theme", resolved === "light" ? "modern" : "classical");
      document.documentElement.setAttribute("data-theme-mode", theme);
      const favicon = document.querySelector<HTMLLinkElement>("link[data-brand-favicon]");
      if (favicon) favicon.href = getBrandMarkSource(resolved);
    };

    applyTheme();
    localStorage.setItem(THEME_KEY, theme);

    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((previous) => {
      if (previous === "system") return "light";
      if (previous === "light") return "dark";
      return "system";
    });
  };

  return { resolvedTheme, theme, toggleTheme };
}

export function ThemeToggle() {
  const { resolvedTheme, theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const label = theme === "system"
    ? t("theme.system", { mode: resolvedTheme === "light" ? t("theme.light") : t("theme.dark") })
    : theme === "light"
      ? t("theme.lightMode")
      : t("theme.darkMode");

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      type="button"
      aria-label={t("theme.aria", { mode: label })}
      title={t("theme.aria", { mode: label })}
    >
      {theme === "system" ? <Monitor /> : resolvedTheme === "light" ? <Sun /> : <Moon />}
      <span>{label}</span>
    </button>
  );
}
