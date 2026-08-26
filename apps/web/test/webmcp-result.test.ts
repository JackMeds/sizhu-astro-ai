import assert from "node:assert/strict";
import test from "node:test";
import {
  executeWebMcpTool,
  webMcpToolError,
  webMcpToolResult
} from "../src/lib/webMcpResult";

test("WebMCP success results serialize concise structured content", () => {
  const result = webMcpToolResult({ status: "success", value: 3 });
  assert.equal(result.isError, undefined);
  assert.equal(result.content[0]?.type, "text");
  assert.match(result.content[0]?.text ?? "", /"value": 3/);
});

test("all explicit WebMCP errors carry isError true", () => {
  const result = webMcpToolError(new Error("invalid input"));
  assert.equal(result.isError, true);
  assert.equal(result.content[0]?.text, "invalid input");
});

test("the registration wrapper normalizes synchronous and asynchronous throws", async () => {
  const synchronous = await executeWebMcpTool(() => {
    throw new Error("sync failure");
  });
  const asynchronous = await executeWebMcpTool(async () => {
    throw new Error("async failure");
  });

  assert.equal((synchronous as { isError?: boolean }).isError, true);
  assert.equal((asynchronous as { isError?: boolean }).isError, true);
});
