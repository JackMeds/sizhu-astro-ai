import assert from "node:assert/strict";
import test from "node:test";
import {
  createLiurenHeavenEarthDisk,
  prepareLiurenCalendarInput
} from "../src/index.js";

test("liuren calendar bridge derives engine inputs from a civil datetime", () => {
  const result = prepareLiurenCalendarInput({
    dateTime: "2001-01-29T13:32:00+08:00",
    timezone: "Asia/Shanghai"
  });

  assert.equal(result.engineInputVersion, "kinliuren-calendar-input-v1");
  assert.equal(result.solarTerm, "大寒");
  assert.equal(result.lunarMonth, "正");
  assert.equal(result.dayGanZhi, "壬辰");
  assert.equal(result.hourGanZhi, "丁未");
  assert.equal(result.reference.engine, "kinliuren");
  assert.equal(result.reference.sourceCommit, "3ba45a9540f08269b56d81508a061c7d46938785");
  assert.equal(result.reference.historicalPyPI, "0.1.2.9");
});

test("liuren calendar bridge preserves an optional divination question without interpreting it", () => {
  const result = prepareLiurenCalendarInput({
    dateTime: "2001-01-29T13:32:00+08:00",
    timezone: "Asia/Shanghai",
    question: "测试占问"
  });

  assert.equal(result.question, "测试占问");
  assert.equal("interpretation" in result, false);
});

test("first native Liuren subsystem matches the pinned upstream README heaven-earth fixture", () => {
  const disk = createLiurenHeavenEarthDisk({
    engineInputVersion: "kinliuren-calendar-input-v1",
    effectiveDateTime: "fixture",
    solarTerm: "驚蟄",
    lunarMonth: "二",
    dayGanZhi: "己未",
    hourGanZhi: "甲午",
    reference: {
      engine: "kinliuren",
      sourceCommit: "3ba45a9540f08269b56d81508a061c7d46938785",
      historicalPyPI: "0.1.2.9",
      interface: "Liuren(solar_term, lunar_month, day_ganzhi, hour_ganzhi).result(0)"
    }
  });

  assert.equal(disk.moonGeneral, "亥");
  assert.deepEqual(disk.heavenPlate, ["亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌"]);
  assert.deepEqual(disk.earthPlate, ["午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰", "巳"]);
  assert.equal(disk.earthToHeaven.午, "亥");
  assert.equal(disk.earthToHeaven.巳, "戌");
  assert.equal(disk.heavenToEarth.亥, "午");
  assert.equal(disk.referenceCommit, "3ba45a9540f08269b56d81508a061c7d46938785");
});
