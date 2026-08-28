import { BarChart3, CalendarDays, FileCheck2, Grid2X2, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useWorkspace, type WorkspaceView } from "@/lib/workspace";

const items: Array<{ view: WorkspaceView; icon: typeof CalendarDays; zh: string; en: string }> = [
  { view: "overview", icon: CalendarDays, zh: "出生资料", en: "Birth data" },
  { view: "bazi", icon: Grid2X2, zh: "四柱", en: "Four Pillars" },
  { view: "ziwei", icon: Sparkles, zh: "紫微", en: "Zi Wei" },
  { view: "transit", icon: BarChart3, zh: "流运", en: "Transits" },
  { view: "audit", icon: FileCheck2, zh: "计算审计", en: "Audit" }
];

export function WorkbenchModuleNav() {
  const { state, dispatch } = useWorkspace();
  const { isEnglish, t } = useI18n();

  return (
    <nav className="workbench-module-nav" aria-label={isEnglish ? "Chart modules" : "命盘模块"}>
      {items.map(({ view, icon: Icon, zh, en }, index) => (
        <button
          aria-current={state.activeView === view ? "page" : undefined}
          aria-pressed={state.activeView === view}
          className={state.activeView === view ? "is-active" : ""}
          key={view}
          onClick={() => dispatch({ type: "set-view", view, actor: "user", label: t("activity.view.user"), detail: view })}
          type="button"
        >
          <span className="workbench-module-index">{index + 1}</span>
          <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
          <span>{isEnglish ? en : zh}</span>
        </button>
      ))}
    </nav>
  );
}
