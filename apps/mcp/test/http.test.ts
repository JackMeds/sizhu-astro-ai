import assert from "node:assert/strict";
import test from "node:test";
import { handleMcpHttpRequest } from "../src/http.js";

const headers = {
  accept: "application/json, text/event-stream",
  "content-type": "application/json",
  "mcp-protocol-version": "2025-06-18"
};

async function call(message: unknown) {
  return handleMcpHttpRequest(new Request("https://mcp.example.test/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(message)
  }));
}

test("stateless Streamable HTTP handles initialize and independent tool calls", async () => {
  const initialized = await call({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "test", version: "1.0.0" }
    }
  });
  assert.equal(initialized.status, 200);
  assert.equal(initialized.headers.get("mcp-session-id"), null);
  const initializeBody = await initialized.json() as { result?: { serverInfo?: { name?: string } } };
  assert.equal(initializeBody.result?.serverInfo?.name, "mingxu");

  const listed = await call({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  assert.equal(listed.status, 200);
  const listBody = await listed.json() as { result?: { tools?: Array<{ name: string }> } };
  assert.equal(listBody.result?.tools?.length, 6);
  assert.ok(listBody.result?.tools?.some((tool) => tool.name === "mingxu.about"));

  const about = await call({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "mingxu.about", arguments: {} } });
  assert.equal(about.status, 200);
  const aboutBody = await about.json() as { result?: { content?: Array<{ text: string }> } };
  assert.match(aboutBody.result?.content?.[0]?.text ?? "", /MingXu/);
});

test("HTTP handler rejects oversized and malformed requests", async () => {
  const oversized = await handleMcpHttpRequest(new Request("https://mcp.example.test/mcp", {
    method: "POST",
    headers,
    body: "x".repeat(1_000_001)
  }));
  assert.equal(oversized.status, 413);

  const malformed = await handleMcpHttpRequest(new Request("https://mcp.example.test/mcp", {
    method: "POST",
    headers,
    body: "not-json"
  }));
  assert.equal(malformed.status, 400);
});
