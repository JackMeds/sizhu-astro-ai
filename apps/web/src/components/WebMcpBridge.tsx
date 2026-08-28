import {
  createTransitSnapshot,
  type AstroProfile
} from "@sizhu/core";
import { getAgentTool } from "@sizhu/agent-tools";
import { useI18n } from "@/lib/i18n";
import { useWebMcpTool } from "@/lib/useWebMcpTool";
import { webMcpToolError, webMcpToolResult } from "@/lib/webMcpResult";
import { useWorkspace, type WorkspaceView } from "@/lib/workspace";
import {
  isZiweiFocusId,
  normalizeZiweiFocusIds,
  ZIWEI_FOCUS_IDS,
  type ZiweiFocusId
} from "@/lib/ziweiFocus";

interface WebMcpBridgeProps {
  onProfileCreated: (profile: AstroProfile) => void;
}

const aboutTool = getAgentTool("mingxu.about")!;
const birthChartTool = getAgentTool("mingxu.create_birth_chart")!;
const transitTool = getAgentTool("mingxu.get_transit_snapshot")!;
const compareTool = getAgentTool("mingxu.compare_transits")!;
const liurenTool = getAgentTool("mingxu.create_liuren_chart")!;
const exportTool = getAgentTool("mingxu.export_profile")!;
const birthInputSchema = birthChartTool.inputSchema;

function scrollToWorkspace(view: WorkspaceView) {
  const id = view === "transit" ? "transit-inspector" : view === "overview" ? "profile-result" : "chart";
  window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
}

function snapshotSummary(profile: AstroProfile, targetDate: string) {
  const snapshot = createTransitSnapshot(profile.input, targetDate);
  return {
    targetDate,
    luckCycle: snapshot.bazi.dayun?.ganZhi ?? null,
    annualTransit: snapshot.bazi.year?.ganZhi ?? null,
    relationFactCount: snapshot.bazi.facts.length,
    ziWeiAnnualScope: snapshot.ziwei.yearly.name || `${snapshot.ziwei.yearly.heavenlyStem}${snapshot.ziwei.yearly.earthlyBranch}`,
    warnings: profile.warnings
  };
}

export function WebMcpBridge({ onProfileCreated }: WebMcpBridgeProps) {
  const { state, dispatch } = useWorkspace();
  const { locale, isEnglish, t } = useI18n();
  const hasProfile = Boolean(state.profile);
  const productName = isEnglish ? "MingXu" : "命序";
  const technicalProductName = isEnglish ? "MingXu (AstroCopy engine)" : "命序（AstroCopy engine）";

  useWebMcpTool({
    name: aboutTool.name,
    title: isEnglish ? "About MingXu" : "关于命序",
    description: aboutTool.description,
    inputSchema: aboutTool.inputSchema,
    execute: () => webMcpToolResult({
      ...(aboutTool.executeCore() as Record<string, unknown>),
      app: productName,
      engine: technicalProductName,
      purpose: "Deterministic BaZi, Zi Wei Dou Shu, transit and Da Liu Ren computation shared by the visible page and an AI agent.",
      privacy: "Calculations and browser history remain local to the page. Data returned by a WebMCP tool is shared with the currently connected agent.",
      activeWorkspace: state.profile ? "birth-chart" : "empty",
      activeView: state.activeView,
      locale
    })
  });

  useWebMcpTool({
    name: birthChartTool.name,
    title: isEnglish ? "Create MingXu Birth Chart Workspace" : "建立命序出生命盘工作区",
    description: isEnglish
      ? "Create a deterministic BaZi and Zi Wei birth chart and render it in the visible MingXu workspace. Use this instead of calculating pillars or palaces yourself."
      : "建立确定性的八字与紫微出生命盘，并渲染到当前命序工作区；请用它代替手动计算四柱或宫位。",
    inputSchema: birthInputSchema,
    execute: (input = {}) => {
      try {
        const profile = birthChartTool.executeCore({ ...input, name: input.name || (isEnglish ? "Untitled chart" : "未命名") }) as AstroProfile;
        onProfileCreated(profile);
        window.setTimeout(() => document.getElementById("profile-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        return webMcpToolResult({
          status: "success",
          visibleChange: "A birth-chart workspace was created and opened on the page.",
          chart: {
            name: profile.input.name,
            timezone: profile.input.timezone,
            timezoneOffsetMinutes: profile.time.timezoneOffsetMinutes,
            standardLocalTime: profile.time.standard.isoLocal,
            effectiveTimeMode: profile.time.effective.mode,
            pillars: profile.bazi.pillars.map((pillar) => pillar.ganZhi)
          },
          warnings: profile.warnings
        });
      } catch (error) {
        return webMcpToolError(error);
      }
    }
  });

  useWebMcpTool({
    name: transitTool.name,
    title: isEnglish ? transitTool.title : "读取运限快照",
    description: transitTool.description,
    inputSchema: transitTool.inputSchema,
    execute: (input = {}) => {
      try {
        return webMcpToolResult(transitTool.executeCore(input));
      } catch (error) {
        return webMcpToolError(error);
      }
    }
  });

  useWebMcpTool({
    name: compareTool.name,
    title: isEnglish ? compareTool.title : "比较多个运限日期",
    description: compareTool.description,
    inputSchema: compareTool.inputSchema,
    execute: (input = {}) => {
      try {
        return webMcpToolResult(compareTool.executeCore(input));
      } catch (error) {
        return webMcpToolError(error);
      }
    }
  });

  useWebMcpTool({
    name: liurenTool.name,
    title: isEnglish ? liurenTool.title : "建立完整大六壬课盘",
    description: liurenTool.description,
    inputSchema: liurenTool.inputSchema,
    execute: (input = {}) => {
      try {
        return webMcpToolResult(liurenTool.executeCore(input));
      } catch (error) {
        return webMcpToolError(error);
      }
    }
  });

  useWebMcpTool({
    name: exportTool.name,
    title: isEnglish ? exportTool.title : "导出命序命盘",
    description: exportTool.description,
    inputSchema: exportTool.inputSchema,
    execute: (input = {}) => {
      try {
        return webMcpToolResult(exportTool.executeCore(input));
      } catch (error) {
        return webMcpToolError(error);
      }
    }
  });

  useWebMcpTool({
    name: "mingxu.ui.get_workspace_state",
    title: isEnglish ? "Get MingXu Workspace State" : "读取命序工作区状态",
    description: isEnglish
      ? "Read the concise chart identity, visible view, selected and pinned transit dates, comparison set, focus and recent human-agent activity without changing the page."
      : "读取命序当前命盘、视图、选中与固定的运限日期、比较集合、焦点以及最近的人机活动，不改变页面。",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    execute: () => webMcpToolResult({
      workspace: state.profile ? "birth-chart" : "empty",
      hasChart: Boolean(state.profile),
      chart: state.profile ? {
        name: state.profile.input.name,
        timezone: state.profile.input.timezone,
        pillars: state.profile.bazi.pillars.map((pillar) => pillar.ganZhi),
        warningCount: state.profile.warnings.length,
        warnings: state.profile.warnings
      } : null,
      activeView: state.activeView,
      selectedTransitDate: state.selectedTransitDate,
      pinnedTransitDate: state.pinnedTransitDate,
      comparedTransitDates: state.comparedTransitDates,
      focusedIds: state.focusedIds,
      recentActivities: state.activities.slice(0, 6).map((activity) => ({
        type: activity.type,
        actor: activity.actor,
        detail: activity.detail ?? null,
        undone: Boolean(activity.undone)
      })),
      locale
    })
  });

  useWebMcpTool({
    name: "mingxu.ui.inspect_chart",
    title: "Inspect Chart View",
    description: "Switch the visible birth-chart workspace to an overview, BaZi, Zi Wei, transit or calculation-audit view.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        view: { type: "string", enum: ["overview", "bazi", "ziwei", "transit", "audit"] },
        focusIds: {
          type: "array",
          minItems: 1,
          maxItems: 4,
          uniqueItems: true,
          items: { type: "string", enum: ZIWEI_FOCUS_IDS },
          description: "Optional stable semantic IDs to emphasize in the Zi Wei view."
        }
      },
      required: ["view"]
    },
    enabled: hasProfile,
    execute: (input = {}) => {
      const view = input.view as WorkspaceView;
      if (!["overview", "bazi", "ziwei", "transit", "audit"].includes(view)) {
        return webMcpToolError("Unknown chart view.");
      }
      if (input.focusIds !== undefined && !Array.isArray(input.focusIds)) {
        return webMcpToolError("focusIds must be an array of stable Zi Wei focus IDs.");
      }
      const rawFocusIds = (input.focusIds ?? []) as unknown[];
      if (rawFocusIds.some((id) => !isZiweiFocusId(id))) {
        return webMcpToolError(`Unknown focus ID. Use one of: ${ZIWEI_FOCUS_IDS.join(", ")}.`);
      }
      if (input.focusIds !== undefined && rawFocusIds.length < 1) {
        return webMcpToolError("Provide at least one focusId when focusIds is present.");
      }
      if (rawFocusIds.length > 4 || new Set(rawFocusIds).size !== rawFocusIds.length) {
        return webMcpToolError("Provide one to four unique focusIds.");
      }
      if (rawFocusIds.length > 0 && view !== "ziwei") {
        return webMcpToolError("focusIds are available only when view is ziwei.");
      }
      const focusIds = normalizeZiweiFocusIds(rawFocusIds as ZiweiFocusId[]);
      dispatch({
        type: "set-view",
        view,
        actor: "agent",
        label: t("activity.view.agent"),
        detail: t(`result.tab.${view}`)
      });
      if (input.focusIds !== undefined) {
        dispatch({
          type: "focus-items",
          ids: focusIds,
          actor: "agent",
          label: t("activity.focus.agent"),
          detail: focusIds.join(" · ")
        });
      }
      scrollToWorkspace(view);
      const visibleChanges = [`The page opened the ${view} view.`];
      if (input.focusIds !== undefined) {
        visibleChanges.push(focusIds.length
          ? `The page emphasized ${focusIds.join(", ")}.`
          : "The page cleared Zi Wei emphasis.");
      }
      return webMcpToolResult({
        status: "success",
        activeView: view,
        focusedIds: input.focusIds !== undefined ? focusIds : state.focusedIds,
        visibleChanges
      });
    }
  });

  useWebMcpTool({
    name: "mingxu.ui.inspect_transit",
    title: "Inspect One Transit Date",
    description: "Calculate one target date from the current birth chart, open the visible transit view, and select that date on the page.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        targetDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Solar date in YYYY-MM-DD format." }
      },
      required: ["targetDate"]
    },
    enabled: hasProfile,
    execute: (input = {}) => {
      if (!state.profile) return webMcpToolError("Create a birth chart first.");
      const targetDate = typeof input.targetDate === "string" ? input.targetDate : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return webMcpToolError("targetDate must be YYYY-MM-DD.");
      try {
        const summary = snapshotSummary(state.profile, targetDate);
        dispatch({
          type: "select-transit",
          date: targetDate,
          actor: "agent",
          label: t("activity.transit.agent"),
          detail: targetDate
        });
        scrollToWorkspace("transit");
        return webMcpToolResult({ status: "success", visibleChange: `The page selected ${targetDate} in the transit view.`, summary });
      } catch (error) {
        return webMcpToolError(error);
      }
    }
  });

  useWebMcpTool({
    name: "mingxu.ui.compare_transits",
    title: "Compare Transit Dates",
    description: "Compare two to five target dates from the current birth chart and render comparison cards in the visible transit workspace.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        targetDates: {
          type: "array",
          minItems: 2,
          maxItems: 5,
          uniqueItems: true,
          items: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }
        }
      },
      required: ["targetDates"]
    },
    enabled: hasProfile,
    execute: (input = {}) => {
      if (!state.profile) return webMcpToolError("Create a birth chart first.");
      if (!Array.isArray(input.targetDates)) {
        return webMcpToolError("targetDates must be an array of two to five unique YYYY-MM-DD dates.");
      }
      const dates = input.targetDates;
      if (
        dates.length < 2
        || dates.length > 5
        || dates.some((value) => typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
        || new Set(dates).size !== dates.length
      ) {
        return webMcpToolError("Provide two to five unique YYYY-MM-DD dates.");
      }
      try {
        const summaries = dates.map((date) => snapshotSummary(state.profile as AstroProfile, date));
        dispatch({
          type: "compare-transits",
          dates,
          actor: "agent",
          label: t("activity.compare.agent"),
          detail: dates.join(" · ")
        });
        scrollToWorkspace("transit");
        return webMcpToolResult({
          status: "success",
          visibleChange: "The page rendered a side-by-side transit comparison.",
          dates: summaries
        });
      } catch (error) {
        return webMcpToolError(error);
      }
    }
  });

  return null;
}
