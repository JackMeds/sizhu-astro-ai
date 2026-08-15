import assert from "node:assert/strict";
import test from "node:test";
import { prepareLiurenCalendarInput } from "../src/index.js";

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
  assert.equal(result.reference.release, "0.1.2.9");
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
