import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMingXuMcpServer, type ToolMetric } from "./server.js";

export const MAX_REQUEST_BYTES = 1_000_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version, last-event-id",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version"
};

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...corsHeaders }
  });
}

class RequestBodyError extends Error {
  constructor(message: string, readonly status: 400 | 413) {
    super(message);
  }
}

async function parseBody(request: Request) {
  if (request.method !== "POST") return undefined;
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) throw new RequestBodyError("Request body is too large.", 413);
  if (!request.body) throw new RequestBodyError("Request body must not be empty.", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      total += next.value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw new RequestBodyError("Request body is too large.", 413);
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const body = new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalBytes));
  if (!body.trim()) throw new RequestBodyError("Request body must not be empty.", 400);
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new RequestBodyError("Request body must be valid JSON.", 400);
  }
}

export interface HttpHandlerOptions {
  onMetric?: (metric: ToolMetric) => void;
}

/** Stateless MCP handler suitable for Vercel, Node, or another Web-standard runtime. */
export async function handleMcpHttpRequest(request: Request, options: HttpHandlerOptions = {}) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  let parsedBody: unknown;
  try {
    parsedBody = await parseBody(request);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return json({ error: error instanceof Error ? error.message : "Invalid request." }, status);
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });
  // The remote surface stays intentionally small. Legacy aliases remain on
  // the local stdio server for existing desktop clients, but should not make
  // remote tool selection ambiguous.
  const server = createMingXuMcpServer({ includeAliases: false, onMetric: options.onMetric });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request, { parsedBody });
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    try { await server.close(); } catch { /* request-scoped server */ }
    return json({ error: error instanceof Error ? error.message : "MCP request failed." }, 500);
  }
}
