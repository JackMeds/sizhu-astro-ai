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

export type BaziRelationScope = "natal" | "dayun" | "year" | "month" | "custom";
export type BaziRelationKind =
  | "stem-combination"
  | "branch-liuhe"
  | "branch-clash"
  | "branch-harm"
  | "branch-break"
  | "branch-punishment"
  | "branch-self-punishment"
  | "three-harmony"
  | "three-meeting"
  | "fuyin";

export interface BaziRelationParticipant {
  scope: BaziRelationScope;
  key?: PillarInfo["key"];
  label: string;
  ganZhi?: string;
  stem?: string;
  branch?: string;
}

export interface BaziRelationFact {
  id: string;
  kind: BaziRelationKind;
  label: string;
  status: "observed" | "candidate" | "complete";
  participants: BaziRelationParticipant[];
  ruleSet: "bazi-relations-v1";
  note?: string;
  transformation?: {
    targetElement: string;
    status: "candidate";
    note: string;
  };
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
  facts: {
    version: "bazi-relations-v1";
    natal: BaziRelationFact[];
  };
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

export interface ZiweiStar {
  name: string;
  type: string;
  scope: string;
  brightness?: string;
  mutagen?: string;
}

export interface ZiweiPalace {
  index: number;
  name: string;
  isBodyPalace: boolean;
  isOriginalPalace: boolean;
  earthlyBranch: string;
  heavenlyStem: string;
  majorStars: ZiweiStar[];
  minorStars: ZiweiStar[];
  adjectiveStars: ZiweiStar[];
  changsheng12: string;
  boshi12: string;
  jiangqian12: string;
  suiqian12: string;
  decadal: {
    range: [number, number];
    heavenlyStem: string;
    earthlyBranch: string;
  } | null;
  ages: number[];
  raw: unknown;
}

export interface ZiweiHoroscopeItem {
  index: number;
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  palaceNames: string[];
  mutagen: string[];
}

export interface ZiweiHoroscopeSnapshot {
  solarDate: string;
  lunarDate: string;
  decadal: ZiweiHoroscopeItem;
  age: ZiweiHoroscopeItem & { nominalAge: number };
  yearly: ZiweiHoroscopeItem;
  monthly: ZiweiHoroscopeItem;
  daily: ZiweiHoroscopeItem;
  hourly: ZiweiHoroscopeItem;
}

export interface ZiweiProfile {
  engine: "iztro";
  available: boolean;
  solarDate?: string;
  lunarDate?: string;
  chineseDate?: string;
  time?: string;
  timeRange?: string;
  sign?: string;
  zodiac?: string;
  soulPalaceBranch?: string;
  bodyPalaceBranch?: string;
  soulStar?: string;
  bodyStar?: string;
  fiveElementsClass?: string;
  natalMutagens?: Array<{
    palace: string;
    star: string;
    mutagen: string;
  }>;
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
    formatVersion: "1.2.0";
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
