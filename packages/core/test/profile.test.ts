import assert from "node:assert/strict";
import test from "node:test";
import { createAstroProfile } from "../src/index.js";
import type { AstroInput } from "../src/index.js";

const sampleInput: AstroInput = {
  name: "测试命例",
  gender: "male",
  birthDateTime: "1992-08-08T08:30:00+08:00",
  calendar: "solar",
  timezone: "Asia/Shanghai",
  trueSolarTime: "none",
  sect: 1
};

test("createAstroProfile returns stable AI-readable top-level shape", () => {
  const profile = createAstroProfile(sampleInput);
  assert.deepEqual(Object.keys(profile), ["meta", "input", "bazi", "ziwei", "divination", "ai", "raw", "warnings"]);
  assert.equal(profile.meta.format, "astro-ai-profile");
  assert.equal(profile.bazi.pillars.length, 4);
  assert.ok(profile.ai.summary.includes("四柱"));
  assert.doesNotThrow(() => JSON.stringify(profile));
});

test("bazi profile includes core pillars, ten gods, element counts, and warnings array", () => {
  const profile = createAstroProfile(sampleInput);
  const day = profile.bazi.pillars.find((pillar) => pillar.key === "day");
  assert.ok(day);
  assert.equal(day?.tenGod, "日主");
  assert.ok(Object.keys(profile.bazi.elementCounts).includes("木"));
  assert.ok(Array.isArray(profile.warnings));
});

test("lunisolar cross check is represented without breaking profile generation", () => {
  const profile = createAstroProfile(sampleInput);
  assert.equal(profile.bazi.crossCheck?.engine, "lunisolar");
  assert.equal(typeof profile.bazi.crossCheck?.available, "boolean");
});

test("ziwei profile maps iztro output into palace collection or warning", () => {
  const profile = createAstroProfile(sampleInput);
  assert.equal(profile.ziwei.engine, "iztro");
  assert.equal(typeof profile.ziwei.available, "boolean");
  assert.ok(Array.isArray(profile.ziwei.palaces));
});

test("true solar time longitude correction affects the effective hour", () => {
  const standard = createAstroProfile({
    ...sampleInput,
    birthDateTime: "1992-08-08T00:30:00+08:00",
    trueSolarTime: "none"
  });
  const corrected = createAstroProfile({
    ...sampleInput,
    birthDateTime: "1992-08-08T00:30:00+08:00",
    trueSolarTime: "longitude",
    location: {
      name: "乌鲁木齐市 天山区",
      longitude: 87.63
    }
  });
  assert.notEqual(
    standard.bazi.pillars.find((pillar) => pillar.key === "time")?.branch,
    corrected.bazi.pillars.find((pillar) => pillar.key === "time")?.branch
  );
  assert.equal(corrected.warnings.some((warning) => warning.includes("尚未执行经度校正")), false);
});
