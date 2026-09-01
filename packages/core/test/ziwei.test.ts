import assert from "node:assert/strict";
import test from "node:test";
import { createAstroProfile, createZiweiHoroscope, createZiweiPalaceRelations } from "../src/index.js";
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
  assert.equal(profile.meta.formatVersion, "1.3.0");
  assert.equal(profile.ziwei.palaceRelations.length, 12);
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

test("Zi Wei palace relations use branch trines and opposites independent of array order", () => {
  const profile = createAstroProfile(input);
  const expectedTrines: Record<string, string[]> = {
    申: ["子", "辰"], 子: ["申", "辰"], 辰: ["申", "子"],
    寅: ["午", "戌"], 午: ["寅", "戌"], 戌: ["寅", "午"],
    亥: ["卯", "未"], 卯: ["亥", "未"], 未: ["亥", "卯"],
    巳: ["酉", "丑"], 酉: ["巳", "丑"], 丑: ["巳", "酉"]
  };
  const opposites: Record<string, string> = {
    子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅",
    卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳"
  };

  for (const relation of profile.ziwei.palaceRelations) {
    assert.deepEqual(
      relation.trine.map((item) => item.earthlyBranch).sort(),
      [...(expectedTrines[relation.palace.earthlyBranch] ?? [])].sort()
    );
    assert.equal(relation.opposite?.earthlyBranch, opposites[relation.palace.earthlyBranch]);
  }

  const reversed = createZiweiPalaceRelations([...profile.ziwei.palaces].reverse());
  assert.equal(reversed.warnings.length, 0);
  assert.deepEqual(
    reversed.relations.map((item) => `${item.palace.earthlyBranch}:${item.trine.map((entry) => entry.earthlyBranch).sort().join("")}:${item.opposite?.earthlyBranch}`).sort(),
    profile.ziwei.palaceRelations.map((item) => `${item.palace.earthlyBranch}:${item.trine.map((entry) => entry.earthlyBranch).sort().join("")}:${item.opposite?.earthlyBranch}`).sort()
  );
});

test("Zi Wei palace relation builder reports incomplete or ambiguous branch data", () => {
  const profile = createAstroProfile(input);
  const missing = createZiweiPalaceRelations(profile.ziwei.palaces.slice(1));
  assert.ok(missing.warnings.length > 0);
  assert.ok(missing.relations.length < 12);

  const duplicated = createZiweiPalaceRelations([
    ...profile.ziwei.palaces,
    { ...profile.ziwei.palaces[0]!, index: 99, name: "重复宫" }
  ]);
  assert.ok(duplicated.warnings.some((item) => item.includes("关系存在歧义")));
  assert.ok(duplicated.relations.length < 12);
});
