import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

for (const name of ["core", "prompt", "render", "agent-tools", "mcp"]) {
  test(`@sizhu/${name} reexports the identical @mingxu/${name} API`, async () => {
    const canonical = await import(`@mingxu/${name}`);
    const compatibility = await import(`@sizhu/${name}`);
    assert.deepEqual(Object.keys(compatibility), Object.keys(canonical));
    for (const key of Object.keys(canonical)) assert.equal(compatibility[key], canonical[key]);
  });
}
test("MCP keeps both existing executable names", async () => {
  const pkg = JSON.parse(await readFile(new URL("../apps/mcp/package.json", import.meta.url), "utf8"));
  assert.equal(pkg.name, "@mingxu/mcp");
  assert.equal(pkg.bin["sizhu-mcp"], pkg.bin["mingxu-mcp"]);
});
for (const name of ["mingxu-mcp", "sizhu-mcp"]) {
  test(`${name} executable responds to MCP initialization`, () => {
    const path = fileURLToPath(new URL(`../node_modules/.bin/${name}`, import.meta.url));
    const result = spawnSync(path, [], {
      input: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "compat-test", version: "1" } } }) + "\n",
      encoding: "utf8", timeout: 10000
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    const response = JSON.parse(result.stdout.trim());
    assert.equal(response.id, 1);
    assert.ok(response.result.serverInfo.name);
  });
}
