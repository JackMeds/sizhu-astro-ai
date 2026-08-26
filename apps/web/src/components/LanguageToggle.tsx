import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function LanguageToggle() {
  const { isEnglish, toggleLocale, t } = useI18n();
  return (
    <button
      className="language-toggle"
      type="button"
      title={t("language.switch")}
      aria-label={t("language.switch")}
      onClick={toggleLocale}
    >
      <Languages size={14} />
      <span>{isEnglish ? "中文" : "EN"}</span>
    </button>
  );
}
