import type { AstroProfile, ZiweiStar } from "@sizhu/core";

export type PromptMode = "general" | "relationship" | "career" | "wealth" | "health" | "yearly" | "xp";
export type PromptFormat = "markdown" | "txt";
export type PromptSystem = "combined" | "bazi" | "ziwei";

export const promptModes: Array<{ key: PromptMode; label: string; focus: string }> = [
  { key: "general", label: "综合", focus: "整体结构、格局强弱、五行流通、十神组合、大运节奏与可执行建议" },
  { key: "relationship", label: "姻缘", focus: "亲密关系、择偶倾向、沟通模式、婚恋节奏、关系风险与修正建议" },
  { key: "career", label: "事业", focus: "职业定位、能力优势、组织关系、晋升节奏、适合行业与工作方式" },
  { key: "wealth", label: "财运", focus: "收入结构、财星与食伤路径、投资风险、现金流习惯与阶段性机会" },
  { key: "health", label: "身心", focus: "五行偏颇对应的作息压力、情绪模式、身体管理建议，不做医学诊断" },
  { key: "yearly", label: "流年", focus: "当前大运与近三年流年流月的主题、机会、风险和行动窗口" },
  { key: "xp", label: "XP", focus: "成人亲密偏好、恋物材质、角色扮演、权力关系、感官触发与硬限制边界" }
];

export const promptSystems: Array<{ key: PromptSystem; label: string; hint: string }> = [
  { key: "combined", label: "八字 + 紫微", hint: "默认推荐，交给 AI 综合对照" },
  { key: "bazi", label: "只看八字", hint: "四柱、十神、关系事实与大运流年" },
  { key: "ziwei", label: "只看紫微", hint: "十二宫、星曜、四化与大限" }
];

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function wrapText(value: string, size = 56) {
  const normalized = value.replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  for (const line of normalized) {
    if (!line) { lines.push(""); continue; }
    for (let index = 0; index < line.length; index += size) lines.push(line.slice(index, index + size));
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
  if (format === "txt") return sections.join("\n");
  return [
    `# ${title}`,
    "",
    ...sections.map((item) => {
      const splitIndex = item.indexOf("：");
      if (splitIndex <= 0) return item;
      return `## ${item.slice(0, splitIndex)}\n${item.slice(splitIndex + 1).trim()}`;
    })
  ].join("\n");
}

function formatPillarDetails(profile: AstroProfile) {
  return profile.bazi.pillars.map((pillar) => `${pillar.label}：${pillar.ganZhi}，天干${pillar.stem}，地支${pillar.branch}，十神${pillar.tenGod || "未取"}，藏干${pillar.hiddenStems.join("、") || "无"}，纳音${pillar.nayin || "未取"}，空亡${pillar.empty || "未取"}，五行${pillar.element || "未取"}`).join("\n");
}

function formatLuckDetails(profile: AstroProfile) {
  const dayun = profile.bazi.luck.dayun.slice(0, 10);
  if (!dayun.length) return "暂无大运数据";
  return dayun.map((item) => {
    const years = item.years.slice(0, 10).map((year) => `${year.year ?? "-"}年/${year.age ?? "-"}岁${year.ganZhi}${year.tenGod ? `(${year.tenGod})` : ""}`).join("、");
    return `${item.startAge ?? "-"}岁起 ${item.startYear ?? "-"}年 ${item.ganZhi}${item.tenGod ? `（${item.tenGod}）` : ""}；流年：${years || "暂无"}`;
  }).join("\n");
}

function formatStar(star: ZiweiStar) {
  return `${star.name}${star.brightness ? `(${star.brightness})` : ""}${star.mutagen ? `[${star.mutagen}]` : ""}`;
}

function formatBaziFacts(profile: AstroProfile) {
  if (!profile.bazi.facts.natal.length) return "当前已编码规则未识别到本命关系";
  return profile.bazi.facts.natal.map((fact) => {
    const participants = fact.participants.map((item) => `${item.label}${item.ganZhi ? `(${item.ganZhi})` : ""}`).join("↔");
    const transformation = fact.transformation ? `；合化${fact.transformation.targetElement}仅为候选` : "";
    return `${fact.label}[${fact.status}]${transformation}：${participants}${fact.note ? `；边界=${fact.note}` : ""}`;
  }).join("\n");
}

function formatZiweiDetails(profile: AstroProfile) {
  if (!profile.ziwei.available) return `紫微斗数不可用：${profile.ziwei.error || "未返回宫位"}`;
  const header = [
    `命宫${profile.ziwei.soulPalaceBranch || "-"}`,
    `身宫${profile.ziwei.bodyPalaceBranch || "-"}`,
    `命主${profile.ziwei.soulStar || "-"}`,
    `身主${profile.ziwei.bodyStar || "-"}`,
    `五行局${profile.ziwei.fiveElementsClass || "-"}`
  ].join("，");
  const mutagens = profile.ziwei.natalMutagens?.length ? profile.ziwei.natalMutagens.map((item) => `${item.star}${item.mutagen}@${item.palace}`).join("、") : "未取到";
  const palaces = profile.ziwei.palaces.slice(0, 12).map((palace, index) => {
    const name = palace.name || `第${index + 1}宫`;
    const major = palace.majorStars.map(formatStar).join("、") || "无";
    const minor = palace.minorStars.map(formatStar).join("、") || "无";
    const decadal = palace.decadal ? `${palace.decadal.range[0]}–${palace.decadal.range[1]}岁 ${palace.decadal.heavenlyStem}${palace.decadal.earthlyBranch}` : "无";
    return `${name}${palace.isBodyPalace ? "(身宫)" : ""}：${palace.heavenlyStem || "-"}${palace.earthlyBranch || "-"}，主星${major}，辅星/杂曜${minor}，大限${decadal}`;
  }).join("\n");
  return `${header}\n生年四化：${mutagens}\n${palaces}`;
}

function baseInfo(profile: AstroProfile) {
  return `${profile.input.name}，${profile.input.gender === "male" ? "男命" : "女命"}，历法${profile.input.calendar === "solar" ? "阳历/公历" : "农历/阴历"}，正式时间口径${profile.time.effective.label}，标准时${profile.time.standard.isoLocal}，有效时${profile.time.effective.isoLocal}，出生地${profile.input.location?.name || "未填"}，经度${profile.input.location?.longitude ?? "未填"}`;
}

export function buildBaziDataBlock(profile: AstroProfile) {
  const elements = Object.entries(profile.bazi.elementCounts).map(([key, value]) => `${key}${value}`).join("、");
  const warnings = profile.warnings.length ? profile.warnings.join("；") : "无明显数据警告";
  return [
    `基础资料：${baseInfo(profile)}。`,
    `阳历：${profile.bazi.solarText}。农历：${profile.bazi.lunarText}。生肖：${profile.bazi.zodiac}。日主：${profile.bazi.dayMaster}。五行分布：${elements}。旺衰边界提示：${profile.bazi.strengthHint}`,
    `八字确定性关系事实：\n${formatBaziFacts(profile)}`,
    `八字四柱明细：\n${formatPillarDetails(profile)}`,
    `起运信息：${profile.bazi.luck.startText || "暂无"}。大运与流年摘要：\n${formatLuckDetails(profile)}`,
    `八字交叉校验：${profile.bazi.crossCheck?.available ? profile.bazi.crossCheck.text || "可用" : profile.bazi.crossCheck?.error || "未返回"}。数据提醒：${warnings}。`
  ].join("\n");
}

export function buildZiweiDataBlock(profile: AstroProfile) {
  const warnings = profile.warnings.length ? profile.warnings.join("；") : "无明显数据警告";
  return [
    `基础资料：${baseInfo(profile)}。`,
    `紫微斗数结构化资料：\n${formatZiweiDetails(profile)}`,
    `紫微计算口径：${profile.ziwei.available ? "已按当前程序配置生成十二宫与星曜结构" : profile.ziwei.error || "不可用"}。`,
    `数据提醒：${warnings}。`
  ].join("\n");
}

export function buildChartDataBlock(profile: AstroProfile) {
  return `${buildBaziDataBlock(profile)}\n${buildZiweiDataBlock(profile)}`;
}

function buildXpPrompt(profile: AstroProfile, format: PromptFormat) {
  const pillars = profile.bazi.pillars.map((pillar) => `${pillar.label}${pillar.ganZhi}（${pillar.tenGod}）`).join("、");
  const elements = Object.entries(profile.bazi.elementCounts).map(([key, value]) => `${key}${value}`).join("、");
  const luck = profile.bazi.luck.dayun.slice(0, 6).map((item) => `${item.startAge ?? "-"}岁 ${item.ganZhi} ${item.tenGod || ""}`).join("；");
  const warnings = profile.warnings.length ? profile.warnings.join("；") : "无明显数据警告";
  const sections = [
    `角色：你是「命理幽径」，一名成人亲密偏好与深层心理分析助手。`,
    `安全边界：仅讨论成年人、清醒、自愿、可撤回同意的幻想与亲密偏好；不要推断未确认事实或提供现实伤害建议。`,
    `分析任务：把命盘符号作为传统取象素材，输出一份成人私密偏好脑暴报告；必须把术数取象写成倾向和假设，而不是事实断言。`,
    `命盘输入：${profile.input.name}，${profile.input.gender === "male" ? "男命" : "女命"}，阳历 ${profile.bazi.solarText}，农历 ${profile.bazi.lunarText}。`,
    `完整结构化命盘资料：\n${buildChartDataBlock(profile)}`,
    `四柱：${pillars}。日主：${profile.bazi.dayMaster}。五行分布：${elements}。旺衰边界提示：${profile.bazi.strengthHint}`,
    `大运摘要：${luck || "暂无大运数据"}。紫微状态：${profile.ziwei.available ? "可用，请结合十二宫星曜交叉验证。" : `不可用：${profile.ziwei.error || "未返回宫位"}`}。数据提醒：${warnings}。`,
    `输出结构：1. 取象假设；2. 角色与互动倾向；3. 材质与感官偏好联想；4. 边界与沟通；5. 哪些结论缺乏证据。`,
    `写作要求：具体但不把传统命理包装成现代科学事实；所有现实互动以成年人自愿、可停止和安全为前提。`
  ];
  return formatSections("XP/私密偏好分析提示词", sections, format);
}

export function buildPrompt(profile: AstroProfile, mode: PromptMode, format: PromptFormat, system: PromptSystem = "combined") {
  const modeConfig = promptModes.find((item) => item.key === mode) ?? promptModes[0];
  if (mode === "xp") return buildXpPrompt(profile, format);

  const systemConfig = promptSystems.find((item) => item.key === system) ?? promptSystems[0];
  const dataBlock = system === "bazi" ? buildBaziDataBlock(profile) : system === "ziwei" ? buildZiweiDataBlock(profile) : buildChartDataBlock(profile);
  const methodInstruction = system === "combined"
    ? "请分别说明八字与紫微的依据；两套体系能够相互印证时再做交叉观察，不要为了统一结论而强行消除分歧。"
    : system === "bazi"
      ? "本次只分析八字资料。不要调用或假设紫微斗数结论；若问题超出当前八字资料能支持的范围，请明确说明。"
      : "本次只分析紫微斗数资料。不要调用或假设八字结论；若问题超出当前紫微资料能支持的范围，请明确说明。";
  const sections = [
    `角色：你是一名严谨的传统术数资料分析助手，只基于给出的结构化命盘资料推理，不要编造没有依据的信息。`,
    `分析体系：${systemConfig.label}。${methodInstruction}`,
    `分析模式：${modeConfig.label}`,
    `分析重点：${modeConfig.focus}`,
    `输入资料：${profile.input.name}，${profile.input.gender === "male" ? "男命" : "女命"}，阳历 ${profile.bazi.solarText}，农历 ${profile.bazi.lunarText}。`,
    `程序已计算资料：\n${dataBlock}`,
    `输出要求：先列程序计算事实，再说明采用的传统规则与条件，最后给综合解释；不要把候选合化或有争议规则写成既定事实。`,
    system === "combined"
      ? `请输出：1. 关键结论；2. 八字依据；3. 紫微依据；4. 当前阶段/运限切入点；5. 两套体系的交叉观察；6. 分歧与待确认项。`
      : `请输出：1. 关键结论；2. 本体系的程序事实；3. 传统规则及适用条件；4. 当前阶段/运限切入点；5. 分歧与待确认项。`
  ];
  return formatSections(`${systemConfig.label} · ${modeConfig.label}分析提示词`, sections, format);
}
