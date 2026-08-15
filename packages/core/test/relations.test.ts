import assert from "node:assert/strict";
import test from "node:test";
import { createAstroProfile, createTransitBaziFacts } from "../src/index.js";
import type { AstroInput } from "../src/index.js";

const input: AstroInput = {
  name: "关系事实命例",
  gender: "male",
  birthDateTime: "2001-01-29T13:32:00+08:00",
  calendar: "solar",
  timezone: "Asia/Shanghai",
  trueSolarTime: "none",
  sect: 1
};

test("known natal chart exposes deterministic relation facts without auto-transforming", () => {
  const profile = createAstroProfile(input);
  const labels = profile.bazi.facts.natal.map((item) => item.label);

  assert.ok(labels.includes("丁壬合"));
  assert.equal(labels.filter((label) => label === "辰丑破").length, 2);
  assert.ok(labels.includes("辰辰自刑"));
  assert.ok(labels.includes("丑未冲"));
  assert.ok(labels.includes("丑未刑"));

  const dingRen = profile.bazi.facts.natal.find((item) => item.label === "丁壬合");
  assert.equal(dingRen?.transformation?.targetElement, "木");
  assert.equal(dingRen?.transformation?.status, "candidate");
  assert.ok(dingRen?.transformation?.note.includes("是否成立"));
});

test("transit fact API detects day-pillar fuyin for 壬辰 transit", () => {
  const profile = createAstroProfile(input);
  const facts = createTransitBaziFacts(profile.bazi.pillars, {
    scope: "dayun",
    label: "壬辰大运",
    ganZhi: "壬辰"
  });
  const fuyin = facts.find((item) => item.kind === "fuyin" && item.label === "壬辰伏吟");
  assert.ok(fuyin);
  assert.ok(fuyin?.participants.some((item) => item.key === "day"));
  assert.ok(fuyin?.participants.some((item) => item.scope === "dayun"));
});

test("relation facts remain structural and do not emit auspiciousness verdicts", () => {
  const profile = createAstroProfile(input);
  const serialized = JSON.stringify(profile.bazi.facts);
  assert.equal(serialized.includes("大吉"), false);
  assert.equal(serialized.includes("大凶"), false);
});
