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
  assert.deepEqual(Object.keys(profile), ["meta", "input", "time", "bazi", "ziwei", "divination", "ai", "raw", "warnings"]);
  assert.equal(profile.meta.formatVersion, "1.1.0");
  assert.equal(profile.bazi.pillars.length, 4);
  assert.ok(profile.ai.summary.includes("四柱"));
  assert.doesNotThrow(() => JSON.stringify(profile));
});

test("explicit +08 wall time is preserved independent of runtime timezone", () => {
  const profile = createAstroProfile({ ...sampleInput, birthDateTime: "2001-01-29T00:32:00+08:00" });
  assert.equal(profile.time.standard.date, "2001-01-29");
  assert.equal(profile.time.standard.time, "00:32:00");
  assert.equal(profile.time.standard.shichen, "子");
  assert.equal(profile.time.timezoneOffsetMinutes, 480);
});

test("bazi profile includes core pillars, ten gods, element counts, and neutral strength note", () => {
  const profile = createAstroProfile(sampleInput);
  const day = profile.bazi.pillars.find((pillar) => pillar.key === "day");
  assert.ok(day);
  assert.equal(day?.tenGod, "日主");
  assert.ok(Object.keys(profile.bazi.elementCounts).includes("木"));
  assert.ok(profile.bazi.strengthHint.includes("不直接等同"));
});

test("lunisolar cross check is represented without breaking profile generation", () => {
  const profile = createAstroProfile(sampleInput);
  assert.equal(profile.bazi.crossCheck?.engine, "lunisolar");
  assert.equal(typeof profile.bazi.crossCheck?.available, "boolean");
});

test("ziwei uses the exact effective wall date and shichen from the shared time pipeline", () => {
  const profile = createAstroProfile(sampleInput);
  assert.equal(profile.ziwei.engine, "iztro");
  assert.equal(profile.ziwei.calculation?.solarDate, profile.time.effective.date);
  assert.equal(profile.ziwei.calculation?.shichen, profile.time.effective.shichen);
});

test("local mean solar time longitude correction can cross a shichen boundary", () => {
  const standard = createAstroProfile({ ...sampleInput, birthDateTime: "1992-08-08T00:30:00+08:00", trueSolarTime: "none" });
  const corrected = createAstroProfile({
    ...sampleInput,
    birthDateTime: "1992-08-08T00:30:00+08:00",
    trueSolarTime: "longitude",
    location: { name: "乌鲁木齐市 天山区", longitude: 87.63 }
  });
  assert.notEqual(standard.time.effective.shichen, corrected.time.effective.shichen);
  assert.equal(corrected.time.effective.label, "地方平太阳时");
  assert.ok(Math.abs(corrected.time.longitudeCorrectionMinutes ?? 0) > 120);
});

test("apparent solar time includes equation of time in addition to longitude correction", () => {
  const mean = createAstroProfile({ ...sampleInput, trueSolarTime: "longitude", location: { longitude: 116.4 } });
  const apparent = createAstroProfile({ ...sampleInput, trueSolarTime: "apparent", location: { longitude: 116.4 } });
  assert.notEqual(mean.time.effective.correctionMinutes, apparent.time.effective.correctionMinutes);
  assert.equal(apparent.time.effective.label, "视太阳时（真太阳时）");
});
