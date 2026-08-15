import assert from "node:assert/strict";
import test from "node:test";
import {
  auditBaziTraditionalRules,
  createAstroProfile,
  evaluateBaziTraditionalRules,
  getTraditionalRuleRegistry
} from "../src/index.js";
import type { AstroInput } from "../src/index.js";

const knownInput: AstroInput = {
  name: "规则门禁命例",
  gender: "male",
  birthDateTime: "2001-01-29T13:32:00+08:00",
  calendar: "solar",
  timezone: "Asia/Shanghai",
  trueSolarTime: "none",
  sect: 1
};

test("traditional rule registry is explicit and inspectable", () => {
  const registry = getTraditionalRuleRegistry();
  assert.ok(registry.some((rule) => rule.id === "bazi-tiyao-chou-ren-dingwei"));
  assert.ok(registry.some((rule) => rule.id === "qiongtong-ren-yin-month"));
});

test("known 丑月壬日丁未 chart matches its exact 八字提要 rule", () => {
  const profile = createAstroProfile(knownInput);
  const hits = evaluateBaziTraditionalRules(profile.bazi.pillars);
  const hit = hits.find((item) => item.ruleId === "bazi-tiyao-chou-ren-dingwei");
  assert.ok(hit);
  assert.equal(hit?.source.title, "八字提要");
  assert.equal(hit?.source.section, "丑月壬日丁未时");
  assert.ok(hit?.conditions.every((condition) => condition.matched));
  assert.match(hit?.boundary ?? "", /不自动推出吉凶|不等同于现代事实/);
});

test("正月壬水 text is blocked on a 丑月 chart", () => {
  const profile = createAstroProfile(knownInput);
  const audits = auditBaziTraditionalRules(profile.bazi.pillars);
  const audit = audits.find((item) => item.ruleId === "qiongtong-ren-yin-month");
  assert.ok(audit);
  assert.equal(audit?.status, "blocked");
  const monthGate = audit?.conditions.find((condition) => condition.field === "month.branch");
  assert.equal(monthGate?.actual, "丑");
  assert.equal(monthGate?.expected, "寅");
  assert.equal(monthGate?.matched, false);

  const hits = evaluateBaziTraditionalRules(profile.bazi.pillars);
  assert.equal(hits.some((item) => item.ruleId === "qiongtong-ren-yin-month"), false);
});
