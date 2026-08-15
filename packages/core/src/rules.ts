import type { PillarInfo } from "./types.js";

export type TraditionalRuleField =
  | "year.stem"
  | "year.branch"
  | "year.ganZhi"
  | "month.stem"
  | "month.branch"
  | "month.ganZhi"
  | "day.stem"
  | "day.branch"
  | "day.ganZhi"
  | "time.stem"
  | "time.branch"
  | "time.ganZhi";

export interface TraditionalRuleCondition {
  field: TraditionalRuleField;
  expected: string;
}

export interface TraditionalRuleDefinition {
  id: string;
  tradition: "bazi";
  source: {
    id: string;
    title: string;
    section: string;
  };
  conditions: TraditionalRuleCondition[];
  summary: string;
  boundary: string;
}

export interface TraditionalRuleConditionAudit extends TraditionalRuleCondition {
  actual: string;
  matched: boolean;
}

export interface TraditionalRuleAudit {
  ruleId: string;
  source: TraditionalRuleDefinition["source"];
  status: "matched" | "blocked";
  conditions: TraditionalRuleConditionAudit[];
  summary: string;
  boundary: string;
}

export interface TraditionalRuleHit extends Omit<TraditionalRuleAudit, "status"> {
  status: "matched";
}

const RULES: TraditionalRuleDefinition[] = [
  {
    id: "bazi-tiyao-chou-ren-dingwei",
    tradition: "bazi",
    source: {
      id: "bazi-tiyao",
      title: "八字提要",
      section: "丑月壬日丁未时"
    },
    conditions: [
      { field: "month.branch", expected: "丑" },
      { field: "day.stem", expected: "壬" },
      { field: "time.ganZhi", expected: "丁未" }
    ],
    summary: "该条以丑月壬日丁未时为严格适用条件，讨论土重、丁壬相合以及木金在此结构中的作用。",
    boundary: "这是传统条文的适用门禁与摘要，不等同于现代事实，也不自动推出吉凶、格局或丁壬已经合化。"
  },
  {
    id: "qiongtong-ren-yin-month",
    tradition: "bazi",
    source: {
      id: "qiongtong-baojian",
      title: "穷通宝鉴",
      section: "正月壬水"
    },
    conditions: [
      { field: "month.branch", expected: "寅" },
      { field: "day.stem", expected: "壬" }
    ],
    summary: "该条属于正月（寅月）壬水条目，只有月支为寅且日干为壬时才允许进入证据包。",
    boundary: "月令不符时必须阻断；不能因为同为壬日就把正月条文套到丑月、卯月等其他月份。"
  }
];

function pillarByKey(pillars: PillarInfo[], key: PillarInfo["key"]) {
  return pillars.find((pillar) => pillar.key === key);
}

function readField(pillars: PillarInfo[], field: TraditionalRuleField): string {
  const [pillarKey, property] = field.split(".") as [PillarInfo["key"], "stem" | "branch" | "ganZhi"];
  const pillar = pillarByKey(pillars, pillarKey);
  return pillar?.[property] ?? "";
}

export function getTraditionalRuleRegistry(): readonly TraditionalRuleDefinition[] {
  return RULES;
}

export function auditBaziTraditionalRules(pillars: PillarInfo[]): TraditionalRuleAudit[] {
  return RULES.map((rule) => {
    const conditions = rule.conditions.map((condition) => {
      const actual = readField(pillars, condition.field);
      return {
        ...condition,
        actual,
        matched: actual === condition.expected
      };
    });

    return {
      ruleId: rule.id,
      source: rule.source,
      status: conditions.every((condition) => condition.matched) ? "matched" as const : "blocked" as const,
      conditions,
      summary: rule.summary,
      boundary: rule.boundary
    };
  });
}

export function evaluateBaziTraditionalRules(pillars: PillarInfo[]): TraditionalRuleHit[] {
  return auditBaziTraditionalRules(pillars)
    .filter((audit): audit is TraditionalRuleHit => audit.status === "matched");
}
