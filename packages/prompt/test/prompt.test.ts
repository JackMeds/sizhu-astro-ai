import assert from "node:assert/strict";
import test from "node:test";
import { createAstroProfile } from "@sizhu/core";
import { buildAiPrompt, exportProfile } from "../src/index.js";

const profile = createAstroProfile({
  name: "测试命例",
  gender: "female",
  birthDateTime: "1995-03-12T14:20:00+08:00",
  calendar: "solar",
  timezone: "Asia/Shanghai",
  trueSolarTime: "none",
  sect: 1
});

test("buildAiPrompt creates markdown with core sections and no function text", () => {
  const prompt = buildAiPrompt(profile);
  assert.match(prompt, /## 输入信息/);
  assert.match(prompt, /## 八字核心/);
  assert.match(prompt, /## 五行计数/);
  assert.doesNotMatch(prompt, /function\s*\(/);
  assert.doesNotMatch(prompt, /\[object Object\]/);
});

test("exportProfile supports json, markdown, and txt", () => {
  assert.doesNotThrow(() => JSON.parse(exportProfile(profile, "json")));
  assert.match(exportProfile(profile, "markdown"), /^# AI 命盘分析资料/);
  assert.doesNotMatch(exportProfile(profile, "txt"), /^#/);
});
