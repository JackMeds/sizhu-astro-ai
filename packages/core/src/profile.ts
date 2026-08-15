import { astroInputSchema } from "./schema.js";
import { createBaziProfile } from "./bazi.js";
import { createDivinationProfile } from "./divination.js";
import { auditBaziTraditionalRules, evaluateBaziTraditionalRules } from "./rules.js";
import { createTimeProfile } from "./time.js";
import { createZiweiProfile } from "./ziwei.js";
import type { AstroInput, AstroProfile } from "./types.js";

function createAiBlock(profile: Pick<AstroProfile, "input" | "time" | "bazi" | "ziwei">): AstroProfile["ai"] {
  const pillars = profile.bazi.pillars.map((pillar) => `${pillar.label}${pillar.ganZhi}`).join("，");
  const relationSummary = profile.bazi.facts.natal.map((item) => item.label).join("、") || "无已编码关系";
  const traditionalRules = evaluateBaziTraditionalRules(profile.bazi.pillars);
  const traditionalRuleSummary = traditionalRules.length
    ? traditionalRules.map((item) => `${item.source.title}·${item.source.section}`).join("、")
    : "无已命中的传统条文";
  const ziweiSummary = profile.ziwei.available
    ? `${profile.ziwei.fiveElementsClass || "五行局未取"}，命宫${profile.ziwei.soulPalaceBranch || "-"}，身宫${profile.ziwei.bodyPalaceBranch || "-"}`
    : "紫微不可用";
  return {
    summary: `${profile.input.name}，${profile.input.gender === "male" ? "男命" : "女命"}，采用${profile.time.effective.label}排盘，四柱为${pillars}。日主${profile.bazi.dayMaster}。五行统计仅作结构展示，不直接等同于旺衰。`,
    evidence: [
      { label: "输入时间", value: profile.time.inputText },
      { label: "排盘口径", value: `${profile.time.effective.label} ${profile.time.effective.date} ${profile.time.effective.time}` },
      { label: "阳历", value: profile.bazi.solarText },
      { label: "阴历", value: profile.bazi.lunarText },
      { label: "生肖", value: profile.bazi.zodiac },
      { label: "日主", value: profile.bazi.dayMaster },
      { label: "八字关系事实", value: relationSummary },
      { label: "传统规则命中", value: traditionalRuleSummary },
      { label: "紫微摘要", value: ziweiSummary },
      { label: "紫微生年四化", value: profile.ziwei.natalMutagens?.map((item) => `${item.star}${item.mutagen}@${item.palace}`).join("、") || "未取到" }
    ],
    recommendedPromptSections: ["输入与时间口径", "四柱结构", "确定性关系事实", "传统规则命中与适用条件", "五行与十神", "大运流年", "紫微十二宫与四化", "交叉校验与不确定性"]
  };
}

export function createAstroProfile(rawInput: AstroInput): AstroProfile {
  const input = astroInputSchema.parse(rawInput) as AstroInput;
  const time = createTimeProfile(input);
  const bazi = createBaziProfile(input);
  const ziwei = createZiweiProfile(input);
  const traditionalRuleAudits = auditBaziTraditionalRules(bazi.pillars);
  const traditionalRuleHits = traditionalRuleAudits.filter((item) => item.status === "matched");
  const warnings: string[] = [];

  if (input.calendar !== "solar") {
    warnings.push("当前核心仍以阳历输入为正式计算路径；农历输入尚未完成显式转换校验。");
  }
  if (input.trueSolarTime !== "none" && typeof input.location?.longitude !== "number") {
    warnings.push("已选择太阳时校正但缺少经度，因此正式结果退回标准时。请补充出生地经度后重新排盘。");
  }
  if (input.trueSolarTime === "longitude") {
    warnings.push("当前选择的是地方平太阳时：只做经度差修正，不包含均时差。若需要传统意义上的真太阳时，请选择“视太阳时（真太阳时）”。");
  }
  if (time.shichenChanged) {
    warnings.push(`时间校正导致时辰从${time.standard.shichen}变为${time.effective.shichen}，八字与紫微均已按校正后时辰重算。`);
  }
  if (time.dateChanged) {
    warnings.push(`时间校正跨越日期边界：标准时为${time.standard.date}，正式排盘口径为${time.effective.date}。`);
  }
  if (bazi.crossCheck && !bazi.crossCheck.available) {
    warnings.push(`lunisolar 交叉校验不可用：${bazi.crossCheck.error}`);
  }
  if (!ziwei.available && ziwei.error) {
    warnings.push(`iztro 紫微盘生成失败：${ziwei.error}`);
  }

  const partial = { input, time, bazi, ziwei };

  return {
    meta: {
      format: "astro-ai-profile",
      formatVersion: "1.2.0",
      generatedAt: new Date().toISOString(),
      source: "sizhu-astro-ai/core"
    },
    input,
    time,
    bazi,
    ziwei,
    divination: createDivinationProfile(),
    ai: createAiBlock(partial),
    raw: {
      time,
      baziCrossCheck: bazi.crossCheck,
      traditionalRules: {
        version: "bazi-rule-evidence-v1",
        hits: traditionalRuleHits,
        audits: traditionalRuleAudits
      },
      ziwei: ziwei.raw
    },
    warnings
  };
}