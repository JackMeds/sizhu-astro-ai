import { astroInputSchema } from "./schema.js";
import { createBaziProfile } from "./bazi.js";
import { createDivinationProfile } from "./divination.js";
import { createZiweiProfile } from "./ziwei.js";
import type { AstroInput, AstroProfile } from "./types.js";

function createAiBlock(profile: Pick<AstroProfile, "input" | "bazi" | "ziwei">): AstroProfile["ai"] {
  const pillars = profile.bazi.pillars.map((pillar) => `${pillar.label}${pillar.ganZhi}`).join("，");
  return {
    summary: `${profile.input.name}，${profile.input.gender === "male" ? "男命" : "女命"}，四柱为${pillars}。日主${profile.bazi.dayMaster}，五行初步分布：${Object.entries(profile.bazi.elementCounts)
      .map(([key, value]) => `${key}${value}`)
      .join("、")}。`,
    evidence: [
      { label: "阳历", value: profile.bazi.solarText },
      { label: "阴历", value: profile.bazi.lunarText },
      { label: "生肖", value: profile.bazi.zodiac },
      { label: "日主", value: profile.bazi.dayMaster },
      { label: "紫微可用", value: profile.ziwei.available ? "是" : "否" }
    ],
    recommendedPromptSections: ["输入信息", "四柱结构", "五行与十神", "大运流年", "紫微十二宫", "交叉校验与不确定性"]
  };
}

export function createAstroProfile(rawInput: AstroInput): AstroProfile {
  const input = astroInputSchema.parse(rawInput) as AstroInput;
  const bazi = createBaziProfile(input);
  const ziwei = createZiweiProfile(input);
  const warnings: string[] = [];

  if (input.calendar !== "solar") {
    warnings.push("v1 当前按阳历日期计算；农历输入将在后续版本加入显式转换。");
  }
  if (input.trueSolarTime !== "none" && typeof input.location?.longitude !== "number") {
    warnings.push("已选择真太阳时，但缺少出生地经度；当前无法执行经度校正。");
  }
  if (bazi.crossCheck && !bazi.crossCheck.available) {
    warnings.push(`lunisolar 交叉校验不可用：${bazi.crossCheck.error}`);
  }
  if (!ziwei.available && ziwei.error) {
    warnings.push(`iztro 紫微盘生成失败：${ziwei.error}`);
  }

  const partial = {
    input,
    bazi,
    ziwei
  };

  return {
    meta: {
      format: "astro-ai-profile",
      formatVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      source: "sizhu-astro-ai/core"
    },
    input,
    bazi,
    ziwei,
    divination: createDivinationProfile(),
    ai: createAiBlock(partial),
    raw: {
      baziCrossCheck: bazi.crossCheck,
      ziwei: ziwei.raw
    },
    warnings
  };
}
