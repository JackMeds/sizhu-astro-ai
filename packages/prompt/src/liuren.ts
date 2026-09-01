import type { LiurenCompleteChart } from "@sizhu/core";
import { PROMPT_METHOD_ID, type AnalysisPromptFormat, type PromptLocale } from "./analysis.js";

export interface LiurenPromptOptions {
  locale: PromptLocale;
  question?: string;
  format?: AnalysisPromptFormat;
}

function section(title: string, body: string, format: AnalysisPromptFormat) {
  return format === "markdown" ? `## ${title}\n\n${body}` : `${title}\n${body}`;
}

function evidenceText(chart: LiurenCompleteChart, locale: PromptLocale) {
  if (!chart.complete.focusEvidence.length) return locale === "en" ? "- No normalized focus evidence was returned." : "- 未返回标准化主证。";
  return chart.complete.focusEvidence.map((item) => locale === "en"
    ? `- ${item.level || "evidence"} · ${item.target} · role=${item.role}; evidence=${item.evidence.join("; ") || "none"}; limitations=${item.limitations.join("; ") || "none"}`
    : `- ${item.level || "证据"}·${item.target}·作用=${item.role}；依据=${item.evidence.join("；") || "无"}；限制=${item.limitations.join("；") || "无"}`
  ).join("\n");
}

function shenShaText(chart: LiurenCompleteChart, locale: PromptLocale) {
  if (!chart.complete.shenSha.length) return locale === "en" ? "- none" : "- 无";
  return chart.complete.shenSha.map((item) => locale === "en"
    ? `- ${item.name}@${item.target}; basis=${item.basis || item.rule || "not returned"}; sources=${item.sources.join("; ") || "not returned"}; limitations=${item.limitations.join("; ") || "none"}`
    : `- ${item.name}@${item.target}；依据=${item.basis || item.rule || "未取"}；来源=${item.sources.join("；") || "未取"}；限制=${item.limitations.join("；") || "无"}`
  ).join("\n");
}

function chartSummary(chart: LiurenCompleteChart, locale: PromptLocale) {
  const transmissions = chart.complete.threeTransmissions.map((item) => `${item.stage}${item.branch}乘${item.god}·${item.liuQing || "-"}·${item.seasonState || "-"}${item.isVoid ? "·空" : ""}·遁${item.dunGan || "-"}`).join(" → ");
  const lessons = chart.complete.fourLessons.map((item) => `${item.name}:${item.upper}/${item.lower}·${item.god}·${item.relation}`).join("；");
  return locale === "en"
    ? `Casting: ${chart.casting.label}; resolved ${chart.casting.resolvedDateTime}; branch ${chart.casting.resolvedBranch}\nDay/Night: ${chart.complete.dayNight}; Month General: ${chart.complete.monthLeader}; Nobleman: ${chart.complete.noblemanBranch}; voids: ${chart.complete.xunKong.join(", ") || "none"}\nTransmission method: ${chart.complete.transmissionRule}; pattern: ${chart.complete.transmissionPattern}; detail: ${chart.complete.transmissionDetail}\nFour Lessons: ${lessons}\nThree Transmissions: ${transmissions}\nLesson summary: ${chart.complete.lessonSummary}\nTransmission summary: ${chart.complete.transmissionSummary}\nPattern tags: ${[...new Set([...chart.complete.patternTags, ...chart.complete.guaTi])].join(", ") || "none"}`
    : `起课：${chart.casting.label}；最终占时${chart.casting.resolvedDateTime}；占时支${chart.casting.resolvedBranch}\n昼夜：${chart.complete.dayNight}；月将：${chart.complete.monthLeader}；贵人：${chart.complete.noblemanBranch}；旬空：${chart.complete.xunKong.join("、") || "无"}\n取传法：${chart.complete.transmissionRule}；课式：${chart.complete.transmissionPattern}；取传说明：${chart.complete.transmissionDetail}\n四课：${lessons}\n三传：${transmissions}\n四课摘要：${chart.complete.lessonSummary}\n三传摘要：${chart.complete.transmissionSummary}\n课体/格局：${[...new Set([...chart.complete.patternTags, ...chart.complete.guaTi])].join("、") || "无"}`;
}

export function buildLiurenAnalysisPrompt(chart: LiurenCompleteChart, options: LiurenPromptOptions): string {
  const locale = options.locale;
  const format = options.format ?? "txt";
  const question = ((options.question ?? chart.calendar.question) ?? "").trim();
  const title = locale === "en" ? "Da Liu Ren direct event-reading request" : "大六壬直接断事提示词";
  const role = locale === "en"
    ? "Enter the internal analytic framework of traditional Da Liu Ren and perform a complete, direct event reading. Apply the system faithfully; do not debate metaphysics, moralize, pile up disclaimers or replace the reading with generic life advice. The program-computed chart is authoritative: do not recalculate or alter plates, generals, Four Lessons, Three Transmissions, transmission method, patterns or Shen-Sha."
    : "进入传统大六壬体系内部，进行完整、直接的断事分析。忠实运用本体系，不讨论玄学本身，不道德说教、不堆免责声明，也不用泛泛人生建议代替解课。程序排好的天地盘、天将、四课、三传、取传法、课体和神煞均为确定性输入，不得自行重排或修改。";
  const questionText = question
    ? locale === "en"
      ? `Question: “${question.slice(0, 500)}”\nFirst identify the primary question category and relevant class spirit/useful spirit, then answer the question directly. If several themes appear, choose the final requested outcome as primary and name the others as secondary.`
      : `占问：“${question.slice(0, 500)}”\n先识别主要占问类别和相关类神/用神，再正面回答。若包含多个主题，以用户最终所问结果为主类，其余列为辅类。`
    : locale === "en"
      ? "No question was supplied. Give only a structural overview of the strongest chart signals. Do not invent a class spirit, target event, success/failure result or exact timing; ask for one concrete question before focused judgment."
      : "未填写占问。只概括盘面最强结构，不虚构类神、具体事件、成败或精确应期；随后提示补充一个明确问题再作聚焦判断。";
  const method = locale === "en"
    ? "Method anchor: subject/object and class spirit → Four Lessons and Three Transmissions → seasonal strength, void, break, tomb and combination → patterns and Shen-Sha. Follow this order: 1. question category; 2. subject, object, useful/class spirit and Six Relations; 3. day, Month General, divination hour, seasonal strength and void; 4. generating/controlling relations in the Four Lessons; 5. the actual Nine-Gate transmission rule and why it applies; 6. Initial Transmission as onset; 7. Middle Transmission as development and turn; 8. Final Transmission as outcome; 9. Six Relations, strength, void/break/tomb, clashes/combinations and hidden stems; 10. patterns as structural support; 11. Shen-Sha only as source-gated supporting evidence; 12. timing from normalized timing evidence. One Shen-Sha must never overrule the Four Lessons and Three Transmissions."
    : "方法锚点：主客类神—四课三传—旺衰空墓—课体神煞。严格依次处理：1. 占问类别；2. 主客、用神/类神和六亲；3. 日辰、月将、占时、旺衰与旬空；4. 四课上下关系和生克；5. 实际九宗门取传法及命中原因；6. 初传看发生；7. 中传看发展和转折；8. 末传看最终落点；9. 六亲、旺衰、空破、墓绝、冲合和遁干；10. 课体格局作结构补充；11. 神煞只作有来源的辅助证据；12. 根据标准化时间证据判断先后、快慢、触发条件和应期。单个神煞不得推翻四课三传主体。";
  const discipline = locale === "en"
    ? "Evidence demands judgment; missing evidence forbids invention. Grade conclusions Decisive, Strong or Secondary, without fake numerical probabilities. When core structures converge, state favorable/unfavorable, success/failure, gain/loss, process and timing directly. Lower confidence only for missing data, material rule conflicts or engine differences; after explaining them, still state the primary reading. Lead with the conclusion, then evidence."
    : "有据必断，无据不编；强证据强断，弱证据弱断。按明确、较强、次要分级，不输出伪精确概率。核心结构汇合时必须直接判断吉凶、成败、得失、过程和应期。只有资料缺失、规则实质冲突或引擎差异会改变结果时才降低强度；说明后仍给主判断。必须先结论后依据。";
  const crossCheck = chart.crossCheck.status === "matched"
    ? locale === "en" ? `${chart.crossCheck.overlapChecks} overlapping deterministic checks matched.` : `${chart.crossCheck.overlapChecks}项重叠确定性结构一致。`
    : locale === "en"
      ? `Differences: ${chart.crossCheck.differences.join("; ")}. Explain which differences affect interpretation, then continue to a primary judgment.`
      : `差异：${chart.crossCheck.differences.join("；")}。先说明哪些差异实质影响判断，再继续给出主断。`;
  const output = question
    ? locale === "en"
      ? "1. One-sentence direct verdict. 2. Question category, subject/object, useful/class spirit and Six Relations. 3. Favorable/unfavorable, success/failure and gain/loss grade. 4. Decisive Four-Lesson and Three-Transmission evidence. 5. Cause, development, turn and outcome. 6. Key people, helpers and obstacles. 7. Timing, triggers and windows. 8. Final result and strategic choice. 9. Counter-evidence, engine differences and secondary possibilities."
      : "1. 一句话直断；2. 占问类别、主客、用神/类神与六亲；3. 吉凶、成败、得失等级；4. 四课三传决定性证据；5. 起因、发展、转折和结果；6. 关键人物、助力与阻力；7. 应期、触发条件和时间窗口；8. 最终结果与行动取舍；9. 反证、引擎差异和次要可能。"
    : locale === "en"
      ? "1. Structural overview. 2. Strongest normalized evidence. 3. Four-Lesson and Three-Transmission structure. 4. Timing sequence without a target event. 5. The concrete question needed for focused judgment."
      : "1. 结构概览；2. 最强标准化证据；3. 四课三传结构；4. 不绑定具体事件的时间先后；5. 需要用户补充的明确问题。";
  const timing = chart.complete.timingEvidence.length ? chart.complete.timingEvidence.map((item) => `- ${item}`).join("\n") : (locale === "en" ? "- none returned" : "- 未返回");
  const warnings = chart.warnings.length ? chart.warnings.map((item) => `- ${item}`).join("\n") : (locale === "en" ? "- none" : "- 无");
  const parts = [
    format === "markdown" ? `# ${title}\n\n> method: ${PROMPT_METHOD_ID}` : `${title}\nmethod: ${PROMPT_METHOD_ID}`,
    section(locale === "en" ? "Role and immutable chart boundary" : "角色与不可修改的课盘边界", role, format),
    section(locale === "en" ? "Question status" : "占问状态", questionText, format),
    section(locale === "en" ? "Method protocol" : "方法协议", method, format),
    section(locale === "en" ? "Evidence and judgment discipline" : "证据与断法纪律", discipline, format),
    section(locale === "en" ? "Program-computed chart summary" : "程序计算课盘摘要", chartSummary(chart, locale), format),
    section(locale === "en" ? "Normalized focus evidence" : "标准化主证", evidenceText(chart, locale), format),
    section(locale === "en" ? "Timing evidence" : "时间与应期证据", timing, format),
    section(locale === "en" ? "Source-gated Shen-Sha" : "有来源门禁的神煞", shenShaText(chart, locale), format),
    section(locale === "en" ? "Engine cross-check" : "引擎交叉校验", crossCheck, format),
    section(locale === "en" ? "Data notices" : "数据提醒", warnings, format),
    section(locale === "en" ? "Required output" : "固定输出", output, format),
    section(locale === "en" ? "Complete deterministic chart JSON" : "完整确定性课盘 JSON", `\`\`\`json\n${JSON.stringify(chart, null, 2)}\n\`\`\``, format)
  ];
  return parts.join("\n\n");
}
