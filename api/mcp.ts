import type { IncomingMessage, ServerResponse } from "node:http";
import { handleMcpHttpRequest } from "../apps/mcp/src/http.js";

interface VercelResponse extends ServerResponse {
  status(code: number): VercelResponse;
  send(body: unknown): void;
}

function requestUrl(request: IncomingMessage) {
  const host = request.headers.host ?? "mcp.jackmeds.top";
  return `https://${host}${request.url ?? "/mcp"}`;
}

export default async function handler(request: IncomingMessage, response: VercelResponse) {
  const method = request.method ?? "GET";
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) headers.set(key, value.join(", "));
    else if (value !== undefined) headers.set(key, value);
  }

  const init: RequestInit & { duplex?: "half" } = {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : request as unknown as BodyInit,
    duplex: "half"
  };
  const webRequest = new Request(requestUrl(request), init);
  const webResponse = await handleMcpHttpRequest(webRequest, {
    onMetric: (metric) => console.log(JSON.stringify(metric))
  });

  response.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => response.setHeader(key, value));
  const body = Buffer.from(await webResponse.arrayBuffer());
  response.end(body);
}

export const config = {
  api: { bodyParser: false, responseLimit: "2mb" }
};
