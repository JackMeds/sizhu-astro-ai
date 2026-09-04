import {
  createAstroProfile,
  createCompleteLiurenChart,
  createTransitSnapshot,
  type AstroInput,
  type AstroProfile,
  type LiurenCompleteInput,
  type LiurenSessionInput
} from "@mingxu/core";
import { exportProfile, type ExportFormat, type PromptMode, type PromptSystem } from "@mingxu/prompt";

export type JsonSchema = Record<string, unknown>;
export type AgentToolInput = Record<string, unknown>;
export type CanonicalAgentToolName =
  | "mingxu.about"
  | "mingxu.create_birth_chart"
  | "mingxu.get_transit_snapshot"
  | "mingxu.compare_transits"
  | "mingxu.create_liuren_chart"
  | "mingxu.export_profile";

export interface AgentToolDefinition {
  name: CanonicalAgentToolName;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  executeCore: (input?: AgentToolInput) => unknown;
}

export const MINGXU_REPOSITORY = "https://github.com/JackMeds/sizhu-astro-ai";
export const MINGXU_WEB_URL = "https://astrocopy.jackmeds.top/";

const locationProperties: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", description: "Human-readable birthplace or casting location." },
    longitude: { type: "number", minimum: -180, maximum: 180 },
    latitude: { type: "number", minimum: -90, maximum: 90 }
  }
};

const birthProperties: JsonSchema = {
  name: { type: "string", default: "Untitled chart" },
  gender: { type: "string", enum: ["male", "female"] },
  birthDateTime: {
    type: "string",
    description: "Birth wall time or ISO datetime, for example 1995-03-12T14:20:00+08:00."
  },
  calendar: { type: "string", enum: ["solar", "lunar"], default: "solar" },
  timezone: {
    type: "string",
    default: "Asia/Shanghai",
    description: "IANA timezone for a wall time without an explicit numeric offset."
  },
  trueSolarTime: { type: "string", enum: ["none", "longitude", "apparent"], default: "none" },
  location: locationProperties,
  sect: { type: "integer", enum: [1, 2], default: 1 }
};

const birthSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: birthProperties,
  required: ["birthDateTime", "gender"]
};

const transitSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...birthProperties,
    targetDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Target solar date YYYY-MM-DD." },
    targetHour: { type: "integer", minimum: 0, maximum: 23 }
  },
  required: ["birthDateTime", "gender", "targetDate"]
};

const compareSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...birthProperties,
    targetDates: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      uniqueItems: true,
      items: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      description: "Two to five unique target solar dates in YYYY-MM-DD format."
    }
  },
  required: ["birthDateTime", "gender", "targetDates"]
};

const liurenProperties: JsonSchema = {
  dateTime: {
    type: "string",
    description: "Casting/base datetime with explicit offset, for example 2026-08-15T09:30:00+08:00."
  },
  timezone: { type: "string", default: "Asia/Shanghai", description: "IANA timezone when dateTime has no numeric offset." },
  trueSolarTime: { type: "string", enum: ["none", "longitude", "apparent"], default: "none" },
  location: locationProperties,
  question: { type: "string", maxLength: 2000, description: "Optional concrete divination question." },
  castingMethod: { type: "string", enum: ["time", "number", "branch"], default: "time" },
  castingNumber: { type: "integer", minimum: 1, description: "Positive reported number; mapped cyclically with 1=子 through 12=亥." },
  castingBranch: { type: "string", enum: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] }
};

const liurenSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: liurenProperties,
  required: ["dateTime"]
};

const exportSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...birthProperties,
    format: { type: "string", enum: ["json", "markdown", "txt"], default: "markdown" },
    locale: { type: "string", enum: ["zh-CN", "en"], default: "zh-CN" },
    system: { type: "string", enum: ["combined", "bazi", "ziwei"], default: "combined" },
    mode: { type: "string", enum: ["general", "relationship", "career", "wealth", "health", "yearly", "xp"], default: "general" },
    question: { type: "string", maxLength: 500, description: "Optional specific question the analysis must answer directly." },
    targetDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$", description: "Optional target date for dynamic BaZi and Zi Wei cycles." },
    comparisonDates: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      uniqueItems: true,
      items: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" }
    }
  },
  required: ["birthDateTime", "gender"]
};

const emptySchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {}
};

function normalizeTimeMode(input: unknown): AstroInput["trueSolarTime"] {
  return input === "apparent" ? "apparent" : input === "longitude" ? "longitude" : "none";
}

function normalizeLocation(input: unknown): AstroInput["location"] {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return undefined;
  const value = input as Record<string, unknown>;
  return {
    name: typeof value.name === "string" && value.name.trim() ? value.name.trim() : undefined,
    longitude: typeof value.longitude === "number" ? value.longitude : undefined,
    latitude: typeof value.latitude === "number" ? value.latitude : undefined
  };
}

export function normalizeAstroInput(input: AgentToolInput = {}, fallbackName = "Untitled chart"): AstroInput {
  return {
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : fallbackName,
    gender: input.gender === "female" ? "female" : "male",
    birthDateTime: typeof input.birthDateTime === "string" ? input.birthDateTime : "",
    calendar: input.calendar === "lunar" ? "lunar" : "solar",
    timezone: typeof input.timezone === "string" && input.timezone.trim() ? input.timezone.trim() : "Asia/Shanghai",
    trueSolarTime: normalizeTimeMode(input.trueSolarTime),
    location: normalizeLocation(input.location),
    sect: input.sect === 2 ? 2 : 1
  };
}

export function normalizeLiurenInput(input: AgentToolInput = {}): LiurenSessionInput {
  const question = typeof input.question === "string" ? input.question.trim() : "";
  if (question.length > 2000) throw new Error("question must be at most 2000 characters.");
  return {
    dateTime: typeof input.dateTime === "string" ? input.dateTime : "",
    timezone: typeof input.timezone === "string" && input.timezone.trim() ? input.timezone.trim() : "Asia/Shanghai",
    trueSolarTime: normalizeTimeMode(input.trueSolarTime),
    location: normalizeLocation(input.location),
    question: question || undefined
  };
}

export function normalizeCompleteLiurenInput(input: AgentToolInput = {}): LiurenCompleteInput {
  return {
    ...normalizeLiurenInput(input),
    castingMethod: input.castingMethod === "number" ? "number" : input.castingMethod === "branch" ? "branch" : "time",
    castingNumber: typeof input.castingNumber === "number" ? input.castingNumber : undefined,
    castingBranch: typeof input.castingBranch === "string" ? input.castingBranch : undefined
  };
}

function assertDate(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must be a YYYY-MM-DD date.`);
  }
}

function profile(input: AgentToolInput) {
  return createAstroProfile(normalizeAstroInput(input));
}

const canonicalTools: AgentToolDefinition[] = [
  {
    name: "mingxu.about",
    title: "About MingXu / 命序",
    description: "Describe MingXu's deterministic BaZi, Zi Wei Dou Shu, transit, true-solar-time and Da Liu Ren capabilities, privacy boundary, and canonical tool names.",
    inputSchema: emptySchema,
    executeCore: () => ({
      app: "命序",
      englishName: "MingXu",
      engine: "AstroCopy engine",
      repository: MINGXU_REPOSITORY,
      website: MINGXU_WEB_URL,
      purpose: "Deterministic Chinese-metaphysics computation for humans and AI agents; interpretation remains outside the calculation layer.",
      capabilities: ["bazi", "ziwei", "transits", "true_solar_time", "da_liu_ren", "structured_output"],
      tools: canonicalTools.map((tool) => tool.name),
      privacy: "The server is stateless and does not persist birth data, casting data, questions, charts, or conversation state."
    })
  },
  {
    name: "mingxu.create_birth_chart",
    title: "Create MingXu Birth Chart",
    description: "Generate a deterministic BaZi and Zi Wei birth chart. Use this instead of calculating pillars or palaces yourself; preserve the returned time semantics and warnings.",
    inputSchema: birthSchema,
    executeCore: (input = {}) => profile(input)
  },
  {
    name: "mingxu.get_transit_snapshot",
    title: "Get Transit Snapshot",
    description: "For one target date, return matching BaZi luck-cycle and annual relation facts plus normalized Zi Wei dynamic scopes. The target date must be YYYY-MM-DD.",
    inputSchema: transitSchema,
    executeCore: (input = {}) => {
      assertDate(input.targetDate, "targetDate");
      const { targetDate, targetHour, ...birthInput } = input;
      return createTransitSnapshot(
        normalizeAstroInput(birthInput),
        targetDate,
        typeof targetHour === "number" ? targetHour : undefined
      );
    }
  },
  {
    name: "mingxu.compare_transits",
    title: "Compare Transit Snapshots",
    description: "Compute two to five unique target dates from the same birth input and return a compact, deterministic comparison. Use targetDates, not a singular targetDate.",
    inputSchema: compareSchema,
    executeCore: (input = {}) => {
      if (!Array.isArray(input.targetDates) || input.targetDates.length < 2 || input.targetDates.length > 5) {
        throw new Error("targetDates must contain two to five dates.");
      }
      const dates = input.targetDates;
      if (dates.some((date) => typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
        throw new Error("targetDates must contain only YYYY-MM-DD dates.");
      }
      if (new Set(dates).size !== dates.length) throw new Error("targetDates must be unique.");
      const { targetDates: _targetDates, ...birthInput } = input;
      const normalized = normalizeAstroInput(birthInput);
      return {
        format: "mingxu-transit-comparison",
        formatVersion: "1.0.0",
        birth: {
          name: normalized.name,
          timezone: normalized.timezone,
          trueSolarTime: normalized.trueSolarTime
        },
        snapshots: dates.map((date) => createTransitSnapshot(normalized, date))
      };
    }
  },
  {
    name: "mingxu.create_liuren_chart",
    title: "Create Complete Da Liu Ren Chart",
    description: "Generate a complete Da Liu Ren chart from time, reported-number, or selected-branch casting. Returns plates, generals, Four Lessons, Three Transmissions, voids, patterns, source-gated ShenSha, warnings, and cross-check evidence; it does not interpret the divination.",
    inputSchema: liurenSchema,
    executeCore: (input = {}) => createCompleteLiurenChart(normalizeCompleteLiurenInput(input))
  },
  {
    name: "mingxu.export_profile",
    title: "Export MingXu Profile",
    description: "Generate JSON, Markdown, or plain-text output from a deterministic MingXu BaZi and Zi Wei profile for saving or passing to another AI.",
    inputSchema: exportSchema,
    executeCore: (input = {}) => {
      const format: ExportFormat = input.format === "json" || input.format === "txt" ? input.format : "markdown";
      const chart = profile(input) as AstroProfile;
      const modes: PromptMode[] = ["general", "relationship", "career", "wealth", "health", "yearly", "xp"];
      const systems: PromptSystem[] = ["combined", "bazi", "ziwei"];
      const mode = modes.includes(input.mode as PromptMode) ? input.mode as PromptMode : "general";
      const system = systems.includes(input.system as PromptSystem) ? input.system as PromptSystem : "combined";
      const targetTransit = typeof input.targetDate === "string" ? createTransitSnapshot(chart.input, input.targetDate) : undefined;
      const comparisonDates = Array.isArray(input.comparisonDates) ? input.comparisonDates.filter((item): item is string => typeof item === "string").slice(0, 5) : [];
      const comparisonTransits = mode === "yearly" && comparisonDates.length >= 2
        ? comparisonDates.map((date) => createTransitSnapshot(chart.input, date))
        : undefined;
      return {
        format,
        text: exportProfile(chart, format, {
          locale: input.locale === "en" ? "en" : "zh-CN",
          system,
          mode,
          ...(typeof input.question === "string" && input.question.trim() ? { question: input.question.trim().slice(0, 500) } : {}),
          ...(targetTransit ? { targetTransit } : {}),
          ...(comparisonTransits ? { comparisonTransits } : {})
        })
      };
    }
  }
];

export const AGENT_TOOL_ALIASES: Record<string, CanonicalAgentToolName> = {
  "astrocopy.about": "mingxu.about",
  "astrocopy.create_birth_chart": "mingxu.create_birth_chart",
  "astrocopy.get_transit_snapshot": "mingxu.get_transit_snapshot",
  "astrocopy.compare_transits": "mingxu.compare_transits",
  "astrocopy.create_liuren_chart": "mingxu.create_liuren_chart",
  "astrocopy.export_profile": "mingxu.export_profile",
  "sizhu.about": "mingxu.about",
  "sizhu.create_profile": "mingxu.create_birth_chart",
  "sizhu.create_bazi_profile": "mingxu.create_birth_chart",
  "sizhu.create_ziwei_profile": "mingxu.create_birth_chart",
  "sizhu.get_transit_snapshot": "mingxu.get_transit_snapshot",
  "sizhu.create_liuren_chart": "mingxu.create_liuren_chart",
  "sizhu.create_ai_prompt": "mingxu.export_profile",
  "sizhu.export_profile_markdown": "mingxu.export_profile"
};

export const AGENT_TOOL_NAMES = canonicalTools.map((tool) => tool.name);

export function getAgentTool(name: string): AgentToolDefinition | undefined {
  const canonicalName = AGENT_TOOL_ALIASES[name] ?? name;
  return canonicalTools.find((tool) => tool.name === canonicalName);
}

export function getAgentTools(options: { includeAliases?: boolean } = {}): AgentToolDefinition[] {
  if (!options.includeAliases) return [...canonicalTools];
  const aliases = Object.entries(AGENT_TOOL_ALIASES).map(([name, canonicalName]) => {
    const tool = canonicalTools.find((item) => item.name === canonicalName) as AgentToolDefinition;
    return {
      ...tool,
      name,
      description: `[Deprecated alias for ${canonicalName}] ${tool.description}`
    } as AgentToolDefinition;
  });
  return [...canonicalTools, ...aliases];
}
