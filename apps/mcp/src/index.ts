#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createAstroProfile, createCompleteLiurenChart, createLiurenBaseChart, createTransitSnapshot } from "@sizhu/core";
import { buildAiPrompt, exportProfile } from "@sizhu/prompt";
import { z } from "zod";

const locationSchema = z
  .object({
    name: z.string().optional(),
    longitude: z.number().min(-180).max(180).optional(),
    latitude: z.number().min(-90).max(90).optional()
  })
  .optional();

const inputSchema = {
  name: z.string().default("未命名"),
  gender: z.enum(["male", "female"]).default("male"),
  birthDateTime: z.string().describe("ISO-like birth datetime, e.g. 1992-08-08T08:30:00+08:00"),
  calendar: z.enum(["solar", "lunar"]).default("solar"),
  timezone: z.string().default("Asia/Shanghai"),
  trueSolarTime: z.enum(["none", "longitude", "apparent"]).default("none"),
  location: locationSchema,
  sect: z.union([z.literal(1), z.literal(2)]).default(1)
};

const liurenInputSchema = {
  dateTime: z.string().describe("Divination/base datetime with explicit offset, e.g. 2026-08-15T09:30:00+08:00"),
  timezone: z.string().default("Asia/Shanghai"),
  trueSolarTime: z.enum(["none", "longitude", "apparent"]).default("none"),
  location: locationSchema,
  question: z.string().optional()
};

const liurenCompleteInputSchema = {
  ...liurenInputSchema,
  castingMethod: z.enum(["time", "number", "branch"]).default("time"),
  castingNumber: z.number().int().positive().optional().describe("Reported number; mapped cyclically with 1=子 ... 12=亥."),
  castingBranch: z.enum(["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]).optional()
};

const server = new McpServer({
  name: "sizhu-astro-ai",
  version: "0.4.0"
});

server.registerTool(
  "sizhu.create_bazi_profile",
  {
    title: "Create Bazi Profile",
    description: "Generate deterministic Bazi pillars, luck cycles, and structural relation facts as stable JSON.",
    inputSchema
  },
  async (input) => {
    const profile = createAstroProfile(input);
    return { content: [{ type: "text", text: JSON.stringify(profile.bazi, null, 2) }] };
  }
);

server.registerTool(
  "sizhu.create_ziwei_profile",
  {
    title: "Create Zi Wei Profile",
    description: "Generate normalized Zi Wei natal metadata, palaces, stars, brightness, mutagens, and decadal data using iztro.",
    inputSchema
  },
  async (input) => {
    const profile = createAstroProfile(input);
    return { content: [{ type: "text", text: JSON.stringify(profile.ziwei, null, 2) }] };
  }
);

server.registerTool(
  "sizhu.get_transit_snapshot",
  {
    title: "Get Transit Snapshot",
    description: "For one target date, return the matching Bazi Da Yun/Liu Nian relation facts plus normalized Zi Wei decadal, age, yearly, monthly, daily, and hourly scopes.",
    inputSchema: {
      ...inputSchema,
      targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Target solar date YYYY-MM-DD"),
      targetHour: z.number().int().min(0).max(23).optional()
    }
  },
  async (input) => {
    const { targetDate, targetHour, ...birthInput } = input;
    const snapshot = createTransitSnapshot(birthInput, targetDate, targetHour);
    return { content: [{ type: "text", text: JSON.stringify(snapshot, null, 2) }] };
  }
);

server.registerTool(
  "sizhu.create_liuren_chart",
  {
    title: "Create Complete Da Liu Ren Chart",
    description: "Generate a complete structured Da Liu Ren chart from standard-time, reported-number, or explicit-branch casting. Returns plates, generals, Four Lessons, Three Transmissions, void branches, dun-gan, six-relatives, pattern evidence, source-gated ShenSha, and engine cross-check status. This tool calculates only; it does not interpret the divination.",
    inputSchema: liurenCompleteInputSchema
  },
  async (input) => {
    const chart = createCompleteLiurenChart(input);
    return { content: [{ type: "text", text: JSON.stringify(chart, null, 2) }] };
  }
);

server.registerTool(
  "sizhu.create_liuren_base_chart",
  {
    title: "Create Da Liu Ren Base Chart (Compatibility)",
    description: "Compatibility endpoint for the verified month-general, Heaven/Earth plates, sky-generals and Four-Courses structure. Prefer sizhu.create_liuren_chart for new integrations.",
    inputSchema: liurenInputSchema
  },
  async (input) => {
    const chart = createLiurenBaseChart(input);
    return { content: [{ type: "text", text: JSON.stringify(chart, null, 2) }] };
  }
);

server.registerTool(
  "sizhu.create_ai_prompt",
  {
    title: "Create AI Prompt",
    description: "Generate a Markdown prompt containing deterministic chart facts and normalized Zi Wei evidence.",
    inputSchema
  },
  async (input) => {
    const profile = createAstroProfile(input);
    const prompt = buildAiPrompt(profile);
    return { content: [{ type: "text", text: prompt }] };
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
    return { content: [{ type: "text", text: exportProfile(profile, "markdown") }] };
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
