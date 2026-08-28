import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AGENT_TOOL_ALIASES, getAgentTools } from "../packages/agent-tools/dist/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "apps", "web", "public");
const tools = getAgentTools();

const markdown = [
  "# MingXu Agent Tool Registry",
  "",
  "This file is generated from `packages/agent-tools/src/index.ts`. The canonical namespace is `mingxu.*`; browser-only state tools use `mingxu.ui.*`.",
  "",
  "## Canonical computation tools",
  "",
  ...tools.map((tool) => `- **${tool.name}** — ${tool.title}. ${tool.description}`),
  "",
  "## Deprecated aliases",
  "",
  ...Object.entries(AGENT_TOOL_ALIASES).map(([alias, canonical]) => `- \`${alias}\` → \`${canonical}\``),
  ""
].join("\n");

const json = JSON.stringify({
  schemaVersion: "mingxu-agent-tools-v1",
  generatedFrom: "packages/agent-tools/src/index.ts",
  tools: tools.map(({ name, title, description, inputSchema }) => ({ name, title, description, inputSchema })),
  aliases: AGENT_TOOL_ALIASES
}, null, 2) + "\n";

await fs.mkdir(path.join(publicRoot, "agent"), { recursive: true });
await fs.writeFile(path.join(publicRoot, "agent", "tools.md"), markdown, "utf8");
await fs.writeFile(path.join(publicRoot, "agent", "tools.json"), json, "utf8");
console.log(`Generated Agent docs for ${tools.length} canonical tools and ${Object.keys(AGENT_TOOL_ALIASES).length} aliases.`);
