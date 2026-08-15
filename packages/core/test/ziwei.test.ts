import assert from "node:assert/strict";
import test from "node:test";
import { createAstroProfile, createZiweiHoroscope } from "../src/index.js";
import type { AstroInput } from "../src/index.js";

const input: AstroInput = {
  name: "紫微测试",
  gender: "male",
  birthDateTime: "2001-01-29T13:32:00+08:00",
  calendar: "solar",
  timezone: "Asia/Shanghai",
  trueSolarTime: "none",
  sect: 1
};

test("normalized ziwei profile exposes core natal metadata", () => {
  const profile = createAstroProfile(input);
  assert.equal(profile.ziwei.available, true);
  assert.equal(profile.ziwei.palaces.length, 12);
  assert.ok(profile.ziwei.solarDate);
  assert.ok(profile.ziwei.lunarDate);
  assert.ok(profile.ziwei.soulPalaceBranch);
  assert.ok(profile.ziwei.bodyPalaceBranch);
  assert.ok(profile.ziwei.soulStar);
  assert.ok(profile.ziwei.bodyStar);
  assert.ok(profile.ziwei.fiveElementsClass);
  assert.ok(Array.isArray(profile.ziwei.natalMutagens));
});

test("normalized ziwei palace preserves stars, brightness/mutagen fields and decadal metadata", () => {
  const profile = createAstroProfile(input);
  const palace = profile.ziwei.palaces.find((item) => item.majorStars.length > 0) ?? profile.ziwei.palaces[0];
  assert.ok(palace);
  assert.equal(typeof palace?.index, "number");
  assert.equal(typeof palace?.name, "string");
  assert.ok(Array.isArray(palace?.majorStars));
  assert.ok(Array.isArray(palace?.minorStars));
  assert.ok(Array.isArray(palace?.adjectiveStars));
  assert.ok(Array.isArray(palace?.ages));
  if (palace?.decadal) {
    assert.equal(palace.decadal.range.length, 2);
  }
});

test("ziwei horoscope API returns normalized decadal/year/month/day/hour scopes", () => {
  const horoscope = createZiweiHoroscope(input, "2027-06-15");
  assert.equal(horoscope.solarDate, "2027-6-15");
  assert.ok(horoscope.decadal.name);
  assert.ok(horoscope.yearly.name);
  assert.ok(horoscope.monthly.name);
  assert.ok(horoscope.daily.name);
  assert.ok(horoscope.hourly.name);
  assert.equal(horoscope.yearly.mutagen.length, 4);
});
