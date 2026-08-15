import { Solar } from "lunar-javascript";
import type { AstroInput, TrueSolarTimeMode } from "./types.js";
import { createTimeProfile } from "./time.js";

export interface LiurenSessionInput {
  dateTime: string;
  timezone?: string;
  location?: AstroInput["location"];
  trueSolarTime?: TrueSolarTimeMode;
  question?: string;
}

export interface LiurenCalendarInput {
  engineInputVersion: "kinliuren-calendar-input-v1";
  effectiveDateTime: string;
  solarTerm: string;
  lunarMonth: string;
  dayGanZhi: string;
  hourGanZhi: string;
  question?: string;
  reference: {
    engine: "kinliuren";
    sourceCommit: "3ba45a9540f08269b56d81508a061c7d46938785";
    historicalPyPI: "0.1.2.9";
    interface: "Liuren(solar_term, lunar_month, day_ganzhi, hour_ganzhi).result(0)";
  };
}

export interface LiurenHeavenEarthDisk {
  engine: "sizhu-liuren-ts";
  engineVersion: "0.2.0";
  subsystem: "moon-general-heaven-earth";
  referenceCommit: "3ba45a9540f08269b56d81508a061c7d46938785";
  moonGeneral: string;
  heavenPlate: string[];
  earthPlate: string[];
  earthToHeaven: Record<string, string>;
  heavenToEarth: Record<string, string>;
}

export type LiurenDayNight = "晝" | "夜";
export type LiurenGeneralDirection = "順佈" | "逆佈";

export interface LiurenSkyGenerals {
  engine: "sizhu-liuren-ts";
  engineVersion: "0.2.0";
  subsystem: "sky-generals";
  referenceCommit: "3ba45a9540f08269b56d81508a061c7d46938785";
  option: 0;
  dayOrNight: LiurenDayNight;
  noblemanHeavenBranch: string;
  noblemanEarthBranch: string;
  direction: LiurenGeneralDirection;
  byHeavenBranch: Record<string, string>;
  alignedToHeavenPlate: string[];
}

export interface LiurenCourse {
  label: "一課" | "二課" | "三課" | "四課";
  pair: string;
  upper: string;
  lower: string;
  general: string;
}

export interface LiurenFourCourses {
  engine: "sizhu-liuren-ts";
  engineVersion: "0.2.0";
  subsystem: "four-courses";
  referenceCommit: "3ba45a9540f08269b56d81508a061c7d46938785";
  first: LiurenCourse;
  second: LiurenCourse;
  third: LiurenCourse;
  fourth: LiurenCourse;
  upstreamOrder: LiurenCourse[];
}

export interface LiurenBaseChart {
  engine: "sizhu-liuren-ts";
  engineVersion: "0.2.0";
  calendar: LiurenCalendarInput;
  disk: LiurenHeavenEarthDisk;
  skyGenerals: LiurenSkyGenerals;
  fourCourses: LiurenFourCourses;
}

const LUNAR_MONTH_NAMES = ["", "正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
const EARTHLY_BRANCHES = [..."子丑寅卯辰巳午未申酉戌亥"];
const SKY_GENERALS = [..."貴蛇雀合勾龍空虎常玄陰后"];
const DAYTIME_BRANCHES = new Set([..."卯辰巳午未申"]);
const REVERSE_GENERAL_EARTH_BRANCHES = new Set([..."巳午未申酉戌"]);
const HEAVENLY_STEM_LODGE: Record<string, string> = {
  甲: "寅", 乙: "辰", 丙: "巳", 丁: "未", 戊: "巳", 己: "未", 庚: "申", 辛: "戌", 壬: "亥", 癸: "丑"
};
const NOBLEMAN_START_OPTION_ZERO: Record<string, { 晝: string; 夜: string }> = {
  甲: { 晝: "丑", 夜: "未" },
  戊: { 晝: "丑", 夜: "未" },
  庚: { 晝: "丑", 夜: "未" },
  乙: { 晝: "子", 夜: "申" },
  己: { 晝: "子", 夜: "申" },
  丙: { 晝: "亥", 夜: "酉" },
  丁: { 晝: "亥", 夜: "酉" },
  壬: { 晝: "巳", 夜: "卯" },
  癸: { 晝: "巳", 夜: "卯" },
  辛: { 晝: "午", 夜: "寅" }
};
const TRADITIONAL_JIEQI: Record<string, string> = {
  小寒: "小寒",
  大寒: "大寒",
  立春: "立春",
  雨水: "雨水",
  惊蛰: "驚蟄",
  驚蟄: "驚蟄",
  春分: "春分",
  清明: "清明",
  谷雨: "穀雨",
  穀雨: "穀雨",
  立夏: "立夏",
  小满: "小滿",
  小滿: "小滿",
  芒种: "芒種",
  芒種: "芒種",
  夏至: "夏至",
  小暑: "小暑",
  大暑: "大暑",
  立秋: "立秋",
  处暑: "處暑",
  處暑: "處暑",
  白露: "白露",
  秋分: "秋分",
  寒露: "寒露",
  霜降: "霜降",
  立冬: "立冬",
  小雪: "小雪",
  大雪: "大雪",
  冬至: "冬至"
};

const MOON_GENERAL_BY_TERM: Record<string, string> = {
  雨水: "亥", 驚蟄: "亥",
  春分: "戌", 清明: "戌",
  穀雨: "酉", 立夏: "酉",
  小滿: "申", 芒種: "申",
  夏至: "未", 小暑: "未",
  大暑: "午", 立秋: "午",
  處暑: "巳", 白露: "巳",
  秋分: "辰", 寒露: "辰",
  霜降: "卯", 立冬: "卯",
  小雪: "寅", 大雪: "寅",
  冬至: "丑", 小寒: "丑",
  大寒: "子", 立春: "子"
};

function textCall(target: unknown, method: string): string {
  try {
    const value = (target as Record<string, () => unknown>)?.[method]?.();
    return value == null ? "" : String(value);
  } catch {
    return "";
  }
}

function objectCall(target: unknown, method: string): unknown {
  try {
    return (target as Record<string, () => unknown>)?.[method]?.();
  } catch {
    return undefined;
  }
}

function jieQiName(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const name = textCall(value, "getName");
  return name || String(value);
}

function rotateFrom(list: string[], start: string): string[] {
  const index = list.indexOf(start);
  if (index < 0) throw new Error(`未知地支：${start}`);
  return [...list.slice(index), ...list.slice(0, index)];
}

function zipRecord(keys: string[], values: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key, index) => [key, values[index] ?? ""]));
}

function toAstroTimeInput(input: LiurenSessionInput): AstroInput {
  return {
    name: "起课",
    gender: "male",
    birthDateTime: input.dateTime,
    calendar: "solar",
    timezone: input.timezone ?? "Asia/Shanghai",
    location: input.location,
    trueSolarTime: input.trueSolarTime ?? "none",
    // kinliuren's own calendar helper advances the civil day at 23:00.
    sect: 1
  };
}

/**
 * Convert a civil/solar-time moment into the exact four parameters expected by kinliuren.
 * This does not compute the full Da Liu Ren chart itself; it is the deterministic calendar bridge
 * shared by the pinned Python reference oracle and the browser TypeScript migration.
 */
export function prepareLiurenCalendarInput(input: LiurenSessionInput): LiurenCalendarInput {
  const astroInput = toAstroTimeInput(input);
  const effective = createTimeProfile(astroInput).effective;
  const solar = Solar.fromYmdHms(
    effective.year,
    effective.month,
    effective.day,
    effective.hour,
    effective.minute,
    effective.second
  );
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  (eightChar as { setSect?: (sect: number) => void }).setSect?.(1);

  const currentJieQi = objectCall(lunar, "getCurrentJieQi");
  const previousJieQi = objectCall(lunar, "getPrevJieQi");
  const rawJieQi = jieQiName(currentJieQi) || jieQiName(previousJieQi);
  const solarTerm = TRADITIONAL_JIEQI[rawJieQi] ?? rawJieQi;

  const rawMonth = Number((lunar as { getMonth?: () => number }).getMonth?.() ?? 0);
  const lunarMonth = LUNAR_MONTH_NAMES[Math.abs(rawMonth)] ?? String(Math.abs(rawMonth));
  const dayGanZhi = `${textCall(eightChar, "getDayGan")}${textCall(eightChar, "getDayZhi")}`;
  const hourGanZhi = `${textCall(eightChar, "getTimeGan")}${textCall(eightChar, "getTimeZhi")}`;

  if (!solarTerm || !lunarMonth || dayGanZhi.length !== 2 || hourGanZhi.length !== 2) {
    throw new Error("无法生成完整的大六壬历法输入，请检查起课时间与历法引擎结果。");
  }

  return {
    engineInputVersion: "kinliuren-calendar-input-v1",
    effectiveDateTime: effective.isoLocal,
    solarTerm,
    lunarMonth,
    dayGanZhi,
    hourGanZhi,
    ...(input.question ? { question: input.question } : {}),
    reference: {
      engine: "kinliuren",
      sourceCommit: "3ba45a9540f08269b56d81508a061c7d46938785",
      historicalPyPI: "0.1.2.9",
      interface: "Liuren(solar_term, lunar_month, day_ganzhi, hour_ganzhi).result(0)"
    }
  };
}

/**
 * Native TypeScript month-general + Heaven/Earth plate subsystem.
 * Mirrors kinliuren.sky_pan_list() + sky_n_earth_list() / earth_n_sky_list().
 */
export function createLiurenHeavenEarthDisk(input: LiurenCalendarInput): LiurenHeavenEarthDisk {
  const moonGeneral = MOON_GENERAL_BY_TERM[input.solarTerm];
  if (!moonGeneral) throw new Error(`尚未识别节气对应月将：${input.solarTerm}`);
  const hourBranch = input.hourGanZhi[1] ?? "";
  const heavenPlate = rotateFrom(EARTHLY_BRANCHES, moonGeneral);
  const earthPlate = rotateFrom(EARTHLY_BRANCHES, hourBranch);

  return {
    engine: "sizhu-liuren-ts",
    engineVersion: "0.2.0",
    subsystem: "moon-general-heaven-earth",
    referenceCommit: "3ba45a9540f08269b56d81508a061c7d46938785",
    moonGeneral,
    heavenPlate,
    earthPlate,
    earthToHeaven: zipRecord(earthPlate, heavenPlate),
    heavenToEarth: zipRecord(heavenPlate, earthPlate)
  };
}

/**
 * Native TypeScript sky-general subsystem for kinliuren `result(0)` semantics.
 * Mirrors guiren_starting_gangzhi(0), guiren_start_earth(0) and guiren_order_list(0).
 */
export function createLiurenSkyGenerals(
  input: LiurenCalendarInput,
  disk: LiurenHeavenEarthDisk = createLiurenHeavenEarthDisk(input)
): LiurenSkyGenerals {
  const dayStem = input.dayGanZhi[0] ?? "";
  const hourBranch = input.hourGanZhi[1] ?? "";
  const dayOrNight: LiurenDayNight = DAYTIME_BRANCHES.has(hourBranch) ? "晝" : "夜";
  const noblemanHeavenBranch = NOBLEMAN_START_OPTION_ZERO[dayStem]?.[dayOrNight];
  if (!noblemanHeavenBranch) throw new Error(`无法确定贵人起点：${input.dayGanZhi} / ${input.hourGanZhi}`);

  const noblemanEarthBranch = disk.heavenToEarth[noblemanHeavenBranch];
  if (!noblemanEarthBranch) throw new Error(`天地盘缺少贵人落地映射：${noblemanHeavenBranch}`);
  const direction: LiurenGeneralDirection = REVERSE_GENERAL_EARTH_BRANCHES.has(noblemanEarthBranch) ? "逆佈" : "順佈";
  const heavenBranchesFromNobleman = rotateFrom(EARTHLY_BRANCHES, noblemanHeavenBranch);
  const generalOrder = direction === "順佈"
    ? rotateFrom(SKY_GENERALS, "貴")
    : rotateFrom([...SKY_GENERALS].reverse(), "貴");
  const byHeavenBranch = zipRecord(heavenBranchesFromNobleman, generalOrder);

  return {
    engine: "sizhu-liuren-ts",
    engineVersion: "0.2.0",
    subsystem: "sky-generals",
    referenceCommit: "3ba45a9540f08269b56d81508a061c7d46938785",
    option: 0,
    dayOrNight,
    noblemanHeavenBranch,
    noblemanEarthBranch,
    direction,
    byHeavenBranch,
    alignedToHeavenPlate: disk.heavenPlate.map((branch) => byHeavenBranch[branch] ?? "")
  };
}

function createCourse(label: LiurenCourse["label"], pair: string, skyGenerals: LiurenSkyGenerals): LiurenCourse {
  const upper = pair[0] ?? "";
  const lower = pair[1] ?? "";
  return {
    label,
    pair,
    upper,
    lower,
    general: skyGenerals.byHeavenBranch[upper] ?? ""
  };
}

/**
 * Native TypeScript Four Courses subsystem.
 * Mirrors kinliuren.all_sike(), then attaches the sky general used by result(0).
 */
export function createLiurenFourCourses(
  input: LiurenCalendarInput,
  disk: LiurenHeavenEarthDisk = createLiurenHeavenEarthDisk(input),
  skyGenerals: LiurenSkyGenerals = createLiurenSkyGenerals(input, disk)
): LiurenFourCourses {
  const dayStem = input.dayGanZhi[0] ?? "";
  const dayBranch = input.dayGanZhi[1] ?? "";
  const stemLodge = HEAVENLY_STEM_LODGE[dayStem];
  if (!stemLodge) throw new Error(`无法确定日干寄宫：${dayStem}`);

  const firstUpper = disk.earthToHeaven[stemLodge];
  if (!firstUpper) throw new Error(`天地盘缺少一课寄宫映射：${stemLodge}`);
  const firstPair = `${firstUpper}${dayStem}`;

  const secondUpper = disk.earthToHeaven[firstUpper];
  if (!secondUpper) throw new Error(`天地盘缺少二课映射：${firstUpper}`);
  const secondPair = `${secondUpper}${firstUpper}`;

  const thirdUpper = disk.earthToHeaven[dayBranch];
  if (!thirdUpper) throw new Error(`天地盘缺少三课映射：${dayBranch}`);
  const thirdPair = `${thirdUpper}${dayBranch}`;

  const fourthUpper = disk.earthToHeaven[thirdUpper];
  if (!fourthUpper) throw new Error(`天地盘缺少四课映射：${thirdUpper}`);
  const fourthPair = `${fourthUpper}${thirdUpper}`;

  const first = createCourse("一課", firstPair, skyGenerals);
  const second = createCourse("二課", secondPair, skyGenerals);
  const third = createCourse("三課", thirdPair, skyGenerals);
  const fourth = createCourse("四課", fourthPair, skyGenerals);

  return {
    engine: "sizhu-liuren-ts",
    engineVersion: "0.2.0",
    subsystem: "four-courses",
    referenceCommit: "3ba45a9540f08269b56d81508a061c7d46938785",
    first,
    second,
    third,
    fourth,
    upstreamOrder: [fourth, third, second, first]
  };
}

export function createLiurenBaseChartFromCalendar(input: LiurenCalendarInput): LiurenBaseChart {
  const disk = createLiurenHeavenEarthDisk(input);
  const skyGenerals = createLiurenSkyGenerals(input, disk);
  const fourCourses = createLiurenFourCourses(input, disk, skyGenerals);
  return {
    engine: "sizhu-liuren-ts",
    engineVersion: "0.2.0",
    calendar: input,
    disk,
    skyGenerals,
    fourCourses
  };
}

export function createLiurenBaseChart(input: LiurenSessionInput): LiurenBaseChart {
  return createLiurenBaseChartFromCalendar(prepareLiurenCalendarInput(input));
}

export function createLiurenHeavenEarthFromSession(input: LiurenSessionInput): {
  calendar: LiurenCalendarInput;
  disk: LiurenHeavenEarthDisk;
} {
  const calendar = prepareLiurenCalendarInput(input);
  return { calendar, disk: createLiurenHeavenEarthDisk(calendar) };
}
