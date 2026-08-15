export type Gender = "male" | "female";
export type CalendarType = "solar" | "lunar";
export type TrueSolarTimeMode = "none" | "longitude" | "apparent";
export type DivinationKind = "liuren" | "liuyao";

export interface AstroInput {
  name: string;
  gender: Gender;
  birthDateTime: string;
  calendar: CalendarType;
  timezone: string;
  location?: {
    name?: string;
    longitude?: number;
    latitude?: number;
  };
  trueSolarTime: TrueSolarTimeMode;
  sect: 1 | 2;
}

export interface WallClockTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  date: string;
  time: string;
  isoLocal: string;
  shichen: string;
}

export interface TimeProfile {
  engine: "sizhu-time-v2";
  timezone: string;
  inputText: string;
  timezoneOffsetMinutes: number;
  standardMeridianLongitude: number;
  longitudeCorrectionMinutes: number | null;
  equationOfTimeMinutes: number;
  standard: WallClockTime;
  localMeanSolar: WallClockTime;
  apparentSolar: WallClockTime;
  effective: WallClockTime & {
    mode: TrueSolarTimeMode;
    label: string;
    correctionMinutes: number;
  };
  shichenChanged: boolean;
  dateChanged: boolean;
}

export interface PillarInfo {
  key: "year" | "month" | "day" | "time";
  label: string;
  stem: string;
  branch: string;
  ganZhi: string;
  hiddenStems: string[];
  tenGod: string;
  nayin: string;
  empty: string;
  element: string;
}

export interface BaziProfile {
  engine: "lunar-javascript";
  lunarText: string;
  solarText: string;
  zodiac: string;
  pillars: PillarInfo[];
  dayMaster: string;
  elementCounts: Record<string, number>;
  strengthHint: string;
  luck: {
    startText: string;
    dayun: Array<{
      startYear: number | null;
      startAge: number | null;
      ganZhi: string;
      tenGod: string;
      years: Array<{
        year: number | null;
        age: number | null;
        ganZhi: string;
        tenGod: string;
        months: Array<{
          index: number;
          label: string;
          ganZhi: string;
          tenGod: string;
        }>;
      }>;
    }>;
  };
  crossCheck?: {
    engine: "lunisolar";
    available: boolean;
    text?: string;
    error?: string;
  };
}

export interface ZiweiPalace {
  name: string;
  earthlyBranch: string;
  heavenlyStem: string;
  majorStars: string[];
  minorStars: string[];
  raw: unknown;
}

export interface ZiweiProfile {
  engine: "iztro";
  available: boolean;
  palaces: ZiweiPalace[];
  calculation?: {
    solarDate: string;
    timeIndex: number;
    shichen: string;
    gender: "男" | "女";
  };
  raw?: unknown;
  error?: string;
}

export interface DivinationProfile {
  liuren?: {
    available: boolean;
    source: "liuren-ts-lib" | "pending";
    summary: string;
    raw?: unknown;
    error?: string;
  };
  liuyao?: {
    available: boolean;
    source: "iching-shifa" | "pending";
    summary: string;
    raw?: unknown;
    error?: string;
  };
}

export interface AiReadableBlock {
  summary: string;
  evidence: Array<{
    label: string;
    value: string;
  }>;
  recommendedPromptSections: string[];
}

export interface AstroProfile {
  meta: {
    format: "astro-ai-profile";
    formatVersion: "1.1.0";
    generatedAt: string;
    source: "sizhu-astro-ai/core";
  };
  input: AstroInput;
  time: TimeProfile;
  bazi: BaziProfile;
  ziwei: ZiweiProfile;
  divination: DivinationProfile;
  ai: AiReadableBlock;
  raw: Record<string, unknown>;
  warnings: string[];
}
