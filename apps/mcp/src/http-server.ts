import { createServer } from "node:http";
import { handleMcpHttpRequest } from "./http.js";

const port = Number(process.env.MINGXU_MCP_PORT ?? 8787);

const server = createServer(async (request, response) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) headers.set(key, value.join(", "));
    else if (value !== undefined) headers.set(key, value);
  }
  const method = request.method ?? "GET";
  const webRequest = new Request(`http://127.0.0.1:${port}${request.url ?? "/mcp"}`, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : request as unknown as BodyInit,
    duplex: "half"
  } as RequestInit & { duplex: "half" });
  const webResponse = request.url?.split("?", 1)[0] === "/health"
    ? new Response(JSON.stringify({ status: "ok", service: "MingXu MCP" }), { status: 200, headers: { "content-type": "application/json" } })
    : await handleMcpHttpRequest(webRequest, { onMetric: (metric) => console.log(JSON.stringify(metric)) });

  response.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => response.setHeader(key, value));
  response.end(Buffer.from(await webResponse.arrayBuffer()));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`MingXu MCP HTTP listening on http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
