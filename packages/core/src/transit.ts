import { createAstroProfile } from "./profile.js";
import { createTransitBaziFacts } from "./relations.js";
import { createZiweiHoroscope } from "./ziwei.js";
import type { AstroInput, BaziRelationParticipant, TransitSnapshot } from "./types.js";

export function createTransitSnapshot(input: AstroInput, targetDate: string, targetHour?: number): TransitSnapshot {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
    throw new Error(`目标日期必须是 YYYY-MM-DD：${targetDate}`);
  }
  const targetYear = Number(targetDate.slice(0, 4));
  const profile = createAstroProfile(input);
  const dayun = profile.bazi.luck.dayun.find((item) => item.years.some((year) => year.year === targetYear)) ?? null;
  const year = dayun?.years.find((item) => item.year === targetYear) ?? null;
  const context: BaziRelationParticipant[] = [];
  const dayunFacts = dayun?.ganZhi && dayun.ganZhi !== "童限"
    ? createTransitBaziFacts(profile.bazi.pillars, { scope: "dayun", label: `${dayun.ganZhi}大运`, ganZhi: dayun.ganZhi })
    : [];

  if (dayun?.ganZhi && dayun.ganZhi !== "童限") {
    context.push({
      scope: "dayun",
      label: `${dayun.ganZhi}大运`,
      ganZhi: dayun.ganZhi,
      stem: dayun.ganZhi[0] ?? "",
      branch: dayun.ganZhi[1] ?? ""
    });
  }

  const yearFacts = year?.ganZhi
    ? createTransitBaziFacts(profile.bazi.pillars, { scope: "year", label: `${targetYear}流年`, ganZhi: year.ganZhi }, context)
    : [];
  const facts = Array.from(new Map([...dayunFacts, ...yearFacts].map((item) => [item.id, item])).values());

  return {
    format: "astro-transit-snapshot",
    formatVersion: "1.0.0",
    targetDate,
    targetYear,
    bazi: {
      dayun: dayun
        ? { startYear: dayun.startYear, startAge: dayun.startAge, ganZhi: dayun.ganZhi, tenGod: dayun.tenGod }
        : null,
      year: year ? { year: year.year, age: year.age, ganZhi: year.ganZhi, tenGod: year.tenGod } : null,
      facts
    },
    ziwei: createZiweiHoroscope(input, targetDate, targetHour)
  };
}
