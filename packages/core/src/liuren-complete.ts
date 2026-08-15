import { generateLiuren } from "mingyu-core/divination/liuren";
import {
  createLiurenBaseChart,
  prepareLiurenCalendarInput,
  type LiurenBaseChart,
  type LiurenSessionInput
} from "./liuren.js";

export type LiurenCastingMethod = "time" | "number" | "branch";

export interface LiurenCompleteInput extends LiurenSessionInput {
  castingMethod?: LiurenCastingMethod;
  castingNumber?: number;
  castingBranch?: string;
}

export interface LiurenTransmissionNormalized {
  stage: "初传" | "中传" | "末传";
  branch: string;
  god: string;
  relation: string;
  wuxing: string;
  seasonState: string;
  isVoid: boolean;
  dayRelation: string;
  dunGan: string;
  liuQing: "兄" | "子" | "财" | "官" | "父" | "";
}

export interface LiurenCompleteChart {
  format: "sizhu-liuren-chart";
  formatVersion: "1.0.0";
  casting: {
    method: LiurenCastingMethod;
    label: string;
    sourceDateTime: string;
    resolvedDateTime: string;
    resolvedBranch: string;
    number?: number;
    normalizedNumber?: number;
    selectedBranch?: string;
    note: string;
  };
  calendar: LiurenBaseChart["calendar"];
  native: LiurenBaseChart;
  complete: {
    engine: "mingyu-core";
    version: "0.1.23";
    ganzhi: Record<string, string>;
    dayNight: string;
    monthLeader: string;
    divinationBranch: string;
    noblemanBranch: string;
    noblemanGroundBranch: string;
    xunKong: string[];
    transmissionRule: string;
    transmissionPattern: string;
    transmissionDetail: string;
    fourLessons: Array<{
      name: string;
      upper: string;
      lower: string;
      god: string;
      relation: string;
      note?: string;
    }>;
    threeTransmissions: LiurenTransmissionNormalized[];
    patternTags: string[];
    guaTi: string[];
    shenSha: Array<{
      name: string;
      target: string;
      targetType?: string;
      category?: string;
      basis?: string;
      input?: string;
      rule?: string;
      sources: string[];
      limitations: string[];
    }>;
    lessonSummary: string;
    transmissionSummary: string;
    focusEvidence: unknown[];
    timingEvidence: string[];
  };
  crossCheck: {
    status: "matched" | "differences";
    overlapChecks: number;
    differences: string[];
  };
  engineManifest: {
    native: "sizhu-liuren-ts@0.2.0";
    complete: "mingyu-core@0.1.23";
    oracle: "kentang2017/kinliuren@3ba45a9540f08269b56d81508a061c7d46938785";
  };
  warnings: string[];
}

const BRANCHES = [..."子丑寅卯辰巳午未申酉戌亥"];
const STEMS = [..."甲乙丙丁戊己庚辛壬癸"];
const BRANCH_HOURS: Record<string, number> = {
  子: 0, 丑: 2, 寅: 4, 卯: 6, 辰: 8, 巳: 10,
  午: 12, 未: 14, 申: 16, 酉: 18, 戌: 20, 亥: 22
};
const STEM_ELEMENT: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水"
};
const BRANCH_ELEMENT: Record<string, string> = {
  子: "水", 亥: "水", 寅: "木", 卯: "木", 巳: "火", 午: "火",
  申: "金", 酉: "金", 辰: "土", 戌: "土", 丑: "土", 未: "土"
};
const GENERATES: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const GENERAL_SHORT: Record<string, string> = {
  贵人: "貴", 貴人: "貴", 螣蛇: "蛇", 腾蛇: "蛇", 朱雀: "雀", 六合: "合", 勾陈: "勾", 勾陳: "勾",
  青龙: "龍", 青龍: "龍", 天空: "空", 白虎: "虎", 太常: "常", 玄武: "玄", 太阴: "陰", 太陰: "陰", 天后: "后"
};

function jiazi(): string[] {
  return Array.from({ length: 60 }, (_, index) => `${STEMS[index % 10]}${BRANCHES[index % 12]}`);
}

export function liurenNumberToBranch(value: number): { branch: string; normalized: number } {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    throw new Error("报数起课需要填写大于 0 的整数。");
  }
  const normalized = ((value - 1) % 12) + 1;
  return { branch: BRANCHES[normalized - 1], normalized };
}

function xunDunGan(dayGanZhi: string, branch: string): string {
  const cycle = jiazi();
  const dayIndex = cycle.indexOf(dayGanZhi);
  if (dayIndex < 0) return "";
  const xunStart = cycle[Math.floor(dayIndex / 10) * 10];
  const startBranch = xunStart?.[1] ?? "";
  const startIndex = BRANCHES.indexOf(startBranch);
  const targetIndex = BRANCHES.indexOf(branch);
  if (startIndex < 0 || targetIndex < 0) return "";
  const offset = (targetIndex - startIndex + 12) % 12;
  return offset < 10 ? STEMS[offset] : "";
}

function liuQing(dayStem: string, branch: string): LiurenTransmissionNormalized["liuQing"] {
  const day = STEM_ELEMENT[dayStem];
  const target = BRANCH_ELEMENT[branch];
  if (!day || !target) return "";
  if (day === target) return "兄";
  if (GENERATES[day] === target) return "子";
  if (CONTROLS[day] === target) return "财";
  if (CONTROLS[target] === day) return "官";
  if (GENERATES[target] === day) return "父";
  return "";
}

function branchSession(input: LiurenCompleteInput, branch: string): LiurenSessionInput {
  const seed = prepareLiurenCalendarInput(input);
  const date = seed.effectiveDateTime.slice(0, 10);
  const hour = BRANCH_HOURS[branch];
  if (hour == null) throw new Error(`未知占时地支：${branch}`);
  return {
    dateTime: `${date}T${String(hour).padStart(2, "0")}:00:00+08:00`,
    timezone: "Asia/Shanghai",
    trueSolarTime: "none",
    question: input.question
  };
}

function resolveCasting(input: LiurenCompleteInput): {
  method: LiurenCastingMethod;
  session: LiurenSessionInput;
  number?: number;
  normalizedNumber?: number;
  selectedBranch?: string;
  note: string;
} {
  const method = input.castingMethod ?? "time";
  if (method === "number") {
    const value = input.castingNumber ?? Number.NaN;
    const resolved = liurenNumberToBranch(value);
    return {
      method,
      session: branchSession(input, resolved.branch),
      number: value,
      normalizedNumber: resolved.normalized,
      selectedBranch: resolved.branch,
      note: `报数 ${value} 按 1=子…12=亥 循环取第 ${resolved.normalized} 支，为${resolved.branch}时。报数只决定占时支，不把数字本身包装成额外吉凶。`
    };
  }
  if (method === "branch") {
    const branch = input.castingBranch ?? "";
    if (!BRANCHES.includes(branch)) throw new Error("指定占时需要选择子至亥十二地支之一。");
    return {
      method,
      session: branchSession(input, branch),
      selectedBranch: branch,
      note: `直接指定${branch}时作为占时支；基础日期沿用所选起课日期。`
    };
  }
  return {
    method: "time",
    session: input,
    note: "正时起课：按所选时间口径得到实际占时，再进入同一套六壬排课算法。"
  };
}

function completeDate(calendar: LiurenBaseChart["calendar"]): Date {
  return new Date(`${calendar.effectiveDateTime}+08:00`);
}

function normalizeGod(value: string): string {
  return GENERAL_SHORT[value] ?? value;
}

function compareOverlap(native: LiurenBaseChart, raw: ReturnType<typeof generateLiuren>): string[] {
  const differences: string[] = [];
  if (String(raw.ganzhi?.day ?? "") !== native.calendar.dayGanZhi) differences.push(`日干支：native=${native.calendar.dayGanZhi} / mingyu=${raw.ganzhi?.day ?? "-"}`);
  if (String(raw.ganzhi?.hour ?? "") !== native.calendar.hourGanZhi) differences.push(`时干支：native=${native.calendar.hourGanZhi} / mingyu=${raw.ganzhi?.hour ?? "-"}`);
  if (String(raw.monthLeader ?? "") !== native.disk.moonGeneral) differences.push(`月将：native=${native.disk.moonGeneral} / mingyu=${raw.monthLeader ?? "-"}`);

  const rawPlate = Array.isArray(raw.heavenlyPlate) ? raw.heavenlyPlate : [];
  for (const item of rawPlate) {
    const under = String(item.under ?? "");
    const upper = String(item.branch ?? "");
    if (under && native.disk.earthToHeaven[under] !== upper) differences.push(`天地盘 ${under}：native=${native.disk.earthToHeaven[under] ?? "-"} / mingyu=${upper}`);
  }

  const nativeCourses = new Map(native.fourCourses.upstreamOrder.map((item) => [item.label, item]));
  const rawLessons = Array.isArray(raw.fourLessons) ? raw.fourLessons : [];
  for (const lesson of rawLessons) {
    const name = String(lesson.name ?? "");
    const current = nativeCourses.get(name as "一課" | "二課" | "三課" | "四課");
    if (!current) continue;
    const upper = String(lesson.upper ?? "");
    const lower = String(lesson.lower ?? "");
    if (current.upper !== upper || current.lower !== lower) differences.push(`${name}：native=${current.upper}${current.lower} / mingyu=${upper}${lower}`);
    const god = normalizeGod(String(lesson.god ?? ""));
    if (god && current.general !== god) differences.push(`${name}天将：native=${current.general} / mingyu=${god}`);
  }
  return [...new Set(differences)];
}

export function createCompleteLiurenChart(input: LiurenCompleteInput): LiurenCompleteChart {
  const casting = resolveCasting(input);
  const native = createLiurenBaseChart(casting.session);
  const raw = generateLiuren(completeDate(native.calendar));
  const dayStem = String(raw.ganzhi?.day ?? native.calendar.dayGanZhi)[0] ?? "";
  const dayGanZhi = String(raw.ganzhi?.day ?? native.calendar.dayGanZhi);

  const threeTransmissions: LiurenTransmissionNormalized[] = (Array.isArray(raw.threeTransmissions) ? raw.threeTransmissions : []).map((item, index) => ({
    stage: (String(item.stage ?? ["初传", "中传", "末传"][index]) as LiurenTransmissionNormalized["stage"]),
    branch: String(item.branch ?? ""),
    god: String(item.god ?? ""),
    relation: String(item.relation ?? ""),
    wuxing: String(item.wuxing ?? BRANCH_ELEMENT[String(item.branch ?? "")] ?? ""),
    seasonState: String(item.seasonState ?? ""),
    isVoid: Boolean(item.isVoid),
    dayRelation: String(item.dayRelation ?? ""),
    dunGan: xunDunGan(dayGanZhi, String(item.branch ?? "")),
    liuQing: liuQing(dayStem, String(item.branch ?? ""))
  }));

  const fourLessons = (Array.isArray(raw.fourLessons) ? raw.fourLessons : []).map((item) => ({
    name: String(item.name ?? ""),
    upper: String(item.upper ?? ""),
    lower: String(item.lower ?? ""),
    god: String(item.god ?? ""),
    relation: String(item.relation ?? ""),
    ...(item.note ? { note: String(item.note) } : {})
  }));

  const shenSha = (Array.isArray(raw.shenShaFacts) ? raw.shenShaFacts : []).map((item) => ({
    name: String(item.name ?? ""),
    target: String(item.target ?? ""),
    ...(item.targetType ? { targetType: String(item.targetType) } : {}),
    ...(item.category ? { category: String(item.category) } : {}),
    ...(item.basis ? { basis: String(item.basis) } : {}),
    ...(item.input ? { input: String(item.input) } : {}),
    ...(item.rule ? { rule: String(item.rule) } : {}),
    sources: Array.isArray(item.sources) ? item.sources.map(String) : [],
    limitations: Array.isArray(item.limitations) ? item.limitations.map(String) : []
  }));

  const differences = compareOverlap(native, raw);
  const resolvedBranch = native.calendar.hourGanZhi[1] ?? "";
  const warnings: string[] = [];
  if (differences.length) warnings.push("完整引擎与本地原生结构层存在差异，已逐项列入 crossCheck.differences；解读前应先处理差异。");
  if (casting.method !== "time" && input.trueSolarTime && input.trueSolarTime !== "none") warnings.push("报数/指定占时模式以选出的地支作为最终占时，因此太阳时修正只用于确定基础日期，不再二次移动占时支。");

  return {
    format: "sizhu-liuren-chart",
    formatVersion: "1.0.0",
    casting: {
      method: casting.method,
      label: casting.method === "number" ? "报数起课" : casting.method === "branch" ? "指定占时" : "正时起课",
      sourceDateTime: input.dateTime,
      resolvedDateTime: native.calendar.effectiveDateTime,
      resolvedBranch,
      ...(casting.number != null ? { number: casting.number } : {}),
      ...(casting.normalizedNumber != null ? { normalizedNumber: casting.normalizedNumber } : {}),
      ...(casting.selectedBranch ? { selectedBranch: casting.selectedBranch } : {}),
      note: casting.note
    },
    calendar: native.calendar,
    native,
    complete: {
      engine: "mingyu-core",
      version: "0.1.23",
      ganzhi: Object.fromEntries(Object.entries(raw.ganzhi ?? {}).map(([key, value]) => [key, String(value)])),
      dayNight: String(raw.dayNight ?? ""),
      monthLeader: String(raw.monthLeader ?? ""),
      divinationBranch: String(raw.divinationBranch ?? ""),
      noblemanBranch: String(raw.noblemanBranch ?? ""),
      noblemanGroundBranch: String(raw.noblemanGroundBranch ?? ""),
      xunKong: Array.isArray(raw.xunKong) ? raw.xunKong.map(String) : [],
      transmissionRule: String(raw.transmissionRule ?? ""),
      transmissionPattern: String(raw.transmissionPattern ?? ""),
      transmissionDetail: String(raw.transmissionDetail ?? ""),
      fourLessons,
      threeTransmissions,
      patternTags: Array.isArray(raw.patternTags) ? raw.patternTags.map(String) : [],
      guaTi: Array.isArray(raw.guaTi) ? raw.guaTi.map(String) : [],
      shenSha,
      lessonSummary: String(raw.lessonSummary ?? ""),
      transmissionSummary: String(raw.transmissionSummary ?? ""),
      focusEvidence: Array.isArray(raw.focusEvidence) ? raw.focusEvidence : [],
      timingEvidence: Array.isArray(raw.timingEvidence) ? raw.timingEvidence.map(String) : []
    },
    crossCheck: {
      status: differences.length ? "differences" : "matched",
      overlapChecks: 3 + (Array.isArray(raw.heavenlyPlate) ? raw.heavenlyPlate.length : 0) + (Array.isArray(raw.fourLessons) ? raw.fourLessons.length * 2 : 0),
      differences
    },
    engineManifest: {
      native: "sizhu-liuren-ts@0.2.0",
      complete: "mingyu-core@0.1.23",
      oracle: "kentang2017/kinliuren@3ba45a9540f08269b56d81508a061c7d46938785"
    },
    warnings
  };
}
