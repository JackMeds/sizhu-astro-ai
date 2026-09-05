import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { AstroProfile } from "@mingxu/core";

export type WorkspaceView = "overview" | "bazi" | "ziwei" | "transit" | "audit";
export type WorkspaceActor = "user" | "agent" | "system";

interface WorkspaceUndo {
  activeView?: WorkspaceView;
  selectedTransitDate?: string | null;
  pinnedTransitDate?: string | null;
  comparedTransitDates?: string[];
  focusedIds?: string[];
}

export type WorkspaceActivityType =
  | "set-profile"
  | "set-view"
  | "select-transit"
  | "pin-transit"
  | "compare-transits"
  | "focus-items";

export interface WorkspaceActivity {
  id: string;
  type: WorkspaceActivityType;
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
  analysisQuestion: string;
  selectedTransitDate: string | null;
  pinnedTransitDate: string | null;
  comparedTransitDates: string[];
  focusedIds: string[];
  activities: WorkspaceActivity[];
}

export type WorkspaceAction =
  | { type: "set-profile"; profile: AstroProfile; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "set-view"; view: WorkspaceView; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "select-transit"; date: string; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "pin-transit"; date: string | null; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "compare-transits"; dates: string[]; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "focus-items"; ids: string[]; actor: WorkspaceActor; label?: string; detail?: string }
  | { type: "set-analysis-question"; question: string }
  | { type: "undo-activity"; id: string }
  | { type: "clear-activities" };

export const initialWorkspaceState: WorkspaceState = {
  profile: null,
  activeView: "overview",
  analysisQuestion: "",
  selectedTransitDate: null,
  pinnedTransitDate: null,
  comparedTransitDates: [],
  focusedIds: [],
  activities: []
};

function activityId() {
  return globalThis.crypto?.randomUUID?.() ?? `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function appendActivity(
  state: WorkspaceState,
  type: WorkspaceActivityType,
  actor: WorkspaceActor,
  label: string,
  detail?: string,
  undo?: WorkspaceUndo
) {
  const activity: WorkspaceActivity = {
    id: activityId(),
    type,
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
        activeView: "bazi",
        analysisQuestion: "",
        selectedTransitDate: null,
        pinnedTransitDate: null,
        comparedTransitDates: [],
        focusedIds: [],
        activities: appendActivity(
          state,
          "set-profile",
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
          "set-view",
          action.actor,
          action.label ?? "切换命盘视图",
          action.detail ?? action.view,
          { activeView: state.activeView }
        )
      };
    }
    case "set-analysis-question": {
      const analysisQuestion = action.question.slice(0, 500);
      if (analysisQuestion === state.analysisQuestion) return state;
      return { ...state, analysisQuestion };
    }
    case "select-transit": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(action.date)) return state;
      if (state.activeView === "transit" && state.selectedTransitDate === action.date) return state;
      return {
        ...state,
        activeView: "transit",
        selectedTransitDate: action.date,
        activities: appendActivity(
          state,
          "select-transit",
          action.actor,
          action.label ?? "查看目标日期",
          action.detail ?? action.date,
          { activeView: state.activeView, selectedTransitDate: state.selectedTransitDate }
        )
      };
    }
    case "pin-transit": {
      if (action.date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(action.date)) return state;
      if (state.pinnedTransitDate === action.date) return state;
      return {
        ...state,
        activeView: action.date ? "transit" : state.activeView,
        selectedTransitDate: action.date ?? state.selectedTransitDate,
        pinnedTransitDate: action.date,
        activities: appendActivity(
          state,
          "pin-transit",
          action.actor,
          action.label ?? (action.date ? "固定目标日期" : "取消固定目标日期"),
          action.detail ?? action.date ?? state.pinnedTransitDate ?? undefined,
          {
            activeView: state.activeView,
            selectedTransitDate: state.selectedTransitDate,
            pinnedTransitDate: state.pinnedTransitDate
          }
        )
      };
    }
    case "compare-transits": {
      const dates = normalizeDates(action.dates);
      if (dates.length < 2) return state;
      const selectedTransitDate = state.pinnedTransitDate && dates.includes(state.pinnedTransitDate)
        ? state.pinnedTransitDate
        : dates[0] ?? state.selectedTransitDate;
      return {
        ...state,
        activeView: "transit",
        comparedTransitDates: dates,
        selectedTransitDate,
        activities: appendActivity(
          state,
          "compare-transits",
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
      const ids = Array.from(new Set(action.ids.filter(Boolean))).slice(0, 4);
      if (ids.length === state.focusedIds.length && ids.every((id, index) => id === state.focusedIds[index])) return state;
      return {
        ...state,
        focusedIds: ids,
        activities: appendActivity(
          state,
          "focus-items",
          action.actor,
          action.label ?? "聚焦命盘结构",
          action.detail ?? ids.join(" · "),
          { focusedIds: state.focusedIds }
        )
      };
    }
    case "undo-activity": {
      const activityIndex = state.activities.findIndex((item) => item.id === action.id);
      const activity = state.activities[activityIndex];
      if (!activity?.undo || activity.undone) return state;
      const newerActivities = state.activities.slice(0, activityIndex).filter((item) => !item.undone);
      const canRestore = (field: keyof WorkspaceUndo) => !newerActivities.some((item) => item.undo?.[field] !== undefined);
      return {
        ...state,
        ...(activity.undo.activeView !== undefined && canRestore("activeView") ? { activeView: activity.undo.activeView } : {}),
        ...(activity.undo.selectedTransitDate !== undefined && canRestore("selectedTransitDate") ? { selectedTransitDate: activity.undo.selectedTransitDate } : {}),
        ...(activity.undo.pinnedTransitDate !== undefined && canRestore("pinnedTransitDate") ? { pinnedTransitDate: activity.undo.pinnedTransitDate } : {}),
        ...(activity.undo.comparedTransitDates !== undefined && canRestore("comparedTransitDates") ? { comparedTransitDates: activity.undo.comparedTransitDates } : {}),
        ...(activity.undo.focusedIds !== undefined && canRestore("focusedIds") ? { focusedIds: activity.undo.focusedIds } : {}),
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
