import type { AstroInput, TimeProfile, TrueSolarTimeMode, WallClockTime } from "./types.js";

const SHICHEN = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

export type TimeZoneDisambiguation = "earlier" | "later";

type WallClockParts = Pick<WallClockTime, "year" | "month" | "day" | "hour" | "minute" | "second">;

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

function parseWallClockParts(value: string): WallClockParts {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) throw new Error(`无法解析本地日期时间：${value}`);
  const parts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0)
  };
  const validDate = parts.month >= 1 && parts.month <= 12 && parts.day >= 1 && parts.day <= daysInMonth(parts.year, parts.month);
  const validTime = parts.hour >= 0 && parts.hour <= 23 && parts.minute >= 0 && parts.minute <= 59 && parts.second >= 0 && parts.second <= 59;
  if (!validDate || !validTime) throw new Error(`无效的本地日期时间：${value}`);
  return parts;
}

function getFormatter(timezone: string) {
  const cached = FORMATTER_CACHE.get(timezone);
  if (cached) return cached;
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      calendar: "iso8601",
      numberingSystem: "latn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    });
  } catch {
    throw new Error(`无效的 IANA 时区：${timezone}`);
  }
  FORMATTER_CACHE.set(timezone, formatter);
  return formatter;
}

function partsAtInstant(timezone: string, epochMilliseconds: number): WallClockParts {
  const values: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {};
  for (const part of getFormatter(timezone).formatToParts(new Date(epochMilliseconds))) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

function sameWallClock(left: WallClockParts, right: WallClockParts) {
  return left.year === right.year && left.month === right.month && left.day === right.day
    && left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

function offsetAtInstant(timezone: string, epochMilliseconds: number) {
  const rounded = Math.trunc(epochMilliseconds / 1000) * 1000;
  const parts = partsAtInstant(timezone, rounded);
  const representedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((representedAsUtc - rounded) / 60000);
}

function resolveWallClock(timezone: string, wall: WallClockParts, disambiguation: TimeZoneDisambiguation) {
  const wallAsUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  const possibleOffsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 6) {
    possibleOffsets.add(offsetAtInstant(timezone, wallAsUtc + hours * 3600000));
  }
  const candidates = Array.from(possibleOffsets)
    .map((offsetMinutes) => ({ offsetMinutes, epochMilliseconds: wallAsUtc - offsetMinutes * 60000 }))
    .filter((candidate) => sameWallClock(partsAtInstant(timezone, candidate.epochMilliseconds), wall))
    .sort((left, right) => left.epochMilliseconds - right.epochMilliseconds);

  if (!candidates.length) {
    throw new Error(`本地时间 ${formatWallClock(wall)} 在时区 ${timezone} 中不存在，可能落在夏令时跳转区间。`);
  }
  return disambiguation === "later" ? candidates[candidates.length - 1] : candidates[0];
}

function formatWallClock(value: WallClockParts) {
  return `${value.year}-${pad2(value.month)}-${pad2(value.day)}T${pad2(value.hour)}:${pad2(value.minute)}:${pad2(value.second)}`;
}

function formatOffset(offsetMinutes: number) {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  return `${sign}${pad2(Math.floor(absolute / 60))}:${pad2(absolute % 60)}`;
}

export function getTimeZoneOffsetMinutes(
  timezone: string,
  localDateTime: string,
  disambiguation: TimeZoneDisambiguation = "earlier"
) {
  const wall = parseWallClockParts(localDateTime);
  return resolveWallClock(timezone, wall, disambiguation).offsetMinutes;
}

export function zonedLocalDateTimeToOffset(
  localDateTime: string,
  timezone: string,
  disambiguation: TimeZoneDisambiguation = "earlier"
) {
  if (/Z$|[+-]\d{2}:\d{2}$/.test(localDateTime)) return localDateTime;
  const wall = parseWallClockParts(localDateTime);
  const resolved = resolveWallClock(timezone, wall, disambiguation);
  return `${formatWallClock(wall)}${formatOffset(resolved.offsetMinutes)}`;
}

function parseWallClock(input: AstroInput): { wall: WallClockTime; offsetMinutes: number } {
  const parsed = parseWallClockParts(input.birthDateTime);
  const offsetMinutes = parseOffsetMinutes(input.birthDateTime)
    ?? getTimeZoneOffsetMinutes(input.timezone, input.birthDateTime);
  return { wall: buildWallClock(parsed.year, parsed.month, parsed.day, parsed.hour, parsed.minute, parsed.second), offsetMinutes };
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
