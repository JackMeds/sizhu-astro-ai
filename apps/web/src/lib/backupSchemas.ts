import { z } from "zod";

// Validate the complete shape used by the UI without regenerating, transforming,
// or relabelling stored calculation results. Unknown engine fields stay intact.
const obj = <T extends z.ZodRawShape>(shape: T) => z.object(shape).passthrough();
const text = z.string();
const num = z.number().finite();
const texts = z.array(text);
const optionalText = text.optional();
const wall = {
  year: num, month: num, day: num, hour: num, minute: num, second: num,
  date: text, time: text, isoLocal: text, shichen: text
};
const mode = z.enum(["none", "longitude", "apparent"]);
const star = obj({ name: text, type: text, scope: text, brightness: optionalText, mutagen: optionalText });
const reference = obj({ index: num, name: text, earthlyBranch: text });
const relation = obj({
  id: text, kind: text, label: text, status: text, ruleSet: z.literal("bazi-relations-v1"),
  participants: z.array(obj({ scope: text, label: text, key: optionalText, ganZhi: optionalText, stem: optionalText, branch: optionalText })),
  note: optionalText,
  transformation: obj({ targetElement: text, status: z.literal("candidate"), note: text }).optional()
});
const divination = obj({ available: z.boolean(), source: text, summary: text, raw: z.unknown().optional(), error: optionalText });

export const historyItemSchema = obj({
  id: text.min(1), name: text, generatedAt: text, birthDateTime: text, dayMaster: text, pillars: text,
  profile: obj({
    meta: obj({ format: z.literal("astro-ai-profile"), formatVersion: z.literal("1.3.0"), generatedAt: text, source: z.literal("sizhu-astro-ai/core") }),
    input: obj({
      name: text, gender: z.enum(["male", "female"]), birthDateTime: text, calendar: z.enum(["solar", "lunar"]), timezone: text,
      location: obj({ name: optionalText, longitude: num.optional(), latitude: num.optional() }).optional(),
      trueSolarTime: mode, sect: z.union([z.literal(1), z.literal(2)])
    }),
    time: obj({
      engine: z.literal("sizhu-time-v2"), timezone: text, inputText: text, timezoneOffsetMinutes: num,
      standardMeridianLongitude: num, longitudeCorrectionMinutes: num.nullable(), equationOfTimeMinutes: num,
      standard: obj(wall), localMeanSolar: obj(wall), apparentSolar: obj(wall),
      effective: obj({ ...wall, mode, label: text, correctionMinutes: num }), shichenChanged: z.boolean(), dateChanged: z.boolean()
    }),
    bazi: obj({
      engine: z.literal("lunar-javascript"), lunarText: text, solarText: text, zodiac: text,
      pillars: z.array(obj({ key: z.enum(["year", "month", "day", "time"]), label: text, stem: text, branch: text, ganZhi: text, hiddenStems: texts, tenGod: text, nayin: text, empty: text, element: text })).length(4),
      dayMaster: text, elementCounts: z.record(num), strengthHint: text,
      facts: obj({ version: z.literal("bazi-relations-v1"), natal: z.array(relation) }),
      luck: obj({ startText: text, dayun: z.array(obj({
        startYear: num.nullable(), startAge: num.nullable(), ganZhi: text, tenGod: text,
        years: z.array(obj({ year: num.nullable(), age: num.nullable(), ganZhi: text, tenGod: text,
          months: z.array(obj({ index: num, label: text, ganZhi: text, tenGod: text })) }))
      })) }),
      crossCheck: obj({ engine: z.literal("lunisolar"), available: z.boolean(), text: optionalText, error: optionalText }).optional()
    }),
    ziwei: obj({
      engine: z.literal("iztro"), available: z.boolean(),
      solarDate: optionalText, lunarDate: optionalText, chineseDate: optionalText, time: optionalText, timeRange: optionalText,
      sign: optionalText, zodiac: optionalText, soulPalaceBranch: optionalText, bodyPalaceBranch: optionalText,
      soulStar: optionalText, bodyStar: optionalText, fiveElementsClass: optionalText,
      natalMutagens: z.array(obj({ palace: text, star: text, mutagen: text })).optional(),
      palaces: z.array(obj({
        index: num, name: text, isBodyPalace: z.boolean(), isOriginalPalace: z.boolean(), earthlyBranch: text, heavenlyStem: text,
        majorStars: z.array(star), minorStars: z.array(star), adjectiveStars: z.array(star),
        changsheng12: text, boshi12: text, jiangqian12: text, suiqian12: text,
        decadal: obj({ range: z.tuple([num, num]), heavenlyStem: text, earthlyBranch: text }).nullable(), ages: z.array(num), raw: z.unknown()
      })),
      palaceRelations: z.array(obj({ palace: reference, trine: z.tuple([reference, reference]), opposite: reference.nullable() })),
      palaceRelationWarnings: texts.optional(),
      calculation: obj({ solarDate: text, timeIndex: num, shichen: text, gender: z.enum(["男", "女"]) }).optional(),
      raw: z.unknown().optional(), error: optionalText
    }),
    divination: obj({ liuren: divination.optional(), liuyao: divination.optional() }),
    ai: obj({ summary: text, evidence: z.array(obj({ label: text, value: text })), recommendedPromptSections: texts }),
    raw: z.record(z.unknown()), warnings: texts
  })
});

// Empty or unfinished input is a valid draft. Calculation validation still runs
// when the user submits it; migration only enforces the stored form's shape.
export const draftSchema = obj({
  name: text, gender: z.enum(["male", "female"]), birthDateTime: text,
  calendar: z.enum(["solar", "lunar"]), timezone: text,
  locationName: text, longitude: text, trueSolarTime: mode,
  sect: z.union([z.literal(1), z.literal(2)])
});
