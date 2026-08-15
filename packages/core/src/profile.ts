import { astroInputSchema } from "./schema.js";
import { createBaziProfile } from "./bazi.js";
import { createDivinationProfile } from "./divination.js";
import { createTimeProfile } from "./time.js";
import { createZiweiProfile } from "./ziwei.js";
import type { AstroInput, AstroProfile } from "./types.js";

function createAiBlock(profile: Pick<AstroProfile, "input" | "time" | "bazi" | "ziwei">): AstroProfile["ai"] {
  const pillars = profile.bazi.pillars.map((pillar) => `${pillar.label}${pillar.ganZhi}`).join("，");
  return {
    summary: `${profile.input.name}，${profile.input.gender === "male" ? "男命" : "女命"}，采用${profile.time.effective.label}排盘，四柱为${pillars}。日主${profile.bazi.dayMaster}。五行统计仅作结构展示，不直接等同于旺衰。`,
    evidence: [
      { label: "输入时间", value: profile.time.inputText },
      { label: "排盘口径", value: `${profile.time.effective.label} ${profile.time.effective.date} ${profile.time.effective.time}` },
      { label: "阳历", value: profile.bazi.solarText },
      { label: "阴历", value: profile.bazi.lunarText },
      { label: "生肖", value: profile.bazi.zodiac },
      { label: "日主", value: profile.bazi.dayMaster },
      { label: "紫微可用", value: profile.ziwei.available ? "是" : "否" }
    ],
    recommendedPromptSections: ["输入与时间口径", "四柱结构", "五行与十神", "大运流年", "紫微十二宫", "交叉校验与不确定性"]
  };
}

export function createAstroProfile(rawInput: AstroInput): AstroProfile {
  const input = astroInputSchema.parse(rawInput) as AstroInput;
  const time = createTimeProfile(input);
  const bazi = createBaziProfile(input);
  const ziwei = createZiweiProfile(input);
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
      formatVersion: "1.1.0",
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
      ziwei: ziwei.raw
    },
    warnings
  };
}
