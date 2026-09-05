type LandingTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input?: Record<string, unknown>) => unknown;
};

type ModelContextLike = {
  registerTool?: (tool: LandingTool, options?: { signal?: AbortSignal }) => void | Promise<void>;
  unregisterTool?: (name: string) => void | Promise<void>;
};

const REGISTERED_KEY = "__mingxuLandingAgentRegistered";
const emptySchema = { type: "object", additionalProperties: false, properties: {} };

function getModelContext(): ModelContextLike | null {
  if (typeof document !== "undefined") {
    const documentContext = (document as unknown as { modelContext?: ModelContextLike }).modelContext;
    if (documentContext) return documentContext;
  }
  if (typeof navigator !== "undefined") {
    return (navigator as unknown as { modelContext?: ModelContextLike }).modelContext ?? null;
  }
  return null;
}

function result(value: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function error(message: string) {
  return { isError: true, content: [{ type: "text", text: message }] };
}

const tools: LandingTool[] = [
  {
    name: "mingxu.about",
    title: "About MingXu / 命序",
    description: "Describe MingXu's deterministic BaZi, Zi Wei Dou Shu, transit, true-solar-time and Da Liu Ren capabilities and privacy boundary.",
    inputSchema: emptySchema,
    execute: () => result({
      app: "命序",
      englishName: "MingXu",
      engine: "AstroCopy engine",
      purpose: "Deterministic Chinese-metaphysics computation for humans and AI agents.",
      capabilities: ["bazi", "ziwei", "transits", "true_solar_time", "da_liu_ren", "structured_output"],
      integrations: ["WebMCP", "Streamable HTTP MCP"],
      links: {
        workspace: `${window.location.origin}/`,
        agentGuide: `${window.location.origin}/agents.md`,
        repository: "https://github.com/JackMeds/mingxu"
      },
      privacy: "Landing pages do not collect birth data. The full workspace computes in the browser; explicitly invoked tool results are shared with the active Agent."
    })
  },
  {
    name: "mingxu.open_workspace",
    title: "Open MingXu Workspace",
    description: "Navigate from a static discovery page into the full MingXu browser workspace. Use mode birth-chart for BaZi/Zi Wei or liuren for Da Liu Ren.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        mode: { type: "string", enum: ["birth-chart", "liuren"], default: "birth-chart" }
      }
    },
    execute: (input = {}) => {
      const mode = input.mode === "liuren" ? "liuren" : input.mode === "birth-chart" || input.mode === undefined ? "birth-chart" : null;
      if (!mode) return error('mode must be "birth-chart" or "liuren".');
      const target = mode === "liuren" ? "/#liuren" : "/#birth";
      window.location.assign(target);
      return result({ status: "navigating", mode, target, visibleChange: "The full MingXu workspace is opening." });
    }
  }
];

async function register() {
  const context = getModelContext();
  if (!context?.registerTool) return false;
  if ((globalThis as Record<string, unknown>)[REGISTERED_KEY]) return true;
  for (const tool of tools) {
    try { await context.unregisterTool?.(tool.name); } catch { /* optional unregister shim */ }
    try { await context.registerTool(tool); } catch { /* static pages remain usable without WebMCP */ }
  }
  (globalThis as Record<string, unknown>)[REGISTERED_KEY] = true;
  return true;
}

let attempts = 0;
const timer = window.setInterval(() => {
  attempts += 1;
  void register().then((registered) => {
    if (registered || attempts >= 40) window.clearInterval(timer);
  });
}, 250);
void register();
