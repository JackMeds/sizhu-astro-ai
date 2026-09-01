import { astro } from "iztro";
import type {
  AstroInput,
  ZiweiHoroscopeItem,
  ZiweiHoroscopeSnapshot,
  ZiweiPalace,
  ZiweiPalaceReference,
  ZiweiPalaceRelation,
  ZiweiProfile,
  ZiweiStar
} from "./types.js";
import { createTimeProfile } from "./time.js";

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown) {
  return value == null ? "" : String(value);
}

function normalizeStar(value: unknown): ZiweiStar {
  if (typeof value === "string") return { name: value, type: "", scope: "" };
  const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    name: text(item.name ?? item.label),
    type: text(item.type),
    scope: text(item.scope),
    ...(item.brightness ? { brightness: text(item.brightness) } : {}),
    ...(item.mutagen ? { mutagen: text(item.mutagen) } : {})
  };
}

function normalizeStars(value: unknown): ZiweiStar[] {
  return asArray(value).map(normalizeStar).filter((star) => star.name);
}

function normalizeDecadal(value: unknown): ZiweiPalace["decadal"] {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const range = asArray(item.range).map(Number);
  if (range.length < 2 || !Number.isFinite(range[0]) || !Number.isFinite(range[1])) return null;
  return {
    range: [range[0] as number, range[1] as number],
    heavenlyStem: text(item.heavenlyStem),
    earthlyBranch: text(item.earthlyBranch)
  };
}

function normalizePalace(value: unknown): ZiweiPalace {
  const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    index: Number(item.index ?? -1),
    name: text(item.name ?? item.label),
    isBodyPalace: Boolean(item.isBodyPalace),
    isOriginalPalace: Boolean(item.isOriginalPalace),
    earthlyBranch: text(item.earthlyBranch ?? item.branch),
    heavenlyStem: text(item.heavenlyStem ?? item.stem),
    majorStars: normalizeStars(item.majorStars),
    minorStars: normalizeStars(item.minorStars),
    adjectiveStars: normalizeStars(item.adjectiveStars),
    changsheng12: text(item.changsheng12),
    boshi12: text(item.boshi12),
    jiangqian12: text(item.jiangqian12),
    suiqian12: text(item.suiqian12),
    decadal: normalizeDecadal(item.decadal),
    ages: asArray(item.ages).map(Number).filter(Number.isFinite),
    raw: item
  };
}

function normalizeHoroscopeItem(value: unknown): ZiweiHoroscopeItem {
  const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    index: Number(item.index ?? -1),
    name: text(item.name),
    heavenlyStem: text(item.heavenlyStem),
    earthlyBranch: text(item.earthlyBranch),
    palaceNames: asArray(item.palaceNames).map(text),
    mutagen: asArray(item.mutagen).map(text)
  };
}

function normalizeHoroscope(value: unknown): ZiweiHoroscopeSnapshot {
  const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const ageRaw = (item.age && typeof item.age === "object" ? item.age : {}) as Record<string, unknown>;
  return {
    solarDate: text(item.solarDate),
    lunarDate: text(item.lunarDate),
    decadal: normalizeHoroscopeItem(item.decadal),
    age: { ...normalizeHoroscopeItem(item.age), nominalAge: Number(ageRaw.nominalAge ?? 0) },
    yearly: normalizeHoroscopeItem(item.yearly),
    monthly: normalizeHoroscopeItem(item.monthly),
    daily: normalizeHoroscopeItem(item.daily),
    hourly: normalizeHoroscopeItem(item.hourly)
  };
}

const ZIWEI_TRINE_GROUPS: string[][] = [
  [..."申子辰"],
  [..."寅午戌"],
  [..."亥卯未"],
  [..."巳酉丑"]
];

const ZIWEI_OPPOSITES: Record<string, string> = {
  子: "午", 午: "子", 丑: "未", 未: "丑", 寅: "申", 申: "寅",
  卯: "酉", 酉: "卯", 辰: "戌", 戌: "辰", 巳: "亥", 亥: "巳"
};

function palaceReference(palace: ZiweiPalace): ZiweiPalaceReference {
  return { index: palace.index, name: palace.name, earthlyBranch: palace.earthlyBranch };
}

export function createZiweiPalaceRelations(palaces: ZiweiPalace[]): {
  relations: ZiweiPalaceRelation[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const grouped = new Map<string, ZiweiPalace[]>();
  for (const palace of palaces) {
    const branch = palace.earthlyBranch;
    if (!ZIWEI_OPPOSITES[branch]) {
      warnings.push(`紫微宫位${palace.name || palace.index}缺少有效地支，未生成三方四正关系。`);
      continue;
    }
    grouped.set(branch, [...(grouped.get(branch) ?? []), palace]);
  }

  const byBranch = new Map<string, ZiweiPalace>();
  for (const [branch, matches] of grouped) {
    if (matches.length !== 1) {
      warnings.push(`紫微地支${branch}对应${matches.length}个宫位，关系存在歧义，已停止自动配对。`);
      continue;
    }
    byBranch.set(branch, matches[0] as ZiweiPalace);
  }

  const relations: ZiweiPalaceRelation[] = [];
  for (const palace of palaces) {
    const branch = palace.earthlyBranch;
    if (byBranch.get(branch) !== palace) continue;
    const group = ZIWEI_TRINE_GROUPS.find((item) => item.includes(branch));
    if (!group) {
      warnings.push(`紫微地支${branch}未找到三合组，未生成关系。`);
      continue;
    }
    const trinePalaces = group.filter((item) => item !== branch).map((item) => byBranch.get(item));
    if (trinePalaces.length !== 2 || trinePalaces.some((item) => !item)) {
      warnings.push(`紫微${palace.name || branch}宫缺少完整三合宫，未生成三方关系。`);
      continue;
    }
    const opposite = byBranch.get(ZIWEI_OPPOSITES[branch] as string);
    if (!opposite) warnings.push(`紫微${palace.name || branch}宫缺少对宫，四正关系不完整。`);
    relations.push({
      palace: palaceReference(palace),
      trine: trinePalaces.map((item) => palaceReference(item as ZiweiPalace)) as [ZiweiPalaceReference, ZiweiPalaceReference],
      opposite: opposite ? palaceReference(opposite) : null
    });
  }

  return { relations, warnings: Array.from(new Set(warnings)) };
}

function buildAstrolabe(input: AstroInput) {
  const effective = createTimeProfile(input).effective;
  const timeIndex = Math.floor(((effective.hour + 1) % 24) / 2);
  const gender: "男" | "女" = input.gender === "male" ? "男" : "女";
  const astrolabe = astro.bySolar(effective.date, timeIndex, gender, true);
  return { effective, timeIndex, gender, astrolabe };
}

export function createZiweiProfile(input: AstroInput): ZiweiProfile {
  try {
    const { effective, timeIndex, gender, astrolabe } = buildAstrolabe(input);
    const raw = astrolabe as unknown as Record<string, unknown>;
    const palaces = asArray(raw.palaces).map(normalizePalace);
    const palaceRelations = createZiweiPalaceRelations(palaces);
    const natalMutagens = palaces.flatMap((palace) =>
      [...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars]
        .filter((star) => star.mutagen)
        .map((star) => ({ palace: palace.name, star: star.name, mutagen: star.mutagen as string }))
    );

    return {
      engine: "iztro",
      available: palaces.length > 0,
      solarDate: text(raw.solarDate),
      lunarDate: text(raw.lunarDate),
      chineseDate: text(raw.chineseDate),
      time: text(raw.time),
      timeRange: text(raw.timeRange),
      sign: text(raw.sign),
      zodiac: text(raw.zodiac),
      soulPalaceBranch: text(raw.earthlyBranchOfSoulPalace),
      bodyPalaceBranch: text(raw.earthlyBranchOfBodyPalace),
      soulStar: text(raw.soul),
      bodyStar: text(raw.body),
      fiveElementsClass: text(raw.fiveElementsClass),
      natalMutagens,
      palaces,
      palaceRelations: palaceRelations.relations,
      ...(palaceRelations.warnings.length ? { palaceRelationWarnings: palaceRelations.warnings } : {}),
      calculation: {
        solarDate: effective.date,
        timeIndex,
        shichen: effective.shichen,
        gender
      },
      raw: astrolabe
    };
  } catch (error) {
    return {
      engine: "iztro",
      available: false,
      palaces: [],
      palaceRelations: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Produce a normalized Zi Wei transit snapshot for a target solar date.
 * The natal chart and the transit calculation share the same effective birth time.
 */
export function createZiweiHoroscope(input: AstroInput, targetDate: string, targetHour?: number): ZiweiHoroscopeSnapshot {
  const { astrolabe } = buildAstrolabe(input);
  const timeIndex = typeof targetHour === "number" ? Math.floor(((targetHour + 1) % 24) / 2) : undefined;
  const horoscope = (astrolabe as unknown as { horoscope?: (date: string, timeIndex?: number) => unknown }).horoscope?.(targetDate, timeIndex);
  if (!horoscope) throw new Error("iztro 未返回运限数据");
  return normalizeHoroscope(horoscope);
}
