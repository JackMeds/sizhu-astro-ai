import type { HistoryItem } from "@/lib/history";
import { useI18n } from "@/lib/i18n";
import { Trash2 } from "lucide-react";

interface HistoryRailProps {
  items: HistoryItem[];
  onClear: () => void;
  onSelect: (item: HistoryItem) => void;
}

export function HistoryRail({ items, onClear, onSelect }: HistoryRailProps) {
  const { t } = useI18n();
  return (
    <section className="history-rail" aria-label={t("history.aria")}>
      <header>
        <div><span>{t("history.title")}</span><small>{t("history.help")}</small></div>
        {items.length ? (
          <button className="history-clear" onClick={onClear} type="button">
            <Trash2 size={14} />{t("history.clear")}
          </button>
        ) : null}
      </header>
      <div>
        {items.length ? (
          items.map((item) => (
            <button key={item.id} onClick={() => onSelect(item)} type="button">
              <strong>{item.name}</strong>
              <em>{item.pillars}</em>
              <small>{t("history.dayMaster", { value: item.dayMaster })}</small>
            </button>
          ))
        ) : <p>{t("history.empty")}</p>}
      </div>
    </section>
  );
}
