import assert from "node:assert/strict";
import test from "node:test";
import {
  createAstroProfile,
  createCompleteLiurenChart,
  createTransitSnapshot
} from "@sizhu/core";
import {
  buildAiPrompt,
  buildAnalysisPrompt,
  buildLiurenAnalysisPrompt,
  exportProfile,
  PROMPT_METHOD_ID,
  PROMPT_MODE_META,
  type PromptLocale,
  type PromptMode,
  type PromptSystem
} from "../src/index.js";

const input = {
  name: "测试命例",
  gender: "female" as const,
  birthDateTime: "1995-03-12T14:20:00+08:00",
  calendar: "solar" as const,
  timezone: "Asia/Shanghai",
  trueSolarTime: "none" as const,
  sect: 1 as const
};
const profile = createAstroProfile(input);
const modes = Object.keys(PROMPT_MODE_META) as PromptMode[];
const systems: PromptSystem[] = ["combined", "bazi", "ziwei"];
const locales: PromptLocale[] = ["zh-CN", "en"];

test("unified prompt matrix covers every mode, system, locale and text format", () => {
  for (const mode of modes) {
    for (const system of systems) {
      for (const locale of locales) {
        for (const format of ["markdown", "txt"] as const) {
          const prompt = buildAnalysisPrompt(profile, { locale, format, system, mode });
          assert.match(prompt, new RegExp(PROMPT_METHOD_ID));
          assert.match(prompt, new RegExp(locale === "en" ? PROMPT_MODE_META[mode].label.en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : PROMPT_MODE_META[mode].label.zh));
          assert.match(prompt, locale === "en" ? /No specific question was supplied/ : /未填写具体问题/);
          assert.doesNotMatch(prompt, /\[object Object\]|function\s*\(/);
          assert.doesNotMatch(prompt, /Preserve uncertainty|not modern scientific prediction|仅供娱乐/);
          if (format === "markdown") assert.match(prompt, /^#/);
          else assert.doesNotMatch(prompt, /^#/);
          if (system === "bazi") assert.doesNotMatch(prompt, locale === "en" ? /## Deterministic Zi Wei data/ : /## 紫微确定性资料/);
          if (system === "ziwei") assert.doesNotMatch(prompt, locale === "en" ? /## Deterministic BaZi data/ : /## 八字确定性资料/);
        }
      }
    }
  }
});

test("specific question and deterministic target/comparison transits enter the prompt", () => {
  const targetTransit = createTransitSnapshot(input, "2029-06-15");
  const comparisonTransits = [
    createTransitSnapshot(input, "2028-06-15"),
    targetTransit
  ];
  const prompt = buildAnalysisPrompt(profile, {
    locale: "zh-CN",
    format: "markdown",
    system: "combined",
    mode: "yearly",
    question: "未来两年适合留任还是跳槽？",
    targetTransit,
    comparisonTransits
  });
  assert.match(prompt, /未来两年适合留任还是跳槽/);
  assert.match(prompt, /目标日期：2029-06-15/);
  assert.match(prompt, /## 目标日期比较/);
  assert.match(prompt, /紫微流年/);
});

test("Zi Wei prompt contains deterministic trines, opposites, adjective stars and Changsheng", () => {
  const prompt = buildAnalysisPrompt(profile, {
    locale: "zh-CN",
    format: "markdown",
    system: "ziwei",
    mode: "relationship"
  });
  assert.match(prompt, /十二宫及确定性三方四正/);
  assert.match(prompt, /三合宫.+对宫/);
  assert.match(prompt, /杂曜\/形容星/);
  assert.match(prompt, /长生十二神/);
});

test("legacy 1.2 profile data without palaceRelations is enriched during export", () => {
  const legacy = {
    ...profile,
    meta: { ...profile.meta, formatVersion: "1.2.0" },
    ziwei: { ...profile.ziwei, palaceRelations: undefined }
  } as unknown as typeof profile;
  const prompt = buildAnalysisPrompt(legacy, {
    locale: "zh-CN",
    format: "markdown",
    system: "ziwei",
    mode: "general"
  });
  assert.match(prompt, /三合宫.+对宫/);
});

test("only program-gated traditional sources are included", () => {
  const known = createAstroProfile({
    name: "规则门禁命例",
    gender: "male",
    birthDateTime: "2001-01-29T13:32:00+08:00",
    calendar: "solar",
    timezone: "Asia/Shanghai",
    trueSolarTime: "none",
    sect: 1
  });
  const prompt = buildAnalysisPrompt(known, {
    locale: "zh-CN",
    format: "markdown",
    system: "bazi",
    mode: "general"
  });
  assert.match(prompt, /来源：八字提要·丑月壬日丁未时/);
  assert.match(prompt, /已满足条件/);
  assert.doesNotMatch(prompt, /来源：穷通宝鉴·正月壬水/);
  assert.doesNotMatch(prompt, /现代事实/);
});

test("XP keeps one necessary consent boundary without dropping direct analysis", () => {
  const zh = buildAnalysisPrompt(profile, { locale: "zh-CN", format: "markdown", system: "combined", mode: "xp" });
  const en = buildAnalysisPrompt(profile, { locale: "en", format: "markdown", system: "combined", mode: "xp" });
  assert.match(zh, /清醒、自愿且可撤回同意/);
  assert.match(zh, /核心私密偏好画像/);
  assert.match(en, /conscious, consenting adults/);
  assert.match(en, /Core private-preference profile/);
});

test("Da Liu Ren prompt uses normalized evidence, timing and source-gated Shen-Sha", () => {
  const chart = createCompleteLiurenChart({
    dateTime: "2026-04-10T08:26:00+08:00",
    timezone: "Asia/Shanghai",
    question: "这次合作能否谈成？"
  });
  const zh = buildLiurenAnalysisPrompt(chart, { locale: "zh-CN", question: "这次合作能否谈成？", format: "markdown" });
  const en = buildLiurenAnalysisPrompt(chart, { locale: "en", question: "Will this partnership close?", format: "txt" });
  assert.match(zh, /主客类神—四课三传—旺衰空墓—课体神煞/);
  assert.match(zh, /标准化主证/);
  assert.match(zh, /时间与应期证据/);
  assert.match(zh, /一句话直断/);
  assert.match(en, /subject\/object and class spirit/);
  assert.match(en, /One-sentence direct verdict/);

  const overview = buildLiurenAnalysisPrompt(chart, { locale: "zh-CN", question: "", format: "txt" });
  assert.match(overview, /不虚构类神、具体事件、成败或精确应期/);
  assert.doesNotMatch(overview, /1\. 一句话直断/);
});

test("legacy prompt and export entrypoints remain compatible", () => {
  assert.match(buildAiPrompt(profile), new RegExp(PROMPT_METHOD_ID));
  assert.doesNotThrow(() => JSON.parse(exportProfile(profile, "json")));
  assert.match(exportProfile(profile, "markdown"), /^#/);
  assert.doesNotMatch(exportProfile(profile, "txt"), /^#/);
});
