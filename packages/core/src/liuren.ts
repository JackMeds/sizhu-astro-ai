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
    release: "0.1.2.9";
    interface: "Liuren(solar_term, lunar_month, day_ganzhi, hour_ganzhi).result(0)";
  };
}

const LUNAR_MONTH_NAMES = ["", "正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];
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
 * This does not compute the Da Liu Ren chart itself; it is the deterministic calendar bridge
 * used by the Python reference oracle and the future TypeScript engine.
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
      release: "0.1.2.9",
      interface: "Liuren(solar_term, lunar_month, day_ganzhi, hour_ganzhi).result(0)"
    }
  };
}
