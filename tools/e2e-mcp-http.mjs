const baseUrl = process.env.MINGXU_MCP_E2E_URL || "http://127.0.0.1:8787";
const headers = {
  accept: "application/json, text/event-stream",
  "content-type": "application/json",
  "mcp-protocol-version": "2025-06-18"
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function post(message) {
  const response = await fetch(`${baseUrl}/mcp`, { method: "POST", headers, body: JSON.stringify(message) });
  let body = null;
  try { body = await response.json(); } catch { /* malformed responses are asserted by the caller */ }
  assert(response.ok, `MCP request failed with HTTP ${response.status}`);
  return body;
}

function toolResultBody(response) {
  const text = response?.result?.content?.find((item) => item?.type === "text")?.text;
  assert(typeof text === "string", "MCP tool response did not contain text content");
  return JSON.parse(text);
}

const health = await fetch(`${baseUrl}/health`);
assert(health.status === 200, `Health endpoint returned ${health.status}`);
const healthBody = await health.json();
assert(healthBody.status === "ok" && healthBody.service === "MingXu MCP", "Health response is not the public contract");

const initialized = await post({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "e2e", version: "1.0.0" } }
});
assert(initialized?.result?.serverInfo?.name === "mingxu", "Initialize did not identify the MingXu server");

const listed = await post({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
const toolNames = listed?.result?.tools?.map((tool) => tool.name) ?? [];
for (const name of ["mingxu.about", "mingxu.create_birth_chart", "mingxu.get_transit_snapshot", "mingxu.compare_transits", "mingxu.create_liuren_chart", "mingxu.export_profile"]) {
  assert(toolNames.includes(name), `tools/list omitted ${name}`);
}

const about = toolResultBody(await post({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "mingxu.about", arguments: {} } }));
assert(about.englishName === "MingXu" && about.tools.includes("mingxu.about"), "mingxu.about returned an unexpected contract");

const chart = toolResultBody(await post({
  jsonrpc: "2.0",
  id: 4,
  method: "tools/call",
  params: {
    name: "mingxu.create_birth_chart",
    arguments: {
      name: "HTTP E2E",
      gender: "female",
      birthDateTime: "2001-01-29T13:32:00+08:00",
      calendar: "solar",
      timezone: "Asia/Shanghai",
      trueSolarTime: "none",
      sect: 1
    }
  }
}));
assert(chart.input.name === "HTTP E2E" && chart.bazi.pillars.length === 4, "Birth chart calculation failed");

const transit = toolResultBody(await post({
  jsonrpc: "2.0",
  id: 5,
  method: "tools/call",
  params: {
    name: "mingxu.get_transit_snapshot",
    arguments: {
      gender: "female",
      birthDateTime: "2001-01-29T13:32:00+08:00",
      timezone: "Asia/Shanghai",
      targetDate: "2029-06-15"
    }
  }
}));
assert(transit.targetDate === "2029-06-15", "Transit snapshot returned the wrong date");

const comparison = toolResultBody(await post({
  jsonrpc: "2.0",
  id: 6,
  method: "tools/call",
  params: {
    name: "mingxu.compare_transits",
    arguments: {
      gender: "female",
      birthDateTime: "2001-01-29T13:32:00+08:00",
      timezone: "Asia/Shanghai",
      targetDates: ["2027-06-15", "2029-06-15"]
    }
  }
}));
assert(comparison.snapshots.length === 2, "Transit comparison did not return two snapshots");

const liuren = toolResultBody(await post({
  jsonrpc: "2.0",
  id: 7,
  method: "tools/call",
  params: {
    name: "mingxu.create_liuren_chart",
    arguments: { dateTime: "2026-08-15T09:30:00+08:00", timezone: "Asia/Shanghai", castingMethod: "time" }
  }
}));
assert(liuren.complete?.threeTransmissions, "Da Liu Ren result did not include transmissions");

const parallel = await Promise.all(Array.from({ length: 4 }, (_, index) => post({
  jsonrpc: "2.0",
  id: 20 + index,
  method: "tools/call",
  params: { name: "mingxu.about", arguments: {} }
})));
assert(parallel.every((response) => response?.result?.content?.length), "Concurrent calls did not complete");

const missingTime = await post({ jsonrpc: "2.0", id: 30, method: "tools/call", params: { name: "mingxu.create_birth_chart", arguments: { gender: "female" } } });
assert(missingTime?.result?.isError === true, "Missing birth time was not rejected");
const invalidLongitude = await post({ jsonrpc: "2.0", id: 31, method: "tools/call", params: { name: "mingxu.create_birth_chart", arguments: { gender: "female", birthDateTime: "2001-01-29T13:32:00+08:00", location: { longitude: 400 } } } });
assert(invalidLongitude?.result?.isError === true, "Invalid longitude was not rejected");

const malformed = await fetch(`${baseUrl}/mcp`, { method: "POST", headers, body: "not-json" });
assert(malformed.status === 400, `Malformed JSON returned ${malformed.status}`);
const oversized = await fetch(`${baseUrl}/mcp`, { method: "POST", headers, body: "x".repeat(1_000_001) });
assert(oversized.status === 413, `Oversized request returned ${oversized.status}`);

console.log(`MingXu MCP HTTP E2E passed with ${toolNames.length} listed tools.`);
