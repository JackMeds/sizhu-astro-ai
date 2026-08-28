import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  getAgentTools,
  type AgentToolDefinition,
  type JsonSchema,
  type AgentToolInput
} from "@sizhu/agent-tools";
import { z, type ZodRawShape, type ZodTypeAny } from "zod";

export interface ToolMetric {
  toolName: string;
  success: boolean;
  durationMs: number;
  timestamp: string;
}

export interface MingXuMcpServerOptions {
  includeAliases?: boolean;
  onMetric?: (metric: ToolMetric) => void;
}

function jsonSchemaToZod(schema: JsonSchema): ZodTypeAny {
  const enumValues = schema.enum;
  if (Array.isArray(enumValues) && enumValues.length > 0 && enumValues.every((value) => typeof value === "string")) {
    const values = enumValues as [string, ...string[]];
    let result: ZodTypeAny = z.enum(values);
    if (schema.default !== undefined) result = result.default(schema.default as string);
    return result;
  }

  let result: any;
  switch (schema.type) {
    case "object": {
      const properties = schema.properties;
      const required = new Set(Array.isArray(schema.required) ? schema.required.filter((value): value is string => typeof value === "string") : []);
      const shape: ZodRawShape = {};
      if (properties && typeof properties === "object" && !Array.isArray(properties)) {
        for (const [key, property] of Object.entries(properties as Record<string, JsonSchema>)) {
          const converted = jsonSchemaToZod(property);
          shape[key] = required.has(key) || property.default !== undefined ? converted : converted.optional();
        }
      }
      result = z.object(shape).strict();
      break;
    }
    case "array": {
      result = z.array(jsonSchemaToZod((schema.items as JsonSchema | undefined) ?? {}));
      if (typeof schema.minItems === "number") result = result.min(schema.minItems);
      if (typeof schema.maxItems === "number") result = result.max(schema.maxItems);
      if (schema.uniqueItems === true) result = result.refine((items: unknown[]) => new Set(items.map((item: unknown) => JSON.stringify(item))).size === items.length, "Array items must be unique.");
      break;
    }
    case "integer":
      result = z.number().int();
      if (typeof schema.minimum === "number") result = result.min(schema.minimum);
      if (typeof schema.maximum === "number") result = result.max(schema.maximum);
      break;
    case "number":
      result = z.number();
      if (typeof schema.minimum === "number") result = result.min(schema.minimum);
      if (typeof schema.maximum === "number") result = result.max(schema.maximum);
      break;
    case "boolean":
      result = z.boolean();
      break;
    case "string":
      result = z.string();
      if (typeof schema.minLength === "number") result = result.min(schema.minLength);
      if (typeof schema.maxLength === "number") result = result.max(schema.maxLength);
      if (typeof schema.pattern === "string") result = result.regex(new RegExp(schema.pattern));
      break;
    default:
      result = z.unknown();
  }
  if (schema.default !== undefined) result = result.default(schema.default as never);
  return result;
}

function inputShape(schema: JsonSchema): ZodRawShape {
  const objectSchema = schema.type === "object" ? schema : { type: "object", properties: {} };
  const converted = jsonSchemaToZod(objectSchema);
  if (converted instanceof z.ZodObject) return converted.shape;
  return {};
}

function stringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return JSON.stringify({ error: "Tool result could not be serialized." });
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : typeof error === "string" ? error : "Tool execution failed.";
}

function registerTool(server: McpServer, tool: AgentToolDefinition, onMetric?: (metric: ToolMetric) => void) {
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: inputShape(tool.inputSchema)
    },
    async (input) => {
      const started = performance.now();
      try {
        const value = tool.executeCore((input ?? {}) as AgentToolInput);
        onMetric?.({
          toolName: tool.name,
          success: true,
          durationMs: Math.round((performance.now() - started) * 100) / 100,
          timestamp: new Date().toISOString()
        });
        return { content: [{ type: "text", text: stringify(value) }] };
      } catch (error) {
        onMetric?.({
          toolName: tool.name,
          success: false,
          durationMs: Math.round((performance.now() - started) * 100) / 100,
          timestamp: new Date().toISOString()
        });
        return { isError: true, content: [{ type: "text", text: errorMessage(error) }] };
      }
    }
  );
}

export function createMingXuMcpServer(options: MingXuMcpServerOptions = {}) {
  const server = new McpServer({ name: "mingxu", version: "0.5.0" });
  for (const tool of getAgentTools({ includeAliases: options.includeAliases ?? true })) {
    registerTool(server, tool, options.onMetric);
  }
  return server;
}
