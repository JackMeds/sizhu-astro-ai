import { createAstroProfile, type AstroInput, type AstroProfile } from "@sizhu/core";
import { buildPrompt, type PromptFormat, type PromptMode } from "./promptBuilder";

type ToolDefinition = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input?: Record<string, unknown>) => unknown | Promise<unknown>;
};

type ModelContextLike = {
  registerTool?: (tool: ToolDefinition, options?: Record<string, unknown>) => unknown;
  unregisterTool?: (name: string) => unknown;
};

const TOOL_NAMES = [
  "sizhu.about",
  "sizhu.create_profile",
  "sizhu.create_ai_prompt",
  "sizhu.get_current_chart"
];

let webMcpRegistered = false;

const birthInfoSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", default: "未命名" },
    gender: { type: "string", enum: ["male", "female"] },
    birthDateTime: { type: "string", description: "ISO-like birth datetime, e.g. 1995-03-12T14:20:00+08:00" },
    calendar: { type: "string", enum: ["solar", "lunar"], default: "solar" },
    timezone: { type: "string", default: "Asia/Shanghai" },
    trueSolarTime: { type: "string", enum: ["none", "longitude"], default: "none" },
    location: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        longitude: { type: "number", minimum: -180, maximum: 180 },
        latitude: { type: "number", minimum: -90, maximum: 90 }
      }
    },
    sect: { type: "integer", enum: [1, 2], default: 1 }
  },
  required: ["birthDateTime", "gender"]
};

function getModelContext(): ModelContextLike | null {
  const documentContext = (globalThis.document as unknown as { modelContext?: ModelContextLike } | undefined)?.modelContext;
  const navigatorContext = (globalThis.navigator as unknown as { modelContext?: ModelContextLike } | undefined)?.modelContext;
  return documentContext ?? navigatorContext ?? null;
}

function normalizeInput(input: Record<string, unknown> = {}): AstroInput {
  return {
    name: typeof input.name === "string" && input.name.trim() ? input.name : "未命名",
    gender: input.gender === "male" ? "male" : "female",
    birthDateTime: typeof input.birthDateTime === "string" ? input.birthDateTime : "",
    calendar: input.calendar === "lunar" ? "lunar" : "solar",
    timezone: typeof input.timezone === "string" ? input.timezone : "Asia/Shanghai",
    trueSolarTime: input.trueSolarTime === "longitude" ? "longitude" : "none",
    location: typeof input.location === "object" && input.location !== null ? (input.location as AstroInput["location"]) : undefined,
    sect: input.sect === 2 ? 2 : 1
  };
}

function createProfile(input: Record<string, unknown> = {}) {
  return createAstroProfile(normalizeInput(input));
}

function toToolResult<T>(handler: () => T) {
  try {
    return handler();
  } catch (error) {
    return {
      error: true,
      message: error instanceof Error ? error.message : "工具执行失败"
    };
  }
}

export function registerWebMcpTools(getCurrentProfile: () => AstroProfile | null) {
  const modelContext = getModelContext();
  if (!modelContext?.registerTool) return false;
  if (webMcpRegistered && !modelContext.unregisterTool) return true;

  for (const name of TOOL_NAMES) {
    try {
      modelContext.unregisterTool?.(name);
    } catch {
      // Some WebMCP shims do not support unregistering or throw when a tool is absent.
    }
  }

  const tools: ToolDefinition[] = [
    {
      name: "sizhu.about",
      title: "About Si Zhu Astro AI",
      description: "Describe 四柱星盘 AI capabilities, privacy model, and available WebMCP tools.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      execute: () => ({
        app: "四柱星盘 AI",
        repository: "https://github.com/JackMeds/sizhu-astro-ai",
        privacy: "排盘、提示词生成和历史记录均在浏览器本地完成；WebMCP 工具不会主动读取服务器数据。",
        capabilities: ["bazi_profile", "ziwei_profile", "ai_prompt", "current_chart"],
        tools: TOOL_NAMES,
        note: "WebMCP 是实验性浏览器/扩展能力；普通浏览器访问页面时不会显示这些工具。"
      })
    },
    {
      name: "sizhu.create_profile",
      title: "Create Astro Profile",
      description: "Generate a structured Bazi and Zi Wei profile from birth data.",
      inputSchema: birthInfoSchema,
      execute: (input) => toToolResult(() => createProfile(input))
    },
    {
      name: "sizhu.create_ai_prompt",
      title: "Create AI Prompt",
      description: "Generate a Markdown or plain text AI prompt from birth data and a selected analysis mode.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          ...birthInfoSchema.properties,
          promptMode: {
            type: "string",
            enum: ["general", "relationship", "career", "wealth", "health", "yearly", "xp"],
            default: "general"
          },
          format: { type: "string", enum: ["markdown", "txt"], default: "markdown" }
        },
        required: birthInfoSchema.required
      },
      execute: (input = {}) =>
        toToolResult(() => {
          const mode = typeof input.promptMode === "string" ? (input.promptMode as PromptMode) : "general";
          const format = input.format === "txt" ? "txt" : ("markdown" as PromptFormat);
          const profile = createProfile(input);
          return {
            mode,
            format,
            text: buildPrompt(profile, mode, format)
          };
        })
    },
    {
      name: "sizhu.get_current_chart",
      title: "Get Current Chart",
      description: "Return the chart currently generated in the visible page, if one exists.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} },
      execute: () => {
        const profile = getCurrentProfile();
        return profile ? { needsInput: false, profile } : { needsInput: true, message: "当前页面还没有生成命盘。" };
      }
    }
  ];

  for (const tool of tools) {
    try {
      modelContext.registerTool(tool);
    } catch (error) {
      console.warn(`[WebMCP] ${tool.name} registration failed`, error);
    }
  }

  webMcpRegistered = true;
  return true;
}
