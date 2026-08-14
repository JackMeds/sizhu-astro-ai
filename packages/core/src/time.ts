import type { AstroInput, TimeProfile, TrueSolarTimeMode, WallClockTime } from "./types.js";

const SHICHEN = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseOffsetMinutes(value: string): number | null {
  if (value.endsWith("Z")) return 0;
  const match = value.match(/([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

function timezoneDefaultOffsetMinutes(timezone: string) {
  if (timezone === "Asia/Shanghai" || timezone === "Asia/Chongqing" || timezone === "Asia/Hong_Kong" || timezone === "Asia/Macau" || timezone === "Asia/Taipei") return 480;
  return 0;
}

function parseWallClock(input: AstroInput): { wall: WallClockTime; offsetMinutes: number } {
  const match = input.birthDateTime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) throw new Error(`无法解析出生时间：${input.birthDateTime}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] ?? 0);
  const offsetMinutes = parseOffsetMinutes(input.birthDateTime) ?? timezoneDefaultOffsetMinutes(input.timezone);
  return { wall: buildWallClock(year, month, day, hour, minute, second), offsetMinutes };
}

function shichenFromHour(hour: number) {
  return SHICHEN[Math.floor(((hour + 1) % 24) / 2)] ?? "子";
}

function buildWallClock(year: number, month: number, day: number, hour: number, minute: number, second: number): WallClockTime {
  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    date: `${year}-${pad2(month)}-${pad2(day)}`,
    time: `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`,
    isoLocal: `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}`,
    shichen: shichenFromHour(hour)
  };
}

function shiftWallClock(value: WallClockTime, minutes: number): WallClockTime {
  let year = value.year;
  let month = value.month;
  let day = value.day;
  let totalSeconds = value.hour * 3600 + value.minute * 60 + value.second + Math.round(minutes * 60);
  while (totalSeconds < 0) {
    totalSeconds += 86400;
    day -= 1;
    if (day < 1) {
      month -= 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
      day = daysInMonth(year, month);
    }
  }
  while (totalSeconds >= 86400) {
    totalSeconds -= 86400;
    day += 1;
    const maxDay = daysInMonth(year, month);
    if (day > maxDay) {
      day = 1;
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }
  }
  const hour = Math.floor(totalSeconds / 3600);
  const minute = Math.floor((totalSeconds % 3600) / 60);
  const second = totalSeconds % 60;
  return buildWallClock(year, month, day, hour, minute, second);
}

function standardMeridianLongitude(offsetMinutes: number) {
  return (offsetMinutes / 60) * 15;
}

function equationOfTimeMinutes(value: WallClockTime) {
  const start = Date.UTC(value.year, 0, 0);
  const current = Date.UTC(value.year, value.month - 1, value.day);
  const dayOfYear = Math.floor((current - start) / 86400000);
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

function effectiveModeLabel(mode: TrueSolarTimeMode) {
  if (mode === "longitude") return "地方平太阳时";
  if (mode === "apparent") return "视太阳时（真太阳时）";
  return "标准时";
}

export function createTimeProfile(input: AstroInput): TimeProfile {
  const { wall: standard, offsetMinutes } = parseWallClock(input);
  const meridian = standardMeridianLongitude(offsetMinutes);
  const longitude = input.location?.longitude;
  const longitudeCorrectionMinutes = typeof longitude === "number" && Number.isFinite(longitude) ? (longitude - meridian) * 4 : null;
  const eot = equationOfTimeMinutes(standard);
  const localMeanSolar = longitudeCorrectionMinutes == null ? standard : shiftWallClock(standard, longitudeCorrectionMinutes);
  const apparentSolar = longitudeCorrectionMinutes == null ? standard : shiftWallClock(standard, longitudeCorrectionMinutes + eot);
  const mode = input.trueSolarTime;
  const chosen = mode === "apparent" ? apparentSolar : mode === "longitude" ? localMeanSolar : standard;
  const correctionMinutes = mode === "apparent" ? (longitudeCorrectionMinutes ?? 0) + eot : mode === "longitude" ? longitudeCorrectionMinutes ?? 0 : 0;

  return {
    engine: "sizhu-time-v2",
    timezone: input.timezone,
    inputText: input.birthDateTime,
    timezoneOffsetMinutes: offsetMinutes,
    standardMeridianLongitude: meridian,
    longitudeCorrectionMinutes,
    equationOfTimeMinutes: Number(eot.toFixed(3)),
    standard,
    localMeanSolar,
    apparentSolar,
    effective: {
      ...chosen,
      mode,
      label: effectiveModeLabel(mode),
      correctionMinutes: Number(correctionMinutes.toFixed(3))
    },
    shichenChanged: standard.shichen !== chosen.shichen,
    dateChanged: standard.date !== chosen.date
  };
}

export function getEffectiveBirthDate(input: AstroInput): Date {
  const effective = createTimeProfile(input).effective;
  return new Date(Date.UTC(effective.year, effective.month - 1, effective.day, effective.hour, effective.minute, effective.second));
}
