import type { HistoryItem } from "@/lib/history";
import { Trash2 } from "lucide-react";

interface HistoryRailProps {
  items: HistoryItem[];
  onClear: () => void;
  onSelect: (item: HistoryItem) => void;
}

export function HistoryRail({ items, onClear, onSelect }: HistoryRailProps) {
  return (
    <section className="history-rail" aria-label="历史命盘">
      <header>
        <div>
          <span>本机历史记录</span>
          <small>自动保存在当前浏览器，点击可恢复命盘</small>
        </div>
        {items.length ? (
          <button className="history-clear" onClick={onClear} type="button">
            <Trash2 size={14} />
            清空
          </button>
        ) : null}
      </header>
      <div>
        {items.length ? (
          items.map((item) => (
            <button key={item.id} onClick={() => onSelect(item)} type="button">
              <strong>{item.name}</strong>
              <em>{item.pillars}</em>
              <small>日主 {item.dayMaster}</small>
            </button>
          ))
        ) : (
          <p>生成第一张命盘后，这里会出现最近 12 条记录。</p>
        )}
      </div>
    </section>
  );
}
