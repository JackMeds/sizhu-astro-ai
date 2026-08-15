import assert from "node:assert/strict";
import test from "node:test";
import { createTransitSnapshot } from "../src/index.js";
import type { AstroInput } from "../src/index.js";

const input: AstroInput = {
  name: "运限测试",
  gender: "male",
  birthDateTime: "2001-01-29T13:32:00+08:00",
  calendar: "solar",
  timezone: "Asia/Shanghai",
  trueSolarTime: "none",
  sect: 1
};

test("transit snapshot combines Bazi Da Yun/Liu Nian facts and Zi Wei scopes", () => {
  const snapshot = createTransitSnapshot(input, "2027-06-15");
  assert.equal(snapshot.format, "astro-transit-snapshot");
  assert.equal(snapshot.targetYear, 2027);
  assert.equal(snapshot.bazi.dayun?.ganZhi, "壬辰");
  assert.equal(snapshot.bazi.year?.year, 2027);
  assert.ok(snapshot.bazi.facts.some((fact) => fact.kind === "fuyin" && fact.label === "壬辰伏吟"));
  assert.ok(snapshot.ziwei.yearly.name);
  assert.ok(snapshot.ziwei.monthly.name);
});

test("transit snapshot rejects ambiguous target date formats", () => {
  assert.throws(() => createTransitSnapshot(input, "2027/06/15"), /YYYY-MM-DD/);
});
