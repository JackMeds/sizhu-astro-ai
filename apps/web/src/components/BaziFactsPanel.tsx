import type { AstroProfile, BaziRelationFact } from "@sizhu/core";
import { Braces, GitCompareArrows } from "lucide-react";

const kindLabels: Partial<Record<BaziRelationFact["kind"], string>> = {
  "stem-combination": "天干五合",
  "branch-liuhe": "地支六合",
  "branch-clash": "地支冲",
  "branch-harm": "地支害",
  "branch-break": "地支破",
  "branch-punishment": "地支刑",
  "branch-self-punishment": "地支自刑",
  "three-harmony": "三合",
  "three-meeting": "三会",
  fuyin: "伏吟"
};

export function BaziFactsPanel({ profile }: { profile: AstroProfile }) {
  const facts = profile.bazi.facts.natal;
  return (
    <section className="panel evidence-panel bazi-facts-panel" aria-label="八字确定性关系事实">
      <div className="evidence-title">
        <div>
          <p className="eyeline">Deterministic Facts</p>
          <h2>八字关系事实</h2>
        </div>
        <Braces size={22} />
      </div>
      <p className="evidence-intro">这里只列程序能确定的结构关系，不在这一层判断吉凶、旺衰或“合化是否真正成立”。</p>
      {facts.length ? (
        <div className="fact-grid">
          {facts.map((item) => (
            <article className="fact-card" data-status={item.status} key={item.id}>
              <div><span>{kindLabels[item.kind] ?? item.kind}</span><em>{item.status === "candidate" ? "候选" : item.status === "complete" ? "齐全" : "已出现"}</em></div>
              <strong>{item.label}</strong>
              <small>{item.participants.map((participant) => participant.key ? `${participant.label} ${participant.ganZhi}` : `${participant.label} ${participant.ganZhi ?? ""}`).join(" ↔ ")}</small>
              {item.transformation ? <p><GitCompareArrows size={13} /> 合化{item.transformation.targetElement}：仅候选，需规则层继续判定。</p> : null}
              {item.note ? <details><summary>判定边界</summary><p>{item.note}</p></details> : null}
            </article>
          ))}
        </div>
      ) : <p className="evidence-empty">当前已编码规则没有识别到本命两两关系。</p>}
    </section>
  );
}
