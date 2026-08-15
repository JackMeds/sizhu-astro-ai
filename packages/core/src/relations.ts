import type { BaziRelationFact, BaziRelationParticipant, PillarInfo } from "./types.js";

const SELF_PUNISH = new Set(["辰", "午", "酉", "亥"]);

function pairSet(pairs: Array<[string, string]>) {
  return new Set(pairs.map(([a, b]) => pairKey(a, b)));
}

function pairMap(rows: Array<[string, string, string]>) {
  return new Map(rows.map(([a, b, value]) => [pairKey(a, b), value]));
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

const STEM_COMBINATIONS = pairMap([
  ["甲", "己", "土"], ["乙", "庚", "金"], ["丙", "辛", "水"], ["丁", "壬", "木"], ["戊", "癸", "火"]
]);
const BRANCH_LIUHE = pairSet([["子", "丑"], ["寅", "亥"], ["卯", "戌"], ["辰", "酉"], ["巳", "申"], ["午", "未"]]);
const BRANCH_CLASH = pairSet([["子", "午"], ["丑", "未"], ["寅", "申"], ["卯", "酉"], ["辰", "戌"], ["巳", "亥"]]);
const BRANCH_HARM = pairSet([["子", "未"], ["丑", "午"], ["寅", "巳"], ["卯", "辰"], ["申", "亥"], ["酉", "戌"]]);
const BRANCH_BREAK = pairSet([["子", "酉"], ["卯", "午"], ["辰", "丑"], ["未", "戌"], ["寅", "亥"], ["巳", "申"]]);
const BRANCH_PUNISH = new Map<string, string>([
  [pairKey("子", "卯"), "无礼之刑"],
  [pairKey("寅", "巳"), "无恩之刑"], [pairKey("巳", "申"), "无恩之刑"], [pairKey("申", "寅"), "无恩之刑"],
  [pairKey("丑", "戌"), "恃势之刑"], [pairKey("戌", "未"), "恃势之刑"], [pairKey("未", "丑"), "恃势之刑"]
]);

const THREE_HARMONY: Array<{ branches: [string, string, string]; element: string }> = [
  { branches: ["申", "子", "辰"], element: "水" },
  { branches: ["亥", "卯", "未"], element: "木" },
  { branches: ["寅", "午", "戌"], element: "火" },
  { branches: ["巳", "酉", "丑"], element: "金" }
];
const THREE_MEETING: Array<{ branches: [string, string, string]; element: string }> = [
  { branches: ["寅", "卯", "辰"], element: "木" },
  { branches: ["巳", "午", "未"], element: "火" },
  { branches: ["申", "酉", "戌"], element: "金" },
  { branches: ["亥", "子", "丑"], element: "水" }
];

function participantText(item: BaziRelationParticipant) {
  return item.key ? `${item.label}(${item.ganZhi ?? `${item.stem ?? ""}${item.branch ?? ""}`})` : `${item.label}(${item.ganZhi ?? ""})`;
}

function fact(
  kind: BaziRelationFact["kind"],
  label: string,
  participants: BaziRelationParticipant[],
  extra: Partial<BaziRelationFact> = {}
): BaziRelationFact {
  return {
    id: `${kind}:${participants.map((item) => `${item.scope}:${item.key ?? item.label}`).join("+")}:${label}`,
    kind,
    label,
    status: "observed",
    participants,
    ruleSet: "bazi-relations-v1",
    ...extra
  };
}

export function natalParticipants(pillars: PillarInfo[]): BaziRelationParticipant[] {
  return pillars.map((pillar) => ({
    scope: "natal",
    key: pillar.key,
    label: pillar.label,
    ganZhi: pillar.ganZhi,
    stem: pillar.stem,
    branch: pillar.branch
  }));
}

/**
 * Detect deterministic stem/branch relations only.
 * This function intentionally does not decide strength, auspiciousness,
 * or whether a stem combination actually transforms into its target element.
 */
export function createBaziRelationFacts(participants: BaziRelationParticipant[]): BaziRelationFact[] {
  const facts: BaziRelationFact[] = [];

  for (let i = 0; i < participants.length; i += 1) {
    for (let j = i + 1; j < participants.length; j += 1) {
      const a = participants[i];
      const b = participants[j];
      if (!a || !b) continue;

      if (a.ganZhi && b.ganZhi && a.ganZhi === b.ganZhi) {
        facts.push(fact("fuyin", `${a.ganZhi}伏吟`, [a, b], {
          note: `${participantText(a)}与${participantText(b)}干支完全相同。这里只标记伏吟结构，不直接判吉凶。`
        }));
      }

      if (a.stem && b.stem) {
        const target = STEM_COMBINATIONS.get(pairKey(a.stem, b.stem));
        if (target) {
          facts.push(fact("stem-combination", `${a.stem}${b.stem}合`, [a, b], {
            transformation: {
              targetElement: target,
              status: "candidate",
              note: `五合关系成立；“合化${target}”是否成立仍需另行检查月令、根气、透干与干扰条件。`
            }
          }));
        }
      }

      if (!a.branch || !b.branch) continue;
      const key = pairKey(a.branch, b.branch);
      if (BRANCH_LIUHE.has(key)) facts.push(fact("branch-liuhe", `${a.branch}${b.branch}六合`, [a, b]));
      if (BRANCH_CLASH.has(key)) facts.push(fact("branch-clash", `${a.branch}${b.branch}冲`, [a, b]));
      if (BRANCH_HARM.has(key)) facts.push(fact("branch-harm", `${a.branch}${b.branch}害`, [a, b]));
      if (BRANCH_BREAK.has(key)) facts.push(fact("branch-break", `${a.branch}${b.branch}破`, [a, b]));

      const punishment = BRANCH_PUNISH.get(key);
      if (punishment) {
        facts.push(fact("branch-punishment", `${a.branch}${b.branch}刑`, [a, b], {
          note: `${punishment}的两支关系已出现；是否要求三支齐全才论“完整三刑”应由具体流派规则层处理。`
        }));
      }
      if (a.branch === b.branch && SELF_PUNISH.has(a.branch)) {
        facts.push(fact("branch-self-punishment", `${a.branch}${b.branch}自刑`, [a, b]));
      }
    }
  }

  const branchParticipants = participants.filter((item) => item.branch);
  for (const group of THREE_HARMONY) {
    const present = group.branches.filter((branch) => branchParticipants.some((item) => item.branch === branch));
    if (present.length >= 2) {
      const matched = branchParticipants.filter((item) => present.includes(item.branch ?? ""));
      facts.push(fact("three-harmony", present.length === 3 ? `${group.branches.join("")}三合${group.element}局` : `${present.join("")}半合${group.element}候选`, matched, {
        status: present.length === 3 ? "complete" : "candidate",
        note: present.length === 3 ? "三合三支齐全；是否成化仍属于后续条件判断。" : `三合组尚缺${group.branches.filter((branch) => !present.includes(branch)).join("、")}。`
      }));
    }
  }
  for (const group of THREE_MEETING) {
    const present = group.branches.filter((branch) => branchParticipants.some((item) => item.branch === branch));
    if (present.length === 3) {
      facts.push(fact("three-meeting", `${group.branches.join("")}三会${group.element}局`, branchParticipants.filter((item) => present.includes(item.branch ?? "")), {
        status: "complete",
        note: "三会三支齐全；是否成化以及力量判断留给规则层。"
      }));
    }
  }

  return facts;
}

export function createNatalBaziFacts(pillars: PillarInfo[]) {
  return createBaziRelationFacts(natalParticipants(pillars));
}

export function createTransitBaziFacts(
  pillars: PillarInfo[],
  transit: { scope: Exclude<BaziRelationParticipant["scope"], "natal">; label: string; ganZhi: string },
  context: BaziRelationParticipant[] = []
) {
  const transitParticipant: BaziRelationParticipant = {
    scope: transit.scope,
    label: transit.label,
    ganZhi: transit.ganZhi,
    stem: transit.ganZhi[0] ?? "",
    branch: transit.ganZhi[1] ?? ""
  };
  const all = [...natalParticipants(pillars), ...context, transitParticipant];
  const facts = createBaziRelationFacts(all);
  return facts.filter((item) => item.participants.some((participant) => participant === transitParticipant));
}
