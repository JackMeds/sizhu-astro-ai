import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

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
    };

    applyTheme();
    localStorage.setItem(THEME_KEY, theme);

    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      if (prev === "system") return "light";
      if (prev === "light") return "dark";
      return "system";
    });
  };

  return { resolvedTheme, theme, toggleTheme };
}

export function ThemeToggle() {
  const { resolvedTheme, theme, toggleTheme } = useTheme();
  const label = theme === "system" ? `跟随系统：${resolvedTheme === "light" ? "浅色" : "深色"}` : theme === "light" ? "浅色模式" : "深色模式";

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      type="button"
      aria-label={`当前${label}，点击切换主题`}
    >
      {theme === "system" ? <Monitor /> : resolvedTheme === "light" ? <Sun /> : <Moon />}
      <span>{label}</span>
    </button>
  );
}
