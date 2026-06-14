import { LunarUtil, Solar } from "lunar-javascript";
import lunisolar from "lunisolar";
import type { AstroInput, BaziProfile, PillarInfo } from "./types.js";
import { getEffectiveBirthDate } from "./time.js";

const STEM_ELEMENTS: Record<string, string> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水"
};

const BRANCH_ELEMENTS: Record<string, string> = {
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  辰: "土",
  戌: "土",
  丑: "土",
  未: "土",
  申: "金",
  酉: "金",
  亥: "水",
  子: "水"
};

const HIDDEN_STEMS: Record<string, string[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "戊", "庚"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"]
};

const STEM_YINYANG: Record<string, "yang" | "yin"> = {
  甲: "yang",
  丙: "yang",
  戊: "yang",
  庚: "yang",
  壬: "yang",
  乙: "yin",
  丁: "yin",
  己: "yin",
  辛: "yin",
  癸: "yin"
};

const GENERATES: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

function callText(target: unknown, method: string): string {
  try {
    const value = (target as Record<string, () => unknown>)?.[method]?.();
    return value == null ? "" : String(value);
  } catch {
    return "";
  }
}

function getTenGod(dayStem: string, targetStem: string): string {
  if (!dayStem || !targetStem) return "";
  const dayElement = STEM_ELEMENTS[dayStem];
  const targetElement = STEM_ELEMENTS[targetStem];
  const samePolarity = STEM_YINYANG[dayStem] === STEM_YINYANG[targetStem];
  if (!dayElement || !targetElement) return "";
  if (dayElement === targetElement) return samePolarity ? "比肩" : "劫财";
  if (GENERATES[dayElement] === targetElement) return samePolarity ? "食神" : "伤官";
  if (GENERATES[targetElement] === dayElement) return samePolarity ? "偏印" : "正印";
  if (CONTROLS[dayElement] === targetElement) return samePolarity ? "偏财" : "正财";
  if (CONTROLS[targetElement] === dayElement) return samePolarity ? "七杀" : "正官";
  return "";
}

function getNayin(ganZhi: string): string {
  const table = LunarUtil as unknown as { NAYIN?: Record<string, string> };
  return table.NAYIN?.[ganZhi] ?? "";
}

function buildPillar(
  key: PillarInfo["key"],
  label: string,
  bazi: unknown,
  lunar: unknown,
  dayStem: string
): PillarInfo {
  const methodPrefix = key === "time" ? "Time" : key[0].toUpperCase() + key.slice(1);
  const stem = callText(bazi, `get${methodPrefix}Gan`);
  const branch = callText(bazi, `get${methodPrefix}Zhi`);
  const ganZhi = `${stem}${branch}`;
  const emptyMethod = `get${methodPrefix}XunKong`;
  return {
    key,
    label,
    stem,
    branch,
    ganZhi,
    hiddenStems: HIDDEN_STEMS[branch] ?? [],
    tenGod: key === "day" ? "日主" : getTenGod(dayStem, stem),
    nayin: getNayin(ganZhi),
    empty: callText(lunar, emptyMethod),
    element: STEM_ELEMENTS[stem] ?? BRANCH_ELEMENTS[branch] ?? ""
  };
}

function countElements(pillars: PillarInfo[]): Record<string, number> {
  const counts: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const pillar of pillars) {
    const stemElement = STEM_ELEMENTS[pillar.stem];
    const branchElement = BRANCH_ELEMENTS[pillar.branch];
    if (stemElement) counts[stemElement] += 1;
    if (branchElement) counts[branchElement] += 1;
    for (const hidden of pillar.hiddenStems) {
      const element = STEM_ELEMENTS[hidden];
      if (element) counts[element] += 0.35;
    }
  }
  return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, Number(value.toFixed(2))]));
}

function strengthHint(counts: Record<string, number>, dayStem: string): string {
  const dayElement = STEM_ELEMENTS[dayStem];
  if (!dayElement) return "日主强弱需结合月令、通根和格局进一步判断。";
  const resourceElement = Object.entries(GENERATES).find(([, generated]) => generated === dayElement)?.[0] ?? "";
  const support = counts[dayElement] + (counts[resourceElement] ?? 0);
  const max = Math.max(...Object.values(counts));
  if (counts[dayElement] >= max - 0.5) return `日主${dayElement}气在五行计数中偏显，可进一步审视泄耗制化。`;
  if (support < 2) return `日主${dayElement}气在初步计数中偏弱，需结合月令与大运确认。`;
  return `日主${dayElement}气势中和倾向，需结合月令、格局与大运细判。`;
}

function buildLuck(bazi: unknown, input: AstroInput): BaziProfile["luck"] {
  try {
    const gender = input.gender === "male" ? 1 : 0;
    const yun = (bazi as { getYun?: (gender: number, sect: number) => unknown }).getYun?.(gender, input.sect);
    const daYun = (yun as { getDaYun?: () => unknown[] })?.getDaYun?.() ?? [];
    const dayStem = callText(bazi, "getDayGan");
    return {
      startText: "",
      dayun: daYun.slice(0, 10).map((item) => {
        const startYear = (item as { getStartYear?: () => number }).getStartYear?.() ?? null;
        const startAge = (item as { getStartAge?: () => number }).getStartAge?.() ?? null;
        const ganZhi = (item as { getGanZhi?: () => string }).getGanZhi?.() || "童限";
        const liuNian = (item as { getLiuNian?: () => unknown[] }).getLiuNian?.() ?? [];
        return {
          startYear,
          startAge,
          ganZhi,
          tenGod: ganZhi.length >= 1 ? getTenGod(dayStem, ganZhi[0]) : "",
          years: liuNian.slice(0, 10).map((yearItem) => {
            const year = (yearItem as { getYear?: () => number }).getYear?.() ?? null;
            const age = (yearItem as { getAge?: () => number }).getAge?.() ?? null;
            const yearGanZhi = (yearItem as { getGanZhi?: () => string }).getGanZhi?.() ?? "";
            const liuYue = (yearItem as { getLiuYue?: () => unknown[] }).getLiuYue?.() ?? [];
            return {
              year,
              age,
              ganZhi: yearGanZhi,
              tenGod: yearGanZhi.length >= 1 ? getTenGod(dayStem, yearGanZhi[0]) : "",
              months: liuYue.slice(0, 12).map((monthItem, index) => {
                const monthGanZhi = (monthItem as { getGanZhi?: () => string }).getGanZhi?.() ?? "";
                return {
                  index: index + 1,
                  label: `${index + 1}月`,
                  ganZhi: monthGanZhi,
                  tenGod: monthGanZhi.length >= 1 ? getTenGod(dayStem, monthGanZhi[0]) : ""
                };
              })
            };
          })
        };
      })
    };
  } catch {
    return { startText: "", dayun: [] };
  }
}

function crossCheckWithLunisolar(date: Date): BaziProfile["crossCheck"] {
  try {
    const instance = lunisolar(date);
    return {
      engine: "lunisolar",
      available: true,
      text: String(instance?.format?.("lY年 lMlD lH时") ?? instance)
    };
  } catch (error) {
    return {
      engine: "lunisolar",
      available: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function createBaziProfile(input: AstroInput): BaziProfile {
  const date = getEffectiveBirthDate(input);
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();
  const bazi = lunar.getEightChar();
  const dayStem = callText(bazi, "getDayGan");
  const pillars = [
    buildPillar("year", "年柱", bazi, lunar, dayStem),
    buildPillar("month", "月柱", bazi, lunar, dayStem),
    buildPillar("day", "日柱", bazi, lunar, dayStem),
    buildPillar("time", "时柱", bazi, lunar, dayStem)
  ];
  const elementCounts = countElements(pillars);

  return {
    engine: "lunar-javascript",
    lunarText: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi()}时`,
    solarText: solar.toYmdHms(),
    zodiac: lunar.getYearShengXiao(),
    pillars,
    dayMaster: dayStem,
    elementCounts,
    strengthHint: strengthHint(elementCounts, dayStem),
    luck: buildLuck(bazi, input),
    crossCheck: crossCheckWithLunisolar(date)
  };
}
