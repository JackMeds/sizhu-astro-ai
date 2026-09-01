import assert from "node:assert/strict";
import test from "node:test";
import { createAstroProfile, createCompleteLiurenChart } from "@sizhu/core";
import { createPromptTransitContext } from "../src/components/ExportPanel";
import { buildAiText } from "../src/components/LiurenBetaPanel";
import { buildEnglishPrompt, buildPrompt, promptModes, type PromptMode } from "../src/lib/promptBuilder";

const profile = createAstroProfile({
  name: "提示词测试",
  gender: "female",
  birthDateTime: "1995-03-12T14:20:00+08:00",
  calendar: "solar",
  timezone: "Asia/Shanghai",
  trueSolarTime: "none",
  sect: 1
});

const chineseModeEvidence: Record<PromptMode, RegExp> = {
  general: /三至五个决定全局的核心结构|三至五个统领全局的结构/,
  relationship: /择偶画像/,
  career: /职业定位/,
  wealth: /主要进财路径/,
  health: /术数取象不代替医学事实/,
  yearly: /主事件、吉凶起伏|目标日期所在大运/,
  xp: /核心私密偏好画像/
};

test("every Chinese analysis mode demands a direct, evidence-backed reading", () => {
  for (const { key } of promptModes) {
    const prompt = buildPrompt(profile, key, "markdown", "combined");
    assert.match(prompt, chineseModeEvidence[key]);
    assert.match(prompt, key === "xp" ? /核心私密偏好画像/ : /有据必断，无据不编/);
    assert.doesNotMatch(prompt, /仅供娱乐/);
  }
});

test("Chinese XP respects the selected chart system while retaining its consent boundary", () => {
  const bazi = buildPrompt(profile, "xp", "markdown", "bazi");
  const ziwei = buildPrompt(profile, "xp", "markdown", "ziwei");
  assert.match(bazi, /分析体系：只看八字/);
  assert.doesNotMatch(bazi, /紫微斗数结构化资料/);
  assert.match(ziwei, /分析体系：只看紫微/);
  assert.doesNotMatch(ziwei, /八字四柱明细/);
  assert.match(ziwei, /清醒、自愿且可撤回同意/);
});

test("every English analysis mode avoids the former uncertainty-first template", () => {
  for (const { key } of promptModes) {
    const prompt = buildEnglishPrompt(profile, key, "markdown", "combined");
    assert.match(prompt, key === "xp" ? /Core private-preference profile/ : /Evidence demands judgment; missing evidence forbids invention/);
    assert.doesNotMatch(prompt, /Preserve uncertainty/);
    assert.doesNotMatch(prompt, /actions that do not depend on supernatural certainty/);
  }
});

test("Da Liu Ren copy prompts demand a direct answer in Chinese and English", () => {
  const chart = createCompleteLiurenChart({
    dateTime: "2026-04-10T08:26:00+08:00",
    timezone: "Asia/Shanghai",
    question: "这次合作能否谈成？"
  });
  const chinese = buildAiText(chart, "这次合作能否谈成？", false);
  const english = buildAiText(chart, "Will this partnership close?", true);
  assert.match(chinese, /一句话直断/);
  assert.match(chinese, /吉凶、成败、得失、过程和应期/);
  assert.match(english, /One-sentence direct verdict/);
  assert.match(english, /favorable\/unfavorable, success\/failure, gain\/loss, process and timing/);
  assert.doesNotMatch(english, /not modern scientific prediction/);
});

test("prompt transit context follows pinned, selected, then yearly-today precedence", () => {
  const pinned = createPromptTransitContext(profile, "yearly", "2030-01-02", "2029-01-02", ["2028-01-02", "2029-01-02"], "2027-01-02");
  assert.equal(pinned.targetDate, "2030-01-02");
  assert.equal(pinned.targetTransit?.targetDate, "2030-01-02");
  assert.equal(pinned.comparisonTransits?.length, 2);

  const selected = createPromptTransitContext(profile, "career", null, "2029-01-02", ["2028-01-02", "2029-01-02"], "2027-01-02");
  assert.equal(selected.targetDate, "2029-01-02");
  assert.equal(selected.comparisonTransits, undefined);

  const general = createPromptTransitContext(profile, "general", null, null, [], "2027-01-02");
  assert.equal(general.targetDate, null);

  const yearly = createPromptTransitContext(profile, "yearly", null, null, [], "2027-01-02");
  assert.equal(yearly.targetDate, "2027-01-02");

  const failed = createPromptTransitContext(profile, "yearly", "bad-date", null, [], "2027-01-02");
  assert.equal(failed.targetTransit, undefined);
  assert.match(failed.dataWarnings?.[0] ?? "", /动态运限计算失败/);
});
