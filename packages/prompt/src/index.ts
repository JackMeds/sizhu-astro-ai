import type { AstroProfile, ZiweiStar } from "@sizhu/core";

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

function starText(star: ZiweiStar) {
  return `${star.name}${star.brightness ? `(${star.brightness})` : ""}${star.mutagen ? `[${star.mutagen}]` : ""}`;
}

function baziFactsSection(profile: AstroProfile) {
  if (!profile.bazi.facts.natal.length) return "## 八字确定性关系事实\n\n当前已编码规则未识别到本命关系。";
  return `## 八字确定性关系事实\n\n${profile.bazi.facts.natal
    .map((item) => {
      const participants = item.participants.map((participant) => `${participant.label}${participant.ganZhi ? `(${participant.ganZhi})` : ""}`).join(" ↔ ");
      const transform = item.transformation ? `；合化${item.transformation.targetElement}仅为${item.transformation.status === "candidate" ? "候选" : item.transformation.status}` : "";
      return `- ${item.label}【${item.status}】${transform}：${participants}${item.note ? `。边界：${item.note}` : ""}`;
    })
    .join("\n")}`;
}

function ziweiSection(profile: AstroProfile): string {
  if (!profile.ziwei.available) {
    return `## 紫微斗数\n\n紫微盘暂不可用。${profile.ziwei.error ? `错误：${profile.ziwei.error}` : ""}`;
  }

  const meta = [
    `命宫：${profile.ziwei.soulPalaceBranch || "-"}`,
    `身宫：${profile.ziwei.bodyPalaceBranch || "-"}`,
    `命主：${profile.ziwei.soulStar || "-"}`,
    `身主：${profile.ziwei.bodyStar || "-"}`,
    `五行局：${profile.ziwei.fiveElementsClass || "-"}`
  ].join("；");
  const mutagens = profile.ziwei.natalMutagens?.length
    ? profile.ziwei.natalMutagens.map((item) => `${item.star}${item.mutagen}@${item.palace}`).join("、")
    : "未取到";
  const rows = profile.ziwei.palaces
    .map((palace) => {
      const major = palace.majorStars.map(starText).join("、") || "-";
      const minor = palace.minorStars.map(starText).join("、") || "-";
      const decadal = palace.decadal ? `${palace.decadal.range[0]}–${palace.decadal.range[1]}岁 ${palace.decadal.heavenlyStem}${palace.decadal.earthlyBranch}` : "-";
      return `| ${palace.name || "-"}${palace.isBodyPalace ? "（身宫）" : ""} | ${palace.heavenlyStem || "-"}${palace.earthlyBranch || ""} | ${major} | ${minor} | ${decadal} |`;
    })
    .join("\n");

  return `## 紫微斗数\n\n- ${meta}\n- 生年四化：${mutagens}\n\n| 宫位 | 干支 | 主星 | 辅星 | 大限 |\n| --- | --- | --- | --- | --- |\n${rows}`;
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
- 输出要求：先列计算事实和规则依据，再给判断；明确区分程序事实、传统规则与综合解释。

## 输入信息

- 姓名：${profile.input.name}
- 性别：${profile.input.gender === "male" ? "男" : "女"}
- 出生时间：${profile.input.birthDateTime}
- 历法：${profile.input.calendar}
- 时区：${profile.input.timezone}
- 正式时间口径：${profile.time.effective.label} ${profile.time.effective.date} ${profile.time.effective.time}
- 起运流派：${profile.input.sect}

## 八字核心

- 阳历：${profile.bazi.solarText}
- 阴历：${profile.bazi.lunarText}
- 生肖：${profile.bazi.zodiac}
- 日主：${profile.bazi.dayMaster}
- 旺衰边界提示：${profile.bazi.strengthHint}

| 柱 | 干支 | 十神 | 藏干 | 纳音 | 空亡 |
| --- | --- | --- | --- | --- | --- |
${pillarTable(profile)}

## 五行计数

${Object.entries(profile.bazi.elementCounts)
  .map(([element, value]) => `- ${element}：${value}`)
  .join("\n")}

${baziFactsSection(profile)}

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

1. 资料完整性与时间口径
2. 程序可确定的结构事实
3. 八字规则与条件判断
4. 大运流年切入点
5. 紫微斗数补充观察
6. 不同流派或条件存在的争议
7. 综合结论
`;
}

export function exportProfile(profile: AstroProfile, format: ExportFormat): string {
  if (format === "json") return JSON.stringify(profile, null, 2);
  if (format === "markdown") return buildAiPrompt(profile);
  return buildAiPrompt(profile).replace(/^#+\s*/gm, "");
}
