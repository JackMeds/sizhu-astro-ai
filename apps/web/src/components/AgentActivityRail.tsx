import { Bot, RotateCcw, Trash2, UserRound } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";

function formatActivityTime(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "";
  }
}

export function AgentActivityRail() {
  const { state, dispatch } = useWorkspace();
  const { locale, t } = useI18n();
  if (!state.activities.length) return null;

  return (
    <aside className="agent-activity-rail" aria-label={t("activity.title")}>
      <header>
        <div><Bot size={16} /><strong>{t("activity.title")}</strong></div>
        <button type="button" aria-label={t("activity.clear")} title={t("activity.clear")} onClick={() => dispatch({ type: "clear-activities" })}>
          <Trash2 size={14} />
        </button>
      </header>
      <div className="agent-activity-list">
        {state.activities.map((activity) => (
          <article
            className={activity.undone ? "is-undone" : ""}
            data-activity-id={activity.id}
            data-activity-type={activity.type}
            data-actor={activity.actor}
            data-undone={activity.undone || undefined}
            key={activity.id}
          >
            <span className="agent-activity-icon">
              {activity.actor === "agent" ? <Bot size={14} /> : <UserRound size={14} />}
            </span>
            <div>
              <small>
                {activity.actor === "agent"
                  ? t("activity.agent")
                  : activity.actor === "user"
                    ? t("activity.you")
                    : t("activity.system")}
                {" · "}{formatActivityTime(activity.createdAt, locale)}
              </small>
              <strong>{activity.label}</strong>
              {activity.detail ? <p>{activity.detail}</p> : null}
            </div>
            {activity.undo && !activity.undone ? (
              <button
                className="agent-activity-undo"
                data-action="undo-activity"
                type="button"
                aria-label={t("activity.undo")}
                title={t("activity.undo")}
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
