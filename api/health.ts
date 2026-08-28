import type { IncomingMessage, ServerResponse } from "node:http";

interface HealthResponse extends ServerResponse {
  status(code: number): HealthResponse;
  json(value: unknown): void;
}

export default function handler(_request: IncomingMessage, response: HealthResponse) {
  response.statusCode = 200;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("access-control-allow-origin", "*");
  response.end(JSON.stringify({ status: "ok", service: "MingXu MCP" }));
}
