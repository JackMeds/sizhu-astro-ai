import type { AstroProfile } from "@sizhu/core";

export type ExportFormat = "json" | "markdown" | "txt";

export interface PromptOptions {
  audience?: "general-ai" | "bazi-specialist" | "research";
  includeZiwei?: boolean;
  includeWarnings?: boolean;
}

function pillarTable(profile: AstroProfile): string {
  return profile.bazi.pillars
    .map(
      (pillar) =>
        `| ${pillar.label} | ${pillar.ganZhi} | ${pillar.tenGod || "-"} | ${pillar.hiddenStems.join("、") || "-"} | ${
          pillar.nayin || "-"
        } | ${pillar.empty || "-"} |`
    )
    .join("\n");
}

function ziweiSection(profile: AstroProfile): string {
  if (!profile.ziwei.available) {
    return `## 紫微斗数\n\n紫微盘暂不可用。${profile.ziwei.error ? `错误：${profile.ziwei.error}` : ""}`;
  }

  const rows = profile.ziwei.palaces
    .map(
      (palace) =>
        `| ${palace.name || "-"} | ${palace.heavenlyStem || "-"}${palace.earthlyBranch || ""} | ${
          palace.majorStars.join("、") || "-"
        } | ${palace.minorStars.join("、") || "-"} |`
    )
    .join("\n");

  return `## 紫微斗数\n\n| 宫位 | 干支 | 主星 | 辅星 |\n| --- | --- | --- | --- |\n${rows}`;
}

export function buildAiPrompt(profile: AstroProfile, options: PromptOptions = {}): string {
  const includeZiwei = options.includeZiwei ?? true;
  const includeWarnings = options.includeWarnings ?? true;
  const audience = options.audience ?? "general-ai";
  const warnings =
    includeWarnings && profile.warnings.length
      ? `\n## 不确定性与校验提醒\n\n${profile.warnings.map((warning) => `- ${warning}`).join("\n")}\n`
      : "";

  return `# AI 命盘分析资料

你是一名严谨的传统术数资料分析助手。请基于以下结构化资料进行分析，不要编造缺失字段；如存在流派、历法、真太阳时或引擎差异，请先指出不确定性。

## 分析模式

- 目标读者：${audience}
- 输出要求：先列证据，再给判断；避免绝对化断语；区分结构事实、推论和建议。

## 输入信息

- 姓名：${profile.input.name}
- 性别：${profile.input.gender === "male" ? "男" : "女"}
- 出生时间：${profile.input.birthDateTime}
- 历法：${profile.input.calendar}
- 时区：${profile.input.timezone}
- 起运流派：${profile.input.sect}

## 八字核心

- 阳历：${profile.bazi.solarText}
- 阴历：${profile.bazi.lunarText}
- 生肖：${profile.bazi.zodiac}
- 日主：${profile.bazi.dayMaster}
- 初步强弱提示：${profile.bazi.strengthHint}

| 柱 | 干支 | 十神 | 藏干 | 纳音 | 空亡 |
| --- | --- | --- | --- | --- | --- |
${pillarTable(profile)}

## 五行计数

${Object.entries(profile.bazi.elementCounts)
  .map(([element, value]) => `- ${element}：${value}`)
  .join("\n")}

## 大运摘要

${profile.bazi.luck.dayun
  .map((item) => `- ${item.startYear ?? "-"}年 / ${item.startAge ?? "-"}岁：${item.ganZhi}（${item.tenGod || "-"}）`)
  .join("\n")}

${includeZiwei ? ziweiSection(profile) : ""}

## AI 可读摘要

${profile.ai.summary}

## 证据表

${profile.ai.evidence.map((item) => `- ${item.label}：${item.value}`).join("\n")}
${warnings}
## 请按以下结构输出

1. 资料完整性检查
2. 四柱结构观察
3. 五行与十神分析
4. 大运流年切入点
5. 紫微斗数补充观察
6. 可验证结论与待确认问题
`;
}

export function exportProfile(profile: AstroProfile, format: ExportFormat): string {
  if (format === "json") return JSON.stringify(profile, null, 2);
  if (format === "markdown") return buildAiPrompt(profile);
  return buildAiPrompt(profile).replace(/^#+\s*/gm, "");
}
