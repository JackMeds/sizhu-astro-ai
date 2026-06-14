import type { AstroProfile } from "@sizhu/core";

export type PromptMode = "general" | "relationship" | "career" | "wealth" | "health" | "yearly" | "xp";
export type PromptFormat = "markdown" | "txt";

export const promptModes: Array<{ key: PromptMode; label: string; focus: string }> = [
  { key: "general", label: "综合", focus: "整体结构、格局强弱、五行流通、十神组合、大运节奏与可执行建议" },
  { key: "relationship", label: "姻缘", focus: "亲密关系、择偶倾向、沟通模式、婚恋节奏、关系风险与修正建议" },
  { key: "career", label: "事业", focus: "职业定位、能力优势、组织关系、晋升节奏、适合行业与工作方式" },
  { key: "wealth", label: "财运", focus: "收入结构、财星与食伤路径、投资风险、现金流习惯与阶段性机会" },
  { key: "health", label: "身心", focus: "五行偏颇对应的作息压力、情绪模式、身体管理建议，不做医学诊断" },
  { key: "yearly", label: "流年", focus: "当前大运与近三年流年流月的主题、机会、风险和行动窗口" },
  { key: "xp", label: "XP", focus: "成人亲密偏好、恋物材质、角色扮演、权力关系、感官触发与硬限制边界" }
];

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function wrapText(value: string, size = 56) {
  const normalized = value.replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  for (const line of normalized) {
    if (!line) {
      lines.push("");
      continue;
    }
    for (let index = 0; index < line.length; index += size) {
      lines.push(line.slice(index, index + size));
    }
  }
  return lines.slice(0, 42);
}

export function renderPromptSvg(title: string, content: string) {
  const lines = wrapText(content);
  const height = Math.max(520, 120 + lines.length * 24);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}">
  <rect width="1080" height="${height}" fill="#07100e"/>
  <rect x="36" y="36" width="1008" height="${height - 72}" rx="26" fill="#101b18" stroke="#3c6f61"/>
  <text x="68" y="88" fill="#49b39a" font-family="Arial, sans-serif" font-size="18" font-weight="700">AI PROMPT</text>
  <text x="68" y="126" fill="#f4d28a" font-family="serif" font-size="34" font-weight="700">${escapeXml(title)}</text>
  ${lines.map((line, index) => `<text x="68" y="${174 + index * 24}" fill="#e9ddc6" font-family="Arial, sans-serif" font-size="18">${escapeXml(line)}</text>`).join("\n  ")}
</svg>`;
}

function formatSections(title: string, sections: string[], format: PromptFormat) {
  if (format === "txt") {
    return sections.join("\n");
  }

  return [
    `# ${title}`,
    "",
    ...sections.map((item) => {
      const splitIndex = item.indexOf("：");
      if (splitIndex <= 0) return item;
      const heading = item.slice(0, splitIndex);
      const body = item.slice(splitIndex + 1);
      return `## ${heading}\n${body.trim()}`;
    })
  ].join("\n");
}

function formatPillarDetails(profile: AstroProfile) {
  return profile.bazi.pillars
    .map(
      (pillar) =>
        `${pillar.label}：${pillar.ganZhi}，天干${pillar.stem}，地支${pillar.branch}，十神${pillar.tenGod || "未取"}，藏干${pillar.hiddenStems.join("、") || "无"}，纳音${pillar.nayin || "未取"}，空亡${pillar.empty || "未取"}，五行${pillar.element || "未取"}`
    )
    .join("\n");
}

function formatLuckDetails(profile: AstroProfile) {
  const dayun = profile.bazi.luck.dayun.slice(0, 10);
  if (!dayun.length) return "暂无大运数据";

  return dayun
    .map((item) => {
      const years = item.years
        .slice(0, 10)
        .map((year) => `${year.year ?? "-"}年/${year.age ?? "-"}岁${year.ganZhi}${year.tenGod ? `(${year.tenGod})` : ""}`)
        .join("、");
      return `${item.startAge ?? "-"}岁起 ${item.startYear ?? "-"}年 ${item.ganZhi}${item.tenGod ? `（${item.tenGod}）` : ""}；流年：${years || "暂无"}`;
    })
    .join("\n");
}

function formatZiweiDetails(profile: AstroProfile) {
  if (!profile.ziwei.available) {
    return `紫微斗数不可用：${profile.ziwei.error || "未返回宫位"}`;
  }

  return profile.ziwei.palaces
    .slice(0, 12)
    .map((palace, index) => {
      const name = palace.name || `第${index + 1}宫`;
      return `${name}：${palace.heavenlyStem || "-"}${palace.earthlyBranch || "-"}，主星${palace.majorStars.join("、") || "无"}，辅星/杂曜${palace.minorStars.join("、") || "无"}`;
    })
    .join("\n");
}

export function buildChartDataBlock(profile: AstroProfile) {
  const elements = Object.entries(profile.bazi.elementCounts)
    .map(([key, value]) => `${key}${value}`)
    .join("、");
  const warnings = profile.warnings.length ? profile.warnings.join("；") : "无明显数据警告";
  return [
    `基础资料：${profile.input.name}，${profile.input.gender === "male" ? "男命" : "女命"}，历法${profile.input.calendar === "solar" ? "阳历/公历" : "农历/阴历"}，时间口径${profile.input.trueSolarTime === "longitude" ? "真太阳时" : "标准时"}，出生地${profile.input.location?.name || "未填"}，经度${profile.input.location?.longitude ?? "未填"}。`,
    `阳历：${profile.bazi.solarText}。农历：${profile.bazi.lunarText}。生肖：${profile.bazi.zodiac}。日主：${profile.bazi.dayMaster}。五行分布：${elements}。强弱提示：${profile.bazi.strengthHint}`,
    `紫微斗数十二宫：\n${formatZiweiDetails(profile)}`,
    `八字四柱明细：\n${formatPillarDetails(profile)}`,
    `起运信息：${profile.bazi.luck.startText || "暂无"}。大运与流年摘要：\n${formatLuckDetails(profile)}`,
    `交叉校验：${profile.bazi.crossCheck?.available ? profile.bazi.crossCheck.text || "可用" : profile.bazi.crossCheck?.error || "未返回"}。数据提醒：${warnings}。`
  ].join("\n");
}

function buildXpPrompt(profile: AstroProfile, format: PromptFormat) {
  const pillars = profile.bazi.pillars.map((pillar) => `${pillar.label}${pillar.ganZhi}（${pillar.tenGod}）`).join("、");
  const elements = Object.entries(profile.bazi.elementCounts).map(([key, value]) => `${key}${value}`).join("、");
  const luck = profile.bazi.luck.dayun.slice(0, 6).map((item) => `${item.startAge ?? "-"}岁 ${item.ganZhi} ${item.tenGod || ""}`).join("；");
  const warnings = profile.warnings.length ? profile.warnings.join("；") : "无明显数据警告";
  const sections = [
    `角色：你是「命理幽径」，一名成人亲密偏好与深层心理分析助手。你熟悉四柱八字、紫微斗数、两性心理、BDSM、字母圈、变装、角色扮演、材质恋物与小众感官偏好。`,
    `安全边界：只讨论成年人、清醒、自愿、可撤回同意的幻想与亲密偏好；必须提醒安全词、硬限制、事后照护和现实沟通；不要推断未确认事实，不输出未成年人、非自愿、胁迫、违法伤害或医学诊断内容。`,
    `分析任务：把命盘符号当作取象素材，输出一份「XP/私密偏好脑暴报告」。结论必须写成倾向、可能、适合探索的方向，不能说成铁口直断。`,
    `命盘输入：${profile.input.name}，${profile.input.gender === "male" ? "男命" : "女命"}，阳历 ${profile.bazi.solarText}，农历 ${profile.bazi.lunarText}。`,
    `完整结构化命盘资料：\n${buildChartDataBlock(profile)}`,
    `四柱：${pillars}。日主：${profile.bazi.dayMaster}。五行分布：${elements}。初步强弱提示：${profile.bazi.strengthHint}`,
    `大运摘要：${luck || "暂无大运数据"}。紫微状态：${profile.ziwei.available ? "可用，请结合十二宫星曜交叉验证。" : `不可用：${profile.ziwei.error || "未返回宫位"}`}。数据提醒：${warnings}。`,
    `取象矩阵：金/庚辛/武曲/七杀偏向金属、反光、束缚器具、漆皮、亮面乳胶、拉链紧身衣；木/甲乙/天机/贪狼偏向绳缚、纤维、毛绒、兽耳兽尾、Furry/Cosplay；水/壬癸/太阴/文曲偏向流体、浴室、贴身包裹、Zentai、丝袜；火/丙丁/太阳/廉贞偏向温度、透视、蕾丝、情趣内衣、滴蜡的安全化想象；土/戊己/天府偏向肌肤触感、重量感、体液或污浊意象，但必须停留在成人自愿和安全边界内。`,
    `服饰与角色矩阵：天相/偏印对应面具、制服、Cosplay、异服或极小众装束；天梁/正印/正官对应权力、阶级、禁欲系、西装、教师/职场正装；沐浴/伤官对应叛逆、半遮半掩、少布料、视觉挑逗；陀罗/辰戌/天罗地网对应限制、包裹、贞操锁意象、木乃伊式束缚、全身紧身衣带来的安全感。`,
    `交叉联想示例：贪狼+天相+乙木可联想到兽装、兽耳兽尾或 Furry 审美；天相+癸水+辛金可联想到 Latex、Zentai、反光紧身材质；七杀+己土只能写作粗粝、压迫、弄脏或支配幻想，不要写成现实伤害建议。`,
    `输出结构：1. 欲望内核与心理驱动；2. 角色剧场与权力关系（Dom/Sub/Switch 只作倾向）；3. 恋物、变装与肌肤感官；4. 动作、道具与场域的安全化建议；5. 绝对雷区、硬限制与沟通清单。`,
    `写作要求：语言要具体、画面感强、专业词准确；同时保持尊重、无羞辱式道德审判。所有建议都要加上「先沟通、可拒绝、可停止、以安全为先」的现实边界。`
  ];

  return formatSections("XP/私密偏好分析提示词", sections, format);
}

export function buildPrompt(profile: AstroProfile, mode: PromptMode, format: PromptFormat) {
  const modeConfig = promptModes.find((item) => item.key === mode) ?? promptModes[0];
  if (mode === "xp") {
    return buildXpPrompt(profile, format);
  }

  const pillars = profile.bazi.pillars.map((pillar) => `${pillar.label}${pillar.ganZhi}（${pillar.tenGod}）`).join("、");
  const elements = Object.entries(profile.bazi.elementCounts).map(([key, value]) => `${key}${value}`).join("、");
  const luck = profile.bazi.luck.dayun.slice(0, 6).map((item) => `${item.startAge ?? "-"}岁 ${item.ganZhi} ${item.tenGod || ""}`).join("；");
  const warnings = profile.warnings.length ? profile.warnings.join("；") : "无明显数据警告";
  const sections = [
    `角色：你是一名谨慎的命理分析助手，只基于给出的结构化命盘资料推理，不要编造没有依据的信息。`,
    `分析模式：${modeConfig.label}`,
    `分析重点：${modeConfig.focus}`,
    `输入资料：${profile.input.name}，${profile.input.gender === "male" ? "男命" : "女命"}，阳历 ${profile.bazi.solarText}，农历 ${profile.bazi.lunarText}。`,
    `完整结构化命盘资料：\n${buildChartDataBlock(profile)}`,
    `四柱：${pillars}。日主：${profile.bazi.dayMaster}。`,
    `五行分布：${elements}。初步提示：${profile.bazi.strengthHint}`,
    `大运摘要：${luck || "暂无大运数据"}。`,
    `紫微状态：${profile.ziwei.available ? "可用，请结合十二宫星曜交叉验证。" : `不可用：${profile.ziwei.error || "未返回宫位"}`}。`,
    `数据提醒：${warnings}。`,
    `输出要求：先列结构事实，再列推论；区分确定信息和不确定信息；给出阶段性建议；避免绝对化、恐吓式或医学/法律/投资断言。`,
    `请输出：1. 关键结论；2. 支撑证据；3. 当前阶段建议；4. 需要补充确认的问题。`
  ];

  return formatSections(`${modeConfig.label}命盘分析提示词`, sections, format);
}
