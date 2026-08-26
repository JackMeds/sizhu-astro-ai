export interface WebMcpTextContent {
  type: "text";
  text: string;
}

export interface WebMcpToolResult {
  content: WebMcpTextContent[];
  isError?: true;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error) ?? String(error);
  } catch {
    return String(error);
  }
}

export function webMcpToolResult(value: unknown): WebMcpToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) ?? String(value) }]
  };
}

export function webMcpToolError(error: unknown): WebMcpToolResult {
  return {
    isError: true,
    content: [{ type: "text", text: errorMessage(error) }]
  };
}

export async function executeWebMcpTool(
  execute: (input?: Record<string, unknown>) => unknown | Promise<unknown>,
  input?: Record<string, unknown>
) {
  try {
    return await execute(input);
  } catch (error) {
    return webMcpToolError(error);
  }
}
