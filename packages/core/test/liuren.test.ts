import assert from "node:assert/strict";
import test from "node:test";
import {
  createCompleteLiurenChart,
  createLiurenBaseChartFromCalendar,
  createLiurenFourCourses,
  createLiurenHeavenEarthDisk,
  createLiurenSkyGenerals,
  liurenNumberToBranch,
  prepareLiurenCalendarInput,
  type LiurenCalendarInput
} from "../src/index.js";

function pinnedFixture(): LiurenCalendarInput {
  return {
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
  };
}

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

test("native Liuren heaven-earth disk matches the pinned executable fixture", () => {
  const disk = createLiurenHeavenEarthDisk(pinnedFixture());

  assert.equal(disk.moonGeneral, "亥");
  assert.deepEqual(disk.heavenPlate, ["亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌"]);
  assert.deepEqual(disk.earthPlate, ["午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰", "巳"]);
  assert.equal(disk.earthToHeaven.午, "亥");
  assert.equal(disk.earthToHeaven.巳, "戌");
  assert.equal(disk.heavenToEarth.亥, "午");
  assert.equal(disk.referenceCommit, "3ba45a9540f08269b56d81508a061c7d46938785");
});

test("native Liuren sky generals match the pinned executable fixture", () => {
  const fixture = pinnedFixture();
  const disk = createLiurenHeavenEarthDisk(fixture);
  const generals = createLiurenSkyGenerals(fixture, disk);

  assert.equal(generals.dayOrNight, "晝");
  assert.equal(generals.noblemanHeavenBranch, "子");
  assert.equal(generals.noblemanEarthBranch, "未");
  assert.equal(generals.direction, "逆佈");
  assert.deepEqual(generals.alignedToHeavenPlate, ["蛇", "貴", "后", "陰", "玄", "常", "虎", "空", "龍", "勾", "合", "雀"]);
  assert.equal(generals.byHeavenBranch.子, "貴");
  assert.equal(generals.byHeavenBranch.巳, "虎");
});

test("native Liuren Four Courses match the pinned executable fixture", () => {
  const fixture = pinnedFixture();
  const disk = createLiurenHeavenEarthDisk(fixture);
  const generals = createLiurenSkyGenerals(fixture, disk);
  const courses = createLiurenFourCourses(fixture, disk, generals);

  assert.deepEqual(
    courses.upstreamOrder.map((course) => [course.pair, course.general]),
    [["巳子", "虎"], ["子未", "貴"], ["巳子", "虎"], ["子己", "貴"]]
  );
  assert.equal(courses.first.pair, "子己");
  assert.equal(courses.second.pair, "巳子");
  assert.equal(courses.third.pair, "子未");
  assert.equal(courses.fourth.pair, "巳子");
});

test("Liuren base chart keeps disk, generals and Four Courses in one deterministic bundle", () => {
  const chart = createLiurenBaseChartFromCalendar(pinnedFixture());

  assert.equal(chart.engine, "sizhu-liuren-ts");
  assert.equal(chart.engineVersion, "0.2.0");
  assert.equal(chart.disk.moonGeneral, "亥");
  assert.equal(chart.skyGenerals.alignedToHeavenPlate[0], "蛇");
  assert.equal(chart.fourCourses.first.pair, "子己");
});

test("reported-number casting wraps by twelve branches", () => {
  assert.deepEqual(liurenNumberToBranch(1), { branch: "子", normalized: 1 });
  assert.deepEqual(liurenNumberToBranch(12), { branch: "亥", normalized: 12 });
  assert.deepEqual(liurenNumberToBranch(13), { branch: "子", normalized: 1 });
  assert.deepEqual(liurenNumberToBranch(26), { branch: "丑", normalized: 2 });
  assert.throws(() => liurenNumberToBranch(0));
});

test("complete Liuren chart returns Three Transmissions, voids, patterns and source-gated ShenSha", () => {
  const chart = createCompleteLiurenChart({
    dateTime: "2026-04-10T08:26:00+08:00",
    timezone: "Asia/Shanghai",
    castingMethod: "time",
    question: "测试完整课"
  });

  assert.equal(chart.format, "sizhu-liuren-chart");
  assert.equal(chart.complete.engine, "mingyu-core");
  assert.equal(chart.complete.version, "0.1.23");
  assert.equal(chart.complete.fourLessons.length, 4);
  assert.equal(chart.complete.threeTransmissions.length, 3);
  assert.equal(chart.complete.xunKong.length, 2);
  assert.ok(chart.complete.transmissionRule.length > 0);
  assert.ok(chart.complete.threeTransmissions.every((item) => item.branch && item.god));
  assert.ok(chart.complete.threeTransmissions.every((item) => typeof item.dunGan === "string" && typeof item.liuQing === "string"));
  assert.ok(chart.complete.shenSha.length > 0);
  assert.ok(chart.complete.shenSha.every((item) => item.sources.length > 0));
  assert.equal(chart.engineManifest.complete, "mingyu-core@0.1.23");
  assert.equal(chart.crossCheck.status, "matched", chart.crossCheck.differences.join("\n"));
});

test("branch and number casting resolve to the selected final divination branch", () => {
  const branchChart = createCompleteLiurenChart({
    dateTime: "2026-04-10T08:26:00+08:00",
    timezone: "Asia/Shanghai",
    castingMethod: "branch",
    castingBranch: "酉"
  });
  assert.equal(branchChart.casting.resolvedBranch, "酉");
  assert.equal(branchChart.complete.divinationBranch, "酉");

  const numberChart = createCompleteLiurenChart({
    dateTime: "2026-04-10T08:26:00+08:00",
    timezone: "Asia/Shanghai",
    castingMethod: "number",
    castingNumber: 26
  });
  assert.equal(numberChart.casting.normalizedNumber, 2);
  assert.equal(numberChart.casting.resolvedBranch, "丑");
  assert.equal(numberChart.complete.divinationBranch, "丑");
});
