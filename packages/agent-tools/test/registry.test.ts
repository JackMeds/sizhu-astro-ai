import assert from "node:assert/strict";
import test from "node:test";
import { AGENT_TOOL_ALIASES, AGENT_TOOL_NAMES, getAgentTool, getAgentTools } from "../src/index.js";

const input = {
  name: "Registry test",
  gender: "female",
  birthDateTime: "2001-01-29T13:32:00+08:00",
  calendar: "solar",
  timezone: "Asia/Shanghai",
  trueSolarTime: "none",
  sect: 1
};

test("registry exposes the canonical MingXu computation tools", () => {
  assert.deepEqual(AGENT_TOOL_NAMES, [
    "mingxu.about",
    "mingxu.create_birth_chart",
    "mingxu.get_transit_snapshot",
    "mingxu.compare_transits",
    "mingxu.create_liuren_chart",
    "mingxu.export_profile"
  ]);
  assert.equal(getAgentTools().length, 6);
  assert.equal(getAgentTool("sizhu.create_bazi_profile")?.name, "mingxu.create_birth_chart");
});

test("canonical tools execute the same deterministic core functions", () => {
  const chart = getAgentTool("mingxu.create_birth_chart")?.executeCore(input) as { bazi: { pillars: Array<{ ganZhi: string }> } };
  assert.equal(chart.bazi.pillars.length, 4);

  const transit = getAgentTool("mingxu.get_transit_snapshot")?.executeCore({ ...input, targetDate: "2029-06-15" }) as { targetDate: string };
  assert.equal(transit.targetDate, "2029-06-15");

  const comparison = getAgentTool("mingxu.compare_transits")?.executeCore({ ...input, targetDates: ["2027-06-15", "2029-06-15"] }) as { snapshots: unknown[] };
  assert.equal(comparison.snapshots.length, 2);
});

test("legacy aliases are explicitly marked and remain callable", () => {
  assert.equal(AGENT_TOOL_ALIASES["astrocopy.create_birth_chart"], "mingxu.create_birth_chart");
  const legacy = getAgentTools({ includeAliases: true }).find((tool) => tool.name === "sizhu.create_profile");
  assert.match(legacy?.description ?? "", /Deprecated alias/);
});

test("profile export uses the unified method protocol and optional dynamic context", () => {
  const exported = getAgentTool("mingxu.export_profile")?.executeCore({
    ...input,
    format: "markdown",
    locale: "en",
    system: "combined",
    mode: "yearly",
    question: "Should I change jobs?",
    targetDate: "2029-06-15",
    comparisonDates: ["2028-06-15", "2029-06-15"]
  }) as { text: string };
  assert.match(exported.text, /mingxu-structured-traditional-v1/);
  assert.match(exported.text, /Should I change jobs/);
  assert.match(exported.text, /Target date: 2029-06-15/);
  assert.match(exported.text, /Target-date comparison/);
});
