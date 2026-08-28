import type { AstroProfile } from "@sizhu/core";
import { HistoryRail } from "./HistoryRail";
import { ExportPanel } from "./ExportPanel";
import { AgentAccessPanel } from "./AgentAccessPanel";
import { AgentActivityRail } from "./AgentActivityRail";
import type { HistoryItem } from "@/lib/history";
import { useI18n } from "@/lib/i18n";

interface WorkbenchRightRailProps {
  profile: AstroProfile;
  history: HistoryItem[];
  onClearHistory: () => void;
  onSelectHistory: (item: HistoryItem) => void;
}

/** Persistent context rail for the generated chart workspace. */
export function WorkbenchRightRail({ profile, history, onClearHistory, onSelectHistory }: WorkbenchRightRailProps) {
  const { isEnglish } = useI18n();
  return (
    <aside className="workbench-right-rail" aria-label={isEnglish ? "Chart tools" : "命盘辅助工具"}>
      <div id="export"><ExportPanel compact profile={profile} /></div>
      <AgentAccessPanel compact />
      <HistoryRail compact items={history} onClear={onClearHistory} onSelect={onSelectHistory} />
      <AgentActivityRail />
    </aside>
  );
}
