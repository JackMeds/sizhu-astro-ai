import type { AstroProfile, BaziRelationFact } from "@mingxu/core";
import { Braces, GitCompareArrows } from "lucide-react";
import { useRuntimeLocale } from "@/lib/useRuntimeLocale";

const kindLabels: Record<BaziRelationFact["kind"], { zh: string; en: string }> = {
  "stem-combination": { zh: "天干五合", en: "Heavenly Stem combination" },
  "branch-liuhe": { zh: "地支六合", en: "Six Harmony" },
  "branch-clash": { zh: "地支冲", en: "Earthly Branch clash" },
  "branch-harm": { zh: "地支害", en: "Earthly Branch harm" },
  "branch-break": { zh: "地支破", en: "Earthly Branch break" },
  "branch-punishment": { zh: "地支刑", en: "Earthly Branch punishment" },
  "branch-self-punishment": { zh: "地支自刑", en: "Self-punishment" },
  "three-harmony": { zh: "三合", en: "Three Harmony" },
  "three-meeting": { zh: "三会", en: "Three Meeting" },
  fuyin: { zh: "伏吟", en: "Fu Yin repetition" }
};

function statusLabel(status: BaziRelationFact["status"], isEnglish: boolean) {
  if (status === "candidate") return isEnglish ? "Candidate" : "候选";
  if (status === "complete") return isEnglish ? "Complete" : "齐全";
  return isEnglish ? "Observed" : "已出现";
}

export function BaziFactsPanel({ profile }: { profile: AstroProfile }) {
  const { isEnglish, pick } = useRuntimeLocale();
  const facts = profile.bazi.facts.natal;

  return (
    <section
      className="panel evidence-panel bazi-facts-panel"
      aria-label={pick("八字确定性关系事实", "Deterministic BaZi relation facts")}
    >
      <div className="evidence-title">
        <div>
          <p className="eyeline">Deterministic Facts</p>
          <h2>{pick("八字关系事实", "BaZi structural relations")}</h2>
        </div>
        <Braces size={22} />
      </div>
      <p className="evidence-intro">
        {pick(
          "这里只列程序能确定的结构关系，不在这一层判断吉凶、旺衰或“合化是否真正成立”。",
          "This layer contains only relations the engine can establish. It does not decide fortune, strength, or whether a transformation is ultimately valid."
        )}
      </p>

      {facts.length ? (
        <div className="fact-grid">
          {facts.map((item) => {
            const kind = kindLabels[item.kind];
            return (
              <article className="fact-card" data-status={item.status} key={item.id}>
                <div>
                  <span>{isEnglish ? kind.en : kind.zh}</span>
                  <em>{statusLabel(item.status, isEnglish)}</em>
                </div>
                <strong>{item.label}</strong>
                <small>
                  {item.participants
                    .map((participant) => `${participant.label}${participant.ganZhi ? ` ${participant.ganZhi}` : ""}`)
                    .join(" ↔ ")}
                </small>
                {item.transformation ? (
                  <p>
                    <GitCompareArrows size={13} />
                    {pick(
                      `合化${item.transformation.targetElement}：仅候选，需规则层继续判定。`,
                      `Transformation toward ${item.transformation.targetElement}: candidate only; the rule layer must evaluate it.`
                    )}
                  </p>
                ) : null}
                {item.note ? (
                  <details>
                    <summary>{pick("判定边界", "Decision boundary")}</summary>
                    <p>{item.note}</p>
                  </details>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="evidence-empty">
          {pick(
            "当前已编码规则没有识别到本命两两关系。",
            "The currently encoded rules found no pairwise natal relation."
          )}
        </p>
      )}
    </section>
  );
}
