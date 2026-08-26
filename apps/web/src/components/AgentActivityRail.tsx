import { Bot, RotateCcw, Trash2, UserRound } from "lucide-react";
import { useWorkspace } from "@/lib/workspace";

function formatActivityTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "";
  }
}

export function AgentActivityRail() {
  const { state, dispatch } = useWorkspace();
  if (!state.activities.length) return null;

  return (
    <aside className="agent-activity-rail" aria-label="人与 Agent 的工作区操作记录">
      <header>
        <div><Bot size={16} /><strong>Workspace activity</strong></div>
        <button type="button" aria-label="清空操作记录" onClick={() => dispatch({ type: "clear-activities" })}><Trash2 size={14} /></button>
      </header>
      <div className="agent-activity-list">
        {state.activities.map((activity) => (
          <article className={activity.undone ? "is-undone" : ""} data-actor={activity.actor} key={activity.id}>
            <span className="agent-activity-icon">
              {activity.actor === "agent" ? <Bot size={14} /> : <UserRound size={14} />}
            </span>
            <div>
              <small>{activity.actor === "agent" ? "Agent" : activity.actor === "user" ? "You" : "System"} · {formatActivityTime(activity.createdAt)}</small>
              <strong>{activity.label}</strong>
              {activity.detail ? <p>{activity.detail}</p> : null}
            </div>
            {activity.undo && !activity.undone ? (
              <button
                className="agent-activity-undo"
                type="button"
                title="撤销这次页面状态变化"
                onClick={() => dispatch({ type: "undo-activity", id: activity.id })}
              >
                <RotateCcw size={13} />
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </aside>
  );
}
