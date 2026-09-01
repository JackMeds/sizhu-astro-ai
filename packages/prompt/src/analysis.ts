import {
  createZiweiPalaceRelations,
  evaluateBaziTraditionalRules,
  type AstroProfile,
  type TransitSnapshot,
  type ZiweiHoroscopeItem,
  type ZiweiPalaceRelation,
  type ZiweiStar
} from "@sizhu/core";

export const PROMPT_METHOD_ID = "mingxu-structured-traditional-v1" as const;

export type PromptLocale = "zh-CN" | "en";
export type PromptSystem = "combined" | "bazi" | "ziwei";
export type PromptMode = "general" | "relationship" | "career" | "wealth" | "health" | "yearly" | "xp";
export type AnalysisPromptFormat = "markdown" | "txt";

export interface AnalysisPromptOptions {
  locale: PromptLocale;
  format: AnalysisPromptFormat;
  system: PromptSystem;
  mode: PromptMode;
  question?: string;
  targetTransit?: TransitSnapshot;
  comparisonTransits?: TransitSnapshot[];
  dataWarnings?: string[];
}

type Localized = { zh: string; en: string };
type PromptSection = { title: Localized; body: string };

export const PROMPT_MODE_META: Record<PromptMode, { label: Localized; focus: Localized; required: Localized; ziweiTargets: Localized }> = {
  general: {
    label: { zh: "综合", en: "Overview" },
    focus: { zh: "先锁定三至五个决定全局的核心结构，明确格局强弱、喜忌、主要矛盾、人生优势短板、大运节奏与关键转折", en: "identify the three to five structures that control the chart, then judge overall strength, favorable and unfavorable forces, the main contradiction, decisive advantages, weaknesses and major turning points" },
    required: { zh: "不得平均罗列所有元素；必须说明什么最强、什么最弱、什么最值得优先处理，并落到性格、能力、关系、事业财富和当前阶段。", en: "Do not distribute equal attention across every symbol. State what is strongest, weakest and most consequential, then apply it to temperament, capability, relationships, career, wealth and the present stage." },
    ziweiTargets: { zh: "命宫、身宫为核心，联看财帛、官禄、迁移、夫妻、福德及各自三方四正", en: "center the Life and Body Palaces, then connect Wealth, Career, Travel, Spouse and Fortune with their trines and opposites" }
  },
  relationship: {
    label: { zh: "姻缘", en: "Relationships" },
    focus: { zh: "直接判断亲密关系模式、择偶画像、吸引与冲突来源、稳定度、婚恋节奏、关键年份及关系风险", en: "directly judge attraction patterns, partner profile, initiative and power balance, sources of intimacy and conflict, stability, commitment or separation tendencies and decisive periods" },
    required: { zh: "必须回答容易被什么样的人吸引、适合什么伴侣、谁更主动、主要冲突点、稳定与分合倾向，以及哪些运限最容易确定关系或发生转折。", en: "Answer who creates attraction, what partner profile fits, who tends to initiate, the main conflict pattern, stability versus separation, and the cycles most likely to bring commitment or rupture." },
    ziweiTargets: { zh: "夫妻宫为核心，联看命宫、福德、迁移及夫妻宫三方四正", en: "center the Spouse Palace and connect the Life, Fortune and Travel Palaces plus the Spouse Palace trines and opposite" }
  },
  career: {
    label: { zh: "事业", en: "Career" },
    focus: { zh: "直接判断职业定位、核心能力、竞争与组织关系、领导或专业路线、行业适配、升迁转型节奏与事业上限", en: "directly judge vocational position, strongest capabilities, competition and organizational dynamics, leadership versus specialist paths, suitable environments, advancement and likely ceiling" },
    required: { zh: "必须回答适合靠专业、管理、资源、创意还是经营发展，最明显的职场优势与短板，升迁、转型或创业节奏，以及当前应进攻还是蓄力。", en: "Answer whether development is strongest through expertise, management, resources, creativity or ownership; name the clearest advantage and liability, advancement or entrepreneurial timing, and whether the current stage favors attack or preparation." },
    ziweiTargets: { zh: "官禄宫为核心，联看命宫、财帛、迁移及官禄宫三方四正", en: "center the Career Palace and connect the Life, Wealth and Travel Palaces plus the Career Palace trines and opposite" }
  },
  wealth: {
    label: { zh: "财运", en: "Wealth" },
    focus: { zh: "直接判断主要进财路径、聚财与漏财机制、风险偏好、合作与投资取向、财富层次及阶段性机会", en: "directly judge earning channels, retention and leakage, risk appetite, cooperation and investment symbolism, wealth level, volatility and expansion or contraction stages" },
    required: { zh: "必须区分赚钱能力、守财能力、风险承受和财富波动，指出主要财富来源、破财机制、合作或独立何者更有利，以及哪些运限容易扩张或回撤。", en: "Separate earning capacity, retention, risk tolerance and volatility. Identify the main wealth mechanism, loss mechanism, cooperation versus independence, and cycles associated with expansion or drawdown." },
    ziweiTargets: { zh: "财帛宫为核心，联看官禄、田宅、福德及财帛宫三方四正", en: "center the Wealth Palace and connect Career, Property and Fortune plus the Wealth Palace trines and opposite" }
  },
  health: {
    label: { zh: "身心", en: "Well-being" },
    focus: { zh: "依传统五行与宫位取象，明确身心压力模式、易感部位、生活习惯弱点和阶段性风险；术数取象不代替医学事实", en: "use traditional Five-Phase and palace symbolism to identify stress patterns, comparatively vulnerable areas, habit weaknesses and higher-attention periods; symbolic inference does not replace medical fact" },
    required: { zh: "必须指出较强与较弱的身心信号、压力如何累积、哪些阶段更应留意；不得只输出作息、饮水、运动等通用建议。", en: "Identify the stronger and weaker mind-body signals, how stress accumulates and which periods deserve attention. Do not replace the reading with generic sleep, hydration or exercise advice." },
    ziweiTargets: { zh: "疾厄宫为核心，联看命宫、福德及疾厄宫三方四正", en: "center the Health Palace and connect the Life and Fortune Palaces plus the Health Palace trines and opposite" }
  },
  yearly: {
    label: { zh: "流年", en: "Transits" },
    focus: { zh: "结合目标日期所在大运与流年流月，明确每阶段的主事件、吉凶起伏、触发条件、行动窗口与需要回避的时间段", en: "combine the target date's major and minor cycles to judge dominant events, rises and falls, triggers, action windows and periods best avoided" },
    required: { zh: "必须按明确日期和时间顺序逐段判断，指出主线、机会、阻力、可能事件类型、转折点和行动窗口；不能只罗列干支、星曜或宫位变化。", en: "Proceed by explicit dates and chronological stages. State the dominant theme, opportunity, obstacle, plausible event type, turning point and action window; do not merely list Gan-Zhi, stars or palace changes." },
    ziweiTargets: { zh: "以目标日期的动态宫位范围与四化为主，回扣本命宫位及三方四正", en: "center the target date's dynamic palace scopes and transformations, then connect them back to natal palaces, trines and opposites" }
  },
  xp: {
    label: { zh: "XP（性癖）", en: "Private preferences" },
    focus: { zh: "成人亲密偏好、恋物材质、角色扮演、权力关系、感官触发、互动禁区与硬限制边界", en: "adult intimate preferences, materials and sensory triggers, role play, power exchange, arousal and inhibition patterns, interaction boundaries and hard limits" },
    required: { zh: "保留偏好、角色、材质、场景、感官、兴奋与抑制、边界和运限变化结构；命盘方法只负责提供证据，不改写这些分析维度。", en: "Retain the existing preference, role, material, scene, sensory, arousal, inhibition, boundary and cycle-change structure; chart methods provide evidence without replacing these dimensions." },
    ziweiTargets: { zh: "根据命宫、夫妻、福德、疾厄及其三方四正取证", en: "use the Life, Spouse, Fortune and Health Palaces with their trines and opposites as evidence" }
  }
};

export const PROMPT_SYSTEM_META: Record<PromptSystem, { label: Localized }> = {
  combined: { label: { zh: "八字 + 紫微", en: "BaZi + Zi Wei" } },
  bazi: { label: { zh: "只看八字", en: "BaZi only" } },
  ziwei: { label: { zh: "只看紫微", en: "Zi Wei only" } }
};

function pick(locale: PromptLocale, value: Localized) {
  return locale === "en" ? value.en : value.zh;
}

function renderPrompt(title: string, sections: PromptSection[], locale: PromptLocale, format: AnalysisPromptFormat) {
  if (format === "txt") return [title, `method: ${PROMPT_METHOD_ID}`, ...sections.flatMap((section) => [pick(locale, section.title), section.body])].join("\n\n");
  return [`# ${title}`, `\n> method: ${PROMPT_METHOD_ID}`, ...sections.map((section) => `\n## ${pick(locale, section.title)}\n\n${section.body}`)].join("\n");
}

function starText(star: ZiweiStar) {
  return `${star.name}${star.brightness ? `(${star.brightness})` : ""}${star.mutagen ? `[${star.mutagen}]` : ""}`;
}

function baseInfo(profile: AstroProfile, locale: PromptLocale) {
  return locale === "en"
    ? [
        `Name: ${profile.input.name}`,
        `Gender: ${profile.input.gender}`,
        `Calendar: ${profile.input.calendar}`,
        `Time zone: ${profile.input.timezone}`,
        `Standard wall time: ${profile.time.standard.isoLocal}`,
        `Effective calculation time: ${profile.time.effective.isoLocal}`,
        `Time basis: ${profile.time.effective.label} (${profile.time.effective.mode})`,
        `Location: ${profile.input.location?.name || "not supplied"}; longitude ${profile.input.location?.longitude ?? "not supplied"}`
      ].join("\n")
    : [
        `姓名：${profile.input.name}`,
        `性别：${profile.input.gender === "male" ? "男命" : "女命"}`,
        `历法：${profile.input.calendar === "solar" ? "阳历/公历" : "农历/阴历"}`,
        `时区：${profile.input.timezone}`,
        `标准时：${profile.time.standard.isoLocal}`,
        `正式计算时间：${profile.time.effective.isoLocal}`,
        `时间口径：${profile.time.effective.label}（${profile.time.effective.mode}）`,
        `出生地：${profile.input.location?.name || "未填"}；经度 ${profile.input.location?.longitude ?? "未填"}`
      ].join("\n");
}

function baziFacts(profile: AstroProfile, locale: PromptLocale) {
  if (!profile.bazi.facts.natal.length) return locale === "en" ? "No natal relation was identified by the encoded deterministic rules." : "当前已编码规则未识别到本命关系。";
  return profile.bazi.facts.natal.map((fact) => {
    const participants = fact.participants.map((item) => `${item.label}${item.ganZhi ? `(${item.ganZhi})` : ""}`).join(" ↔ ");
    const transformation = fact.transformation
      ? locale === "en" ? `; transformation toward ${fact.transformation.targetElement} remains a candidate` : `；合化${fact.transformation.targetElement}仍为候选`
      : "";
    const boundary = fact.note ? (locale === "en" ? `; boundary=${fact.note}` : `；边界=${fact.note}`) : "";
    return `- ${fact.label} [${fact.status}]${transformation}: ${participants}${boundary}`;
  }).join("\n");
}

function baziData(profile: AstroProfile, locale: PromptLocale) {
  const elements = Object.entries(profile.bazi.elementCounts).map(([key, value]) => `${key}=${value}`).join(", ");
  const pillars = profile.bazi.pillars.map((pillar) => locale === "en"
    ? `- ${pillar.label}: ${pillar.ganZhi}; stem ${pillar.stem}; branch ${pillar.branch}; Ten God ${pillar.tenGod || "not returned"}; hidden stems ${pillar.hiddenStems.join(", ") || "none"}; Na Yin ${pillar.nayin || "not returned"}; void ${pillar.empty || "not returned"}; element ${pillar.element || "not returned"}`
    : `- ${pillar.label}：${pillar.ganZhi}；天干${pillar.stem}；地支${pillar.branch}；十神${pillar.tenGod || "未取"}；藏干${pillar.hiddenStems.join("、") || "无"}；纳音${pillar.nayin || "未取"}；空亡${pillar.empty || "未取"}；五行${pillar.element || "未取"}`
  ).join("\n");
  const luck = profile.bazi.luck.dayun.slice(0, 10).map((cycle) => {
    const years = cycle.years.slice(0, 10).map((year) => `${year.year ?? "-"}/${year.age ?? "-"}${year.ganZhi}${year.tenGod ? `(${year.tenGod})` : ""}`).join(", ");
    return locale === "en"
      ? `- from age ${cycle.startAge ?? "-"}, year ${cycle.startYear ?? "-"}: ${cycle.ganZhi}${cycle.tenGod ? ` (${cycle.tenGod})` : ""}; annual sequence ${years || "not returned"}`
      : `- ${cycle.startAge ?? "-"}岁起，${cycle.startYear ?? "-"}年：${cycle.ganZhi}${cycle.tenGod ? `（${cycle.tenGod}）` : ""}；流年 ${years || "暂无"}`;
  }).join("\n");
  return locale === "en"
    ? `Solar: ${profile.bazi.solarText}\nLunar: ${profile.bazi.lunarText}\nZodiac: ${profile.bazi.zodiac}\nDay Master: ${profile.bazi.dayMaster}\nFive-Phase structural counts: ${elements}\nStrength boundary: ${profile.bazi.strengthHint}\n\n### Four Pillars\n${pillars}\n\n### Deterministic structural relations\n${baziFacts(profile, locale)}\n\n### Major and annual cycles\n${luck || "No cycle data returned."}`
    : `阳历：${profile.bazi.solarText}\n农历：${profile.bazi.lunarText}\n生肖：${profile.bazi.zodiac}\n日主：${profile.bazi.dayMaster}\n五行结构计数：${elements}\n旺衰边界：${profile.bazi.strengthHint}\n\n### 四柱\n${pillars}\n\n### 确定性关系事实\n${baziFacts(profile, locale)}\n\n### 大运与流年\n${luck || "暂无大运数据。"}`;
}

function resolvedRelations(profile: AstroProfile): ZiweiPalaceRelation[] {
  const existing = (profile.ziwei as AstroProfile["ziwei"] & { palaceRelations?: ZiweiPalaceRelation[] }).palaceRelations;
  return existing?.length ? existing : createZiweiPalaceRelations(profile.ziwei.palaces).relations;
}

function ziweiData(profile: AstroProfile, locale: PromptLocale) {
  if (!profile.ziwei.available) return locale === "en" ? `Zi Wei unavailable: ${profile.ziwei.error || "no palace data returned"}` : `紫微斗数不可用：${profile.ziwei.error || "未返回宫位"}`;
  const relations = new Map(resolvedRelations(profile).map((item) => [item.palace.index, item]));
  const palaces = profile.ziwei.palaces.slice(0, 12).map((palace) => {
    const relation = relations.get(palace.index);
    const major = palace.majorStars.map(starText).join(locale === "en" ? ", " : "、") || (locale === "en" ? "none" : "无");
    const minor = palace.minorStars.map(starText).join(locale === "en" ? ", " : "、") || (locale === "en" ? "none" : "无");
    const adjective = palace.adjectiveStars.map(starText).join(locale === "en" ? ", " : "、") || (locale === "en" ? "none" : "无");
    const trine = relation?.trine.map((item) => `${item.name}(${item.earthlyBranch})`).join(locale === "en" ? ", " : "、") || (locale === "en" ? "unavailable" : "未取");
    const opposite = relation?.opposite ? `${relation.opposite.name}(${relation.opposite.earthlyBranch})` : (locale === "en" ? "unavailable" : "未取");
    const decadal = palace.decadal ? `${palace.decadal.range[0]}–${palace.decadal.range[1]} ${palace.decadal.heavenlyStem}${palace.decadal.earthlyBranch}` : (locale === "en" ? "none" : "无");
    return locale === "en"
      ? `- ${palace.name}${palace.isBodyPalace ? " (Body Palace)" : ""}: ${palace.heavenlyStem}${palace.earthlyBranch}; major ${major}; supporting ${minor}; adjective/misc ${adjective}; Changsheng ${palace.changsheng12 || "not returned"}; trines ${trine}; opposite ${opposite}; decadal ${decadal}`
      : `- ${palace.name}${palace.isBodyPalace ? "（身宫）" : ""}：${palace.heavenlyStem}${palace.earthlyBranch}；主星${major}；辅星${minor}；杂曜/形容星${adjective}；长生十二神${palace.changsheng12 || "未取"}；三合宫${trine}；对宫${opposite}；大限${decadal}`;
  }).join("\n");
  const mutagens = profile.ziwei.natalMutagens?.length
    ? profile.ziwei.natalMutagens.map((item) => `${item.star}${item.mutagen}@${item.palace}`).join(locale === "en" ? ", " : "、")
    : locale === "en" ? "not returned" : "未取到";
  return locale === "en"
    ? `Life Palace branch: ${profile.ziwei.soulPalaceBranch || "-"}\nBody Palace branch: ${profile.ziwei.bodyPalaceBranch || "-"}\nSoul ruler: ${profile.ziwei.soulStar || "-"}\nBody ruler: ${profile.ziwei.bodyStar || "-"}\nFive-Phase class: ${profile.ziwei.fiveElementsClass || "-"}\nNatal transformations: ${mutagens}\n\n### Twelve palaces with deterministic trines and opposites\n${palaces}`
    : `命宫地支：${profile.ziwei.soulPalaceBranch || "-"}\n身宫地支：${profile.ziwei.bodyPalaceBranch || "-"}\n命主：${profile.ziwei.soulStar || "-"}\n身主：${profile.ziwei.bodyStar || "-"}\n五行局：${profile.ziwei.fiveElementsClass || "-"}\n生年四化：${mutagens}\n\n### 十二宫及确定性三方四正\n${palaces}`;
}

function sourcedRules(profile: AstroProfile, locale: PromptLocale) {
  const hits = evaluateBaziTraditionalRules(profile.bazi.pillars);
  if (!hits.length) return locale === "en" ? "No source-gated traditional rule matched this chart." : "当前没有满足全部程序门禁条件的传统条文。";
  return hits.map((hit) => {
    const conditions = hit.conditions.map((item) => `${item.field}=${item.actual}`).join(", ");
    const boundary = hit.boundary.includes("现代事实")
      ? "已满足条文入门条件；仍需结合全局判断吉凶、格局及合化是否成立。"
      : hit.boundary;
    return locale === "en"
      ? `- Source: ${hit.source.title} · ${hit.source.section}; matched conditions: ${conditions}; rule summary: ${hit.summary}; remaining boundary: ${boundary}; evidence grade: supplementary source evidence. Do not invent a quotation, edition or page number.`
      : `- 来源：${hit.source.title}·${hit.source.section}；已满足条件：${conditions}；条文摘要：${hit.summary}；后续边界：${boundary}；证据等级：有来源的补充证据。不得伪造原文、版本或页码。`;
  }).join("\n");
}

function horoscopeItem(item: ZiweiHoroscopeItem, locale: PromptLocale) {
  const mutagens = item.mutagen.length ? item.mutagen.map((value, index) => `${["禄", "权", "科", "忌"][index] ?? index + 1}:${value}`).join(" · ") : (locale === "en" ? "none" : "无");
  return `${item.name || `${item.heavenlyStem}${item.earthlyBranch}`} (${item.heavenlyStem}${item.earthlyBranch}); ${locale === "en" ? "palaces" : "宫位"}=${item.palaceNames.join(", ") || "-"}; ${locale === "en" ? "transformations" : "四化"}=${mutagens}`;
}

function transitData(snapshot: TransitSnapshot, locale: PromptLocale) {
  const facts = snapshot.bazi.facts.length ? snapshot.bazi.facts.map((fact) => `- ${fact.label}: ${fact.participants.map((item) => `${item.label}(${item.ganZhi})`).join(" ↔ ")}`).join("\n") : (locale === "en" ? "- none" : "- 无");
  return locale === "en"
    ? `Target date: ${snapshot.targetDate}\nBaZi major cycle: ${snapshot.bazi.dayun ? `${snapshot.bazi.dayun.ganZhi} (${snapshot.bazi.dayun.tenGod}) from age ${snapshot.bazi.dayun.startAge ?? "-"}` : "not covered"}\nBaZi annual: ${snapshot.bazi.year ? `${snapshot.bazi.year.ganZhi} (${snapshot.bazi.year.tenGod})` : "not covered"}\nDynamic relation facts:\n${facts}\nZi Wei decadal: ${horoscopeItem(snapshot.ziwei.decadal, locale)}\nZi Wei age scope: ${horoscopeItem(snapshot.ziwei.age, locale)}\nZi Wei annual: ${horoscopeItem(snapshot.ziwei.yearly, locale)}\nZi Wei monthly: ${horoscopeItem(snapshot.ziwei.monthly, locale)}\nZi Wei daily: ${horoscopeItem(snapshot.ziwei.daily, locale)}\nZi Wei hourly: ${horoscopeItem(snapshot.ziwei.hourly, locale)}`
    : `目标日期：${snapshot.targetDate}\n八字大运：${snapshot.bazi.dayun ? `${snapshot.bazi.dayun.ganZhi}（${snapshot.bazi.dayun.tenGod}，${snapshot.bazi.dayun.startAge ?? "-"}岁起）` : "未覆盖"}\n八字流年：${snapshot.bazi.year ? `${snapshot.bazi.year.ganZhi}（${snapshot.bazi.year.tenGod}）` : "未覆盖"}\n动态关系事实：\n${facts}\n紫微大限：${horoscopeItem(snapshot.ziwei.decadal, locale)}\n紫微小限：${horoscopeItem(snapshot.ziwei.age, locale)}\n紫微流年：${horoscopeItem(snapshot.ziwei.yearly, locale)}\n紫微流月：${horoscopeItem(snapshot.ziwei.monthly, locale)}\n紫微流日：${horoscopeItem(snapshot.ziwei.daily, locale)}\n紫微流时：${horoscopeItem(snapshot.ziwei.hourly, locale)}`;
}

function comparisonData(snapshots: TransitSnapshot[], locale: PromptLocale) {
  if (snapshots.length < 2) return "";
  return snapshots.slice(0, 5).map((snapshot) => locale === "en"
    ? `- ${snapshot.targetDate}: BaZi ${snapshot.bazi.dayun?.ganZhi || "-"} / ${snapshot.bazi.year?.ganZhi || "-"}; ${snapshot.bazi.facts.length} dynamic facts; Zi Wei annual ${snapshot.ziwei.yearly.name || `${snapshot.ziwei.yearly.heavenlyStem}${snapshot.ziwei.yearly.earthlyBranch}`}; transformations ${snapshot.ziwei.yearly.mutagen.join(", ") || "none"}`
    : `- ${snapshot.targetDate}：八字${snapshot.bazi.dayun?.ganZhi || "-"}大运 / ${snapshot.bazi.year?.ganZhi || "-"}流年；${snapshot.bazi.facts.length}条动态关系；紫微流年${snapshot.ziwei.yearly.name || `${snapshot.ziwei.yearly.heavenlyStem}${snapshot.ziwei.yearly.earthlyBranch}`}；四化${snapshot.ziwei.yearly.mutagen.join("、") || "无"}`
  ).join("\n");
}

const BAZI_METHOD: Localized = {
  zh: "方法锚点：子平结构法。严格依次处理：1. 时间口径与四柱；2. 月令、季节、寒暖燥湿；3. 日主通根、透干和承载能力；4. 十神组合与格局主线；5. 生克制化、清浊、救应和主要矛盾；6. 调候修正；7. 刑冲合害及合化成立条件；8. 喜忌与取用方向；9. 大运阶段环境；10. 流年流月触发。禁止仅按五行数量判断旺衰、见单个十神即断事、把候选合化写成成立，或并列多套喜用而不给主判断。",
  en: "Method anchor: structural Zi Ping. Follow this order: 1. time basis and pillars; 2. seasonal command and climate; 3. roots, exposed stems and Day-Master carrying capacity; 4. Ten-God combinations and structural pattern; 5. regulation, clarity, remedy and the main contradiction; 6. climate adjustment; 7. combinations, clashes and transformation conditions; 8. favorable and useful directions; 9. major-cycle environment; 10. annual and monthly triggers. Never judge strength from element counts alone, infer an event from one Ten God, promote a candidate transformation to fact, or list conflicting useful elements without a primary judgment."
};

function ziweiMethod(mode: PromptMode): Localized {
  return {
    zh: `方法锚点：宫位—三方四正—星系组合—四化—限运。严格依次处理：1. 命宫、身宫、五行局；2. 根据问题确定目标宫位；3. 同看目标宫、两个三合宫和对宫；4. 主星组合；5. 辅星、杂曜、亮度、同宫夹拱；6. 生年四化及宫位链；7. 大限、小限和目标日期动态层；8. 事件领域、强度、过程和时间。本模式宫位重点：${PROMPT_MODE_META[mode].ziweiTargets.zh}。禁止以单星、单宫或单个化忌定论，不得混淆本命结构与动态触发。`,
    en: `Method anchor: palace → trines/opposite → star combinations → transformations → cycles. Follow this order: 1. Life Palace, Body Palace and Five-Phase class; 2. choose the target palace from the question; 3. read the target, two trines and opposite together; 4. major-star combination; 5. supporting and miscellaneous stars, brightness and surrounding relations; 6. natal transformations and palace chain; 7. decadal, age and target-date dynamic layers; 8. event domain, strength, process and timing. Mode targets: ${PROMPT_MODE_META[mode].ziweiTargets.en}. Never judge from one star, one palace or one Ji transformation, and never merge natal structure with a dynamic trigger.`
  };
}

function systemMethod(system: PromptSystem, mode: PromptMode, locale: PromptLocale) {
  if (system === "bazi") return pick(locale, BAZI_METHOD);
  if (system === "ziwei") return pick(locale, ziweiMethod(mode));
  return locale === "en"
    ? `${BAZI_METHOD.en}\n\n${ziweiMethod(mode).en}\n\nComplete the BaZi judgment first for structure, mechanism and timing; then complete the Zi Wei judgment for domains, people and event placement. State evidence separately, cross-confirm only same-direction conclusions, name conflicts, and never merge the two vocabularies into a new system.`
    : `${BAZI_METHOD.zh}\n\n${ziweiMethod(mode).zh}\n\n合看顺序：八字先完成结构、机制和时间节奏判断；紫微再完成人物、领域和事件落点判断。分别列证据，只把同向结论写成相互印证；不同向时说明时间层级、观察领域或方法逻辑差异，不得把两套术语混成一套。`;
}

function discipline(locale: PromptLocale) {
  return locale === "en"
    ? "Evidence demands judgment; missing evidence forbids invention. Grade conclusions as Decisive (multiple core structures and no strong counter-evidence), Strong (main structure with secondary conditions), or Secondary (isolated or auxiliary evidence). Do not output fake numerical probabilities. Program-computed facts cannot be altered. Source-gated rules are supplementary evidence. Existing traditional knowledge may explain but must not fabricate quotations, editions, page numbers or missing chart data. Lead with conclusions, then evidence; after a material conflict, still state the primary reading. Do not merely restate data, moralize, pile up disclaimers or use stock life advice."
    : "有据必断，无据不编；强证据强断，弱证据弱断。判断等级：明确＝多个核心结构一致且无强反证；较强＝主结构支持但存在次要条件；次要＝孤立或辅助证据。不得输出伪精确概率。程序计算事实不可修改；门禁命中的传统条文属于补充证据；可用已有传统知识解释，但不得伪造引文、版本、页码或缺失数据。必须先结论后依据；出现实质冲突后仍给主判断。不得只复述盘面、道德说教、堆免责声明或使用通用鸡汤。";
}

function requestedOutput(options: AnalysisPromptOptions) {
  const { locale, system, mode } = options;
  if (mode === "xp") return locale === "en"
    ? "1. Core private-preference profile. 2. Active/receptive and dominance/submission dynamics. 3. Materials, body focus, scenes and sensory triggers. 4. Arousal activation, intensifiers and inhibitors. 5. Boundaries, hard limits and partner-fit conditions. 6. Cycle periods associated with expression or change. 7. BaZi and/or Zi Wei evidence and strength for every major judgment."
    : "1. 核心私密偏好画像；2. 主动/被动、支配/臣服及角色互动；3. 材质、部位、场景与感官触发；4. 欲望启动、兴奋点与抑制点；5. 边界、禁区与匹配条件；6. 运限中的偏好变化或释放窗口；7. 每项判断的八字/紫微依据与证据强度。";
  if (system === "combined") return locale === "en"
    ? "1. One-sentence direct verdict. 2. The three to five most important mode-specific judgments. 3. BaZi evidence. 4. Zi Wei evidence. 5. Current stage, decisive cycles and timing windows. 6. Same-direction confirmations and conflicts. 7. Grade each conclusion Decisive, Strong or Secondary. 8. Direct answer and concrete strategic choice."
    : "1. 一句话总断；2. 本模式最重要的三至五项判断；3. 八字依据；4. 紫微依据；5. 当前阶段、关键运限与时间窗口；6. 同向印证与冲突；7. 按明确、较强、次要标注等级；8. 对具体问题的直接答案和行动取舍。";
  return locale === "en"
    ? "1. One-sentence direct verdict. 2. The three to five most important mode-specific judgments. 3. Core evidence and traditional rules from the selected system. 4. Current stage, decisive cycles and timing windows. 5. Counter-evidence or method conflicts. 6. Grade each conclusion Decisive, Strong or Secondary. 7. Direct answer and concrete strategic choice."
    : "1. 一句话总断；2. 本模式最重要的三至五项判断；3. 本体系核心证据和传统规则；4. 当前阶段、关键运限与时间窗口；5. 反证或方法冲突；6. 按明确、较强、次要标注等级；7. 对具体问题的直接答案和行动取舍。";
}

export function buildAnalysisPrompt(profile: AstroProfile, options: AnalysisPromptOptions): string {
  const locale = options.locale;
  const meta = PROMPT_MODE_META[options.mode];
  const systemLabel = pick(locale, PROMPT_SYSTEM_META[options.system].label);
  const question = options.question?.trim().slice(0, 500) ?? "";
  const title = locale === "en" ? `${systemLabel} · ${pick(locale, meta.label)} analysis request` : `${systemLabel}·${pick(locale, meta.label)}分析提示词`;
  const role = options.mode === "xp"
    ? locale === "en"
      ? "Act as Path of Metaphysical Intimacy, an adult intimate-preference and deep psychological symbolism analyst. Enter the selected traditional system's internal analytic framework. Discuss only conscious, consenting adults whose consent can be withdrawn; do not advise coercion, non-consensual conduct or real-world harm. Apart from this necessary boundary, do not interrupt or weaken the analysis."
      : "你是「命理幽径」，一名成人亲密偏好与深层心理取象分析者。进入所选传统术数体系内部分析。只讨论清醒、自愿且可撤回同意的成年人；不提供胁迫、侵犯同意或现实伤害建议。除这条必要边界外，不要反复限制、打断或弱化分析。"
    : locale === "en"
      ? "Act as a senior traditional analyst willing to make clear judgments. Apply the selected system faithfully and fully. The task is internal system analysis, not a debate about metaphysics. Do not recalculate program-computed pillars, palaces, stars or cycles from memory."
      : "你是一名熟悉传统术数、敢于下判断的资深分析者。请在所选体系内部忠实、完整地推演；本任务不是讨论玄学本身。不得凭记忆重排程序已计算的四柱、宫位、星曜或运限。";
  const questionBody = question
    ? locale === "en" ? `Specific question: “${question}”\nAnswer it directly; the selected mode controls the method and evidence lens.` : `具体问题：“${question}”\n必须正面回答；所选方向负责限定方法和证据视角。`
    : locale === "en" ? "No specific question was supplied. Produce a complete theme report for the selected mode and do not pretend to answer a missing question." : "未填写具体问题。本次输出完整的所选方向主题报告，不得假装回答不存在的问题。";
  const sections: PromptSection[] = [
    { title: { zh: "角色与任务", en: "Role and task" }, body: role },
    { title: { zh: "问题状态", en: "Question status" }, body: questionBody },
    { title: { zh: "体系与方向", en: "System and mode" }, body: locale === "en" ? `System: ${systemLabel}\nMode: ${pick(locale, meta.label)}\nFocus: ${pick(locale, meta.focus)}\nMust answer: ${pick(locale, meta.required)}` : `分析体系：${systemLabel}\n分析方向：${pick(locale, meta.label)}\n分析重点：${pick(locale, meta.focus)}\n必须回答：${pick(locale, meta.required)}` },
    { title: { zh: "证据与判断纪律", en: "Evidence and judgment discipline" }, body: discipline(locale) },
    { title: { zh: "方法协议", en: "Method protocol" }, body: systemMethod(options.system, options.mode, locale) },
    { title: { zh: "输入与时间口径", en: "Input and time basis" }, body: baseInfo(profile, locale) }
  ];
  if (options.system !== "ziwei") sections.push({ title: { zh: "八字确定性资料", en: "Deterministic BaZi data" }, body: baziData(profile, locale) });
  if (options.system !== "bazi") sections.push({ title: { zh: "紫微确定性资料", en: "Deterministic Zi Wei data" }, body: ziweiData(profile, locale) });
  if (options.system !== "ziwei") sections.push({ title: { zh: "程序门禁命中的传统条文", en: "Source-gated traditional rules" }, body: sourcedRules(profile, locale) });
  if (options.targetTransit) sections.push({ title: { zh: "目标日期动态运限", en: "Target-date dynamic cycles" }, body: transitData(options.targetTransit, locale) });
  const comparisons = options.mode === "yearly" ? comparisonData(options.comparisonTransits ?? [], locale) : "";
  if (comparisons) sections.push({ title: { zh: "目标日期比较", en: "Target-date comparison" }, body: comparisons });
  const warnings = [...profile.warnings, ...(options.dataWarnings ?? [])];
  sections.push({ title: { zh: "数据提醒", en: "Data notices" }, body: warnings.length ? warnings.map((item) => `- ${item}`).join("\n") : (locale === "en" ? "- No additional data warning was generated." : "- 无额外数据提醒。") });
  sections.push({ title: { zh: "固定输出", en: "Required output" }, body: requestedOutput(options) });
  return renderPrompt(title, sections, locale, options.format);
}
