import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { AstroProfile } from "@sizhu/core";

export type WorkspaceView = "overview" | "bazi" | "ziwei" | "transit" | "audit";
export type WorkspaceActor = "user" | "agent" | "system";

interface WorkspaceUndo {
  activeView?: WorkspaceView;
  selectedTransitDate?: string | null;
  comparedTransitDates?: string[];
}

export interface WorkspaceActivity {
  id: string;
  actor: WorkspaceActor;
  label: string;
  detail?: string;
  createdAt: string;
  undo?: WorkspaceUndo;
  undone?: boolean;
}

export interface WorkspaceState {
  profile: AstroProfile | null;
  activeView: WorkspaceView;
  selectedTransitDate: string | null;
  comparedTransitDates: string[];
  focusedIds: string[];
  activities: WorkspaceActivity[];
}

export type WorkspaceAction =
  | { type: "set-profile"; profile: AstroProfile; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "set-view"; view: WorkspaceView; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "select-transit"; date: string; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "compare-transits"; dates: string[]; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "focus-items"; ids: string[]; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "undo-activity"; id: string }
  | { type: "clear-activities" };

export const initialWorkspaceState: WorkspaceState = {
  profile: null,
  activeView: "overview",
  selectedTransitDate: null,
  comparedTransitDates: [],
  focusedIds: [],
  activities: []
};

function activityId() {
  return globalThis.crypto?.randomUUID?.() ?? `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function appendActivity(
  state: WorkspaceState,
  actor: WorkspaceActor,
  label: string,
  detail?: string,
  undo?: WorkspaceUndo
) {
  const activity: WorkspaceActivity = {
    id: activityId(),
    actor,
    label,
    detail,
    createdAt: new Date().toISOString(),
    ...(undo ? { undo } : {})
  };
  return [activity, ...state.activities].slice(0, 30);
}

function normalizeDates(dates: string[]) {
  return Array.from(new Set(dates.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)))).slice(0, 5);
}

export function workspaceReducer(state: WorkspaceState, action: WorkspaceAction): WorkspaceState {
  switch (action.type) {
    case "set-profile": {
      return {
        ...state,
        profile: action.profile,
        activeView: "overview",
        selectedTransitDate: null,
        comparedTransitDates: [],
        focusedIds: [],
        activities: appendActivity(
          state,
          action.actor,
          action.label ?? "建立出生命盘",
          action.detail ?? `${action.profile.input.name} · ${action.profile.bazi.pillars.map((pillar) => pillar.ganZhi).join(" · ")}`
        )
      };
    }
    case "set-view": {
      if (state.activeView === action.view) return state;
      return {
        ...state,
        activeView: action.view,
        activities: appendActivity(
          state,
          action.actor,
          action.label ?? "切换命盘视图",
          action.detail ?? action.view,
          { activeView: state.activeView }
        )
      };
    }
    case "select-transit": {
      return {
        ...state,
        activeView: "transit",
        selectedTransitDate: action.date,
        activities: appendActivity(
          state,
          action.actor,
          action.label ?? "查看目标日期",
          action.detail ?? action.date,
          { activeView: state.activeView, selectedTransitDate: state.selectedTransitDate }
        )
      };
    }
    case "compare-transits": {
      const dates = normalizeDates(action.dates);
      return {
        ...state,
        activeView: "transit",
        comparedTransitDates: dates,
        selectedTransitDate: dates[0] ?? state.selectedTransitDate,
        activities: appendActivity(
          state,
          action.actor,
          action.label ?? "比较多个运限",
          action.detail ?? dates.join(" · "),
          {
            activeView: state.activeView,
            selectedTransitDate: state.selectedTransitDate,
            comparedTransitDates: state.comparedTransitDates
          }
        )
      };
    }
    case "focus-items": {
      return {
        ...state,
        focusedIds: action.ids,
        activities: appendActivity(
          state,
          action.actor,
          action.label ?? "聚焦命盘结构",
          action.detail ?? action.ids.join(" · ")
        )
      };
    }
    case "undo-activity": {
      const activity = state.activities.find((item) => item.id === action.id);
      if (!activity?.undo || activity.undone) return state;
      return {
        ...state,
        ...(activity.undo.activeView !== undefined ? { activeView: activity.undo.activeView } : {}),
        ...(activity.undo.selectedTransitDate !== undefined ? { selectedTransitDate: activity.undo.selectedTransitDate } : {}),
        ...(activity.undo.comparedTransitDates !== undefined ? { comparedTransitDates: activity.undo.comparedTransitDates } : {}),
        activities: state.activities.map((item) => item.id === action.id ? { ...item, undone: true } : item)
      };
    }
    case "clear-activities":
      return { ...state, activities: [] };
    default:
      return state;
  }
}

interface WorkspaceContextValue {
  state: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, initialWorkspaceState);
  return <WorkspaceContext.Provider value={{ state, dispatch }}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return value;
}
