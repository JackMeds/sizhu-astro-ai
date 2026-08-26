import {
  createAstroProfile,
  createTransitSnapshot,
  type AstroInput,
  type AstroProfile
} from "@sizhu/core";
import { getBrowserTimeZone } from "@/lib/timezone";
import { useWebMcpTool } from "@/lib/useWebMcpTool";
import { useWorkspace, type WorkspaceView } from "@/lib/workspace";

interface WebMcpBridgeProps {
  onProfileCreated: (profile: AstroProfile) => void;
}

const locationProperties = {
  name: { type: "string", description: "Human-readable birthplace name." },
  longitude: { type: "number", minimum: -180, maximum: 180 },
  latitude: { type: "number", minimum: -90, maximum: 90 }
};

const birthInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", default: "Untitled chart" },
    gender: { type: "string", enum: ["male", "female"] },
    birthDateTime: {
      type: "string",
      description: "Birth wall time or ISO datetime, for example 1995-03-12T14:20 or 1995-03-12T14:20:00+08:00."
    },
    calendar: { type: "string", enum: ["solar", "lunar"], default: "solar" },
    timezone: {
      type: "string",
      description: "IANA timezone for a wall time without an explicit numeric offset, for example Asia/Shanghai or America/Los_Angeles."
    },
    trueSolarTime: { type: "string", enum: ["none", "longitude", "apparent"], default: "none" },
    location: { type: "object", additionalProperties: false, properties: locationProperties },
    sect: { type: "integer", enum: [1, 2], default: 1 }
  },
  required: ["birthDateTime", "gender"]
};

function normalizeTimeMode(input: unknown): AstroInput["trueSolarTime"] {
  return input === "apparent" ? "apparent" : input === "longitude" ? "longitude" : "none";
}

function normalizeLocation(input: unknown): AstroInput["location"] {
  return typeof input === "object" && input !== null ? input as AstroInput["location"] : undefined;
}

function normalizeBirthInput(input: Record<string, unknown> = {}): AstroInput {
  return {
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : "Untitled chart",
    gender: input.gender === "female" ? "female" : "male",
    birthDateTime: typeof input.birthDateTime === "string" ? input.birthDateTime : "",
    calendar: input.calendar === "lunar" ? "lunar" : "solar",
    timezone: typeof input.timezone === "string" && input.timezone.trim()
      ? input.timezone.trim()
      : getBrowserTimeZone(),
    trueSolarTime: normalizeTimeMode(input.trueSolarTime),
    location: normalizeLocation(input.location),
    sect: input.sect === 2 ? 2 : 1
  };
}

function toolResult(value: unknown) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }]
  };
}

function toolError(error: unknown) {
  return {
    isError: true,
    content: [{
      type: "text",
      text: error instanceof Error ? error.message : String(error)
    }]
  };
}

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
  const hasProfile = Boolean(state.profile);

  useWebMcpTool({
    name: "astrocopy.about",
    title: "About AstroCopy",
    description: "Describe AstroCopy's deterministic Chinese metaphysics workspace, privacy model, and active collaboration tools.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    execute: () => toolResult({
      app: "AstroCopy",
      purpose: "Deterministic BaZi, Zi Wei Dou Shu, transit and Da Liu Ren computation shared by the visible page and an AI agent.",
      privacy: "Calculations and browser history remain local to the page. Data returned by a WebMCP tool is shared with the currently connected agent.",
      activeWorkspace: state.profile ? "birth-chart" : "empty",
      activeView: state.activeView
    })
  });

  useWebMcpTool({
    name: "astrocopy.create_birth_chart",
    title: "Create Birth Chart Workspace",
    description: "Create a deterministic BaZi and Zi Wei birth chart and render it in the visible AstroCopy workspace. Use this instead of calculating pillars or palaces yourself.",
    inputSchema: birthInputSchema,
    execute: (input = {}) => {
      try {
        const profile = createAstroProfile(normalizeBirthInput(input));
        onProfileCreated(profile);
        window.setTimeout(() => document.getElementById("profile-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        return toolResult({
          status: "success",
          visibleChange: "A birth-chart workspace was created and opened on the page.",
          chart: {
            name: profile.input.name,
            timezone: profile.input.timezone,
            effectiveTimeMode: profile.time.effective.label,
            pillars: profile.bazi.pillars.map((pillar) => pillar.ganZhi)
          },
          warnings: profile.warnings
        });
      } catch (error) {
        return toolError(error);
      }
    }
  });

  useWebMcpTool({
    name: "astrocopy.get_workspace_state",
    title: "Get AstroCopy Workspace State",
    description: "Read the chart, view, selected transit and comparison dates currently visible in AstroCopy without changing the page.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    execute: () => toolResult({
      hasChart: Boolean(state.profile),
      chart: state.profile ? {
        name: state.profile.input.name,
        timezone: state.profile.input.timezone,
        pillars: state.profile.bazi.pillars.map((pillar) => pillar.ganZhi),
        warnings: state.profile.warnings
      } : null,
      activeView: state.activeView,
      selectedTransitDate: state.selectedTransitDate,
      comparedTransitDates: state.comparedTransitDates,
      focusedIds: state.focusedIds
    })
  });

  useWebMcpTool({
    name: "astrocopy.inspect_chart",
    title: "Inspect Chart View",
    description: "Switch the visible birth-chart workspace to an overview, BaZi, Zi Wei, transit or calculation-audit view.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        view: { type: "string", enum: ["overview", "bazi", "ziwei", "transit", "audit"] }
      },
      required: ["view"]
    },
    enabled: hasProfile,
    execute: (input = {}) => {
      const view = input.view as WorkspaceView;
      if (!["overview", "bazi", "ziwei", "transit", "audit"].includes(view)) {
        return toolError("Unknown chart view.");
      }
      dispatch({
        type: "set-view",
        view,
        actor: "agent",
        label: "Agent switched the chart view",
        detail: view
      });
      scrollToWorkspace(view);
      return toolResult({ status: "success", activeView: view, visibleChange: `The page opened the ${view} view.` });
    }
  });

  useWebMcpTool({
    name: "astrocopy.inspect_transit",
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
      if (!state.profile) return toolError("Create a birth chart first.");
      const targetDate = typeof input.targetDate === "string" ? input.targetDate : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return toolError("targetDate must be YYYY-MM-DD.");
      try {
        const summary = snapshotSummary(state.profile, targetDate);
        dispatch({
          type: "select-transit",
          date: targetDate,
          actor: "agent",
          label: "Agent selected a transit date",
          detail: targetDate
        });
        scrollToWorkspace("transit");
        return toolResult({ status: "success", visibleChange: `The page selected ${targetDate} in the transit view.`, summary });
      } catch (error) {
        return toolError(error);
      }
    }
  });

  useWebMcpTool({
    name: "astrocopy.compare_transits",
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
      if (!state.profile) return toolError("Create a birth chart first.");
      const dates = Array.isArray(input.targetDates)
        ? input.targetDates.filter((value): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))
        : [];
      const uniqueDates = Array.from(new Set(dates)).slice(0, 5);
      if (uniqueDates.length < 2) return toolError("Provide two to five unique YYYY-MM-DD dates.");
      try {
        const summaries = uniqueDates.map((date) => snapshotSummary(state.profile as AstroProfile, date));
        dispatch({
          type: "compare-transits",
          dates: uniqueDates,
          actor: "agent",
          label: "Agent compared transit dates",
          detail: uniqueDates.join(" · ")
        });
        scrollToWorkspace("transit");
        return toolResult({
          status: "success",
          visibleChange: "The page rendered a side-by-side transit comparison.",
          dates: summaries
        });
      } catch (error) {
        return toolError(error);
      }
    }
  });

  return null;
}
