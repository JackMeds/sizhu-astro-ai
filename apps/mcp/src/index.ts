#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAstroProfile } from "@sizhu/core";
import { buildAiPrompt, exportProfile } from "@sizhu/prompt";
import { z } from "zod";

const inputSchema = {
  name: z.string().default("未命名"),
  gender: z.enum(["male", "female"]).default("male"),
  birthDateTime: z.string().describe("ISO-like birth datetime, e.g. 1992-08-08T08:30:00+08:00"),
  calendar: z.enum(["solar", "lunar"]).default("solar"),
  timezone: z.string().default("Asia/Shanghai"),
  trueSolarTime: z.enum(["none", "longitude"]).default("none"),
  sect: z.union([z.literal(1), z.literal(2)]).default(1)
};

const server = new McpServer({
  name: "sizhu-astro-ai",
  version: "0.1.0"
});

server.registerTool(
  "sizhu.create_bazi_profile",
  {
    title: "Create Bazi Profile",
    description: "Generate an AI-readable Bazi profile as stable JSON.",
    inputSchema
  },
  async (input) => {
    const profile = createAstroProfile(input);
    return {
      content: [{ type: "text", text: JSON.stringify(profile.bazi, null, 2) }]
    };
  }
);

server.registerTool(
  "sizhu.create_ziwei_profile",
  {
    title: "Create Zi Wei Profile",
    description: "Generate a Zi Wei Dou Shu profile using iztro and return normalized palace data.",
    inputSchema
  },
  async (input) => {
    const profile = createAstroProfile(input);
    return {
      content: [{ type: "text", text: JSON.stringify(profile.ziwei, null, 2) }]
    };
  }
);

server.registerTool(
  "sizhu.create_ai_prompt",
  {
    title: "Create AI Prompt",
    description: "Generate a Markdown prompt for ChatGPT, Claude, or DeepSeek from a birth profile.",
    inputSchema
  },
  async (input) => {
    const profile = createAstroProfile(input);
    const prompt = buildAiPrompt(profile);
    return {
      content: [{ type: "text", text: prompt }]
    };
  }
);

server.registerTool(
  "sizhu.export_profile_markdown",
  {
    title: "Export Profile Markdown",
    description: "Generate full profile Markdown for saving or pasting into an AI model.",
    inputSchema
  },
  async (input) => {
    const profile = createAstroProfile(input);
    return {
      content: [{ type: "text", text: exportProfile(profile, "markdown") }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
