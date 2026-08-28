import { getAgentTools, type AgentToolDefinition } from "@sizhu/agent-tools";
import type { AstroProfile } from "@sizhu/core";
import { executeWebMcpTool } from "./webMcpResult";

type ModelContextLike = {
  registerTool?: (tool: AgentToolDefinition | Record<string, unknown>, options?: Record<string, unknown>) => unknown;
  unregisterTool?: (name: string) => unknown;
};

let webMcpRegistered = false;

function getModelContext(): ModelContextLike | null {
  const documentContext = (globalThis.document as unknown as { modelContext?: ModelContextLike } | undefined)?.modelContext;
  const navigatorContext = (globalThis.navigator as unknown as { modelContext?: ModelContextLike } | undefined)?.modelContext;
  return documentContext ?? navigatorContext ?? null;
}

/**
 * Compatibility registration for non-React consumers. The React bridge adds
 * the richer `mingxu.ui.*` stateful tools; this helper only exposes the shared
 * stateless computation registry and the historical current-chart alias.
 */
export function registerWebMcpTools(getCurrentProfile: () => AstroProfile | null) {
  const modelContext = getModelContext();
  if (!modelContext?.registerTool) return false;
  if (webMcpRegistered && !modelContext.unregisterTool) return true;

  const tools = getAgentTools({ includeAliases: true });
  for (const tool of tools) {
    try { modelContext.unregisterTool?.(tool.name); } catch { /* optional shim */ }
    try {
      modelContext.registerTool({
        name: tool.name,
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: (input?: Record<string, unknown>) => executeWebMcpTool(tool.executeCore, input)
      });
    } catch (error) {
      console.warn(`[WebMCP] ${tool.name} registration failed`, error);
    }
  }

  const currentChartName = "sizhu.get_current_chart";
  try { modelContext.unregisterTool?.(currentChartName); } catch { /* optional shim */ }
  modelContext.registerTool({
    name: currentChartName,
    title: "Get Current Chart (deprecated alias)",
    description: "[Deprecated alias] Return the chart currently generated in the visible page, if one exists.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} },
    execute: () => {
      const profile = getCurrentProfile();
      return profile ? { needsInput: false, profile } : { needsInput: true, message: "当前页面还没有生成命盘。" };
    }
  });

  webMcpRegistered = true;
  return true;
}
