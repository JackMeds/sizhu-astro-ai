import assert from "node:assert/strict";
import test from "node:test";
import { createAstroProfile } from "../src/index.js";
import type { AstroInput } from "../src/index.js";

function input(birthDateTime: string, sect: 1 | 2 = 1): AstroInput {
  return {
    name: "benchmark",
    gender: "male",
    birthDateTime,
    calendar: "solar",
    timezone: "Asia/Shanghai",
    trueSolarTime: "none",
    sect
  };
}

function pillars(birthDateTime: string, sect: 1 | 2 = 1) {
  return createAstroProfile(input(birthDateTime, sect)).bazi.pillars.map((pillar) => pillar.ganZhi);
}

test("golden fixture: 2001-01-29 13:32 keeps the known four pillars", () => {
  assert.deepEqual(pillars("2001-01-29T13:32:00+08:00", 1), ["庚辰", "己丑", "壬辰", "丁未"]);
});

test("golden fixture: sect 1 changes the late-zi day boundary as documented upstream", () => {
  assert.deepEqual(pillars("1988-02-15T23:30:00+08:00", 1), ["戊辰", "甲寅", "辛丑", "戊子"]);
});

test("golden fixture: sect 2 keeps the civil-date day pillar at late zi", () => {
  assert.deepEqual(pillars("1988-02-15T23:30:00+08:00", 2), ["戊辰", "甲寅", "庚子", "戊子"]);
});

test("solar-term boundary fixture: year and month change across 2001 Li Chun", () => {
  const before = createAstroProfile(input("2001-02-04T01:30:00+08:00", 1)).bazi.pillars;
  const after = createAstroProfile(input("2001-02-04T03:30:00+08:00", 1)).bazi.pillars;
  assert.equal(before[0]?.ganZhi, "庚辰");
  assert.equal(before[1]?.ganZhi, "己丑");
  assert.equal(after[0]?.ganZhi, "辛巳");
  assert.equal(after[1]?.ganZhi, "庚寅");
});
