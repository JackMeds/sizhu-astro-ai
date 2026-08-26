import type { AstroProfile } from "@sizhu/core";
import { CheckCircle2, GitCompareArrows, ShieldAlert } from "lucide-react";
import { useRuntimeLocale } from "@/lib/useRuntimeLocale";

export function EngineAudit({ profile }: { profile: AstroProfile }) {
  const { pick } = useRuntimeLocale();
  const traditionalRules = (profile.raw.traditionalRules ?? {}) as {
    hits?: Array<{ id?: string; source?: { title?: string; section?: string }; text?: string }>;
    audits?: Array<{ status?: string }>;
  };
  const ruleHits = traditionalRules.hits ?? [];
  const ruleAudits = traditionalRules.audits ?? [];
  const crossCheck = profile.bazi.crossCheck;

  return (
    <section className="panel engine-audit" aria-label={pick("计算依据与校验", "Calculation audit and validation")}>
      <div className="evidence-title">
        <div>
          <p className="eyeline">Calculation Audit</p>
          <h2>{pick("计算依据与不确定性", "Calculation evidence and uncertainty")}</h2>
        </div>
        <GitCompareArrows size={22} />
      </div>

      <p className="evidence-intro">
        {pick(
          "这里用于复核计算来源、时间修正、交叉校验和规则门禁。它不是命理解读页面。",
          "Use this view to inspect engines, time corrections, cross-checks and rule gating. It is not an interpretation page."
        )}
      </p>

      <div className="audit-grid">
        <article>
          <span>{pick("有效时间口径", "Effective time basis")}</span>
          <strong>{profile.time.effective.label}</strong>
          <p>{profile.time.effective.isoLocal}</p>
          <small>
            {pick(
              `经度修正 ${profile.time.longitudeCorrectionMinutes ?? "—"} 分钟 · 均时差 ${profile.time.equationOfTimeMinutes} 分钟`,
              `Longitude correction ${profile.time.longitudeCorrectionMinutes ?? "—"} min · equation of time ${profile.time.equationOfTimeMinutes} min`
            )}
          </small>
        </article>

        <article>
          <span>{pick("八字主引擎", "Primary BaZi engine")}</span>
          <strong>{profile.bazi.engine}</strong>
          <p>{pick("四柱、十神、藏干、运限与节气历法", "Pillars, Ten Gods, hidden stems, luck cycles and calendrical terms")}</p>
          <small>astro-ai-profile · {profile.meta.formatVersion}</small>
        </article>

        <article>
          <span>{pick("紫微主引擎", "Primary Zi Wei engine")}</span>
          <strong>{profile.ziwei.engine}</strong>
          <p>{profile.ziwei.available ? pick("十二宫与星曜结构可用", "Twelve-palace and star structure available") : pick("当前不可用", "Currently unavailable")}</p>
          <small>{profile.ziwei.error || pick("使用与八字相同的有效时间", "Uses the same effective time as BaZi")}</small>
        </article>

        <article data-status={crossCheck?.available ? "matched" : "warning"}>
          <span>{pick("八字交叉校验", "BaZi cross-check")}</span>
          <strong>{crossCheck?.available ? "lunisolar" : pick("未完成", "Unavailable")}</strong>
          <p>{crossCheck?.text || crossCheck?.error || pick("没有返回交叉校验信息", "No cross-check result returned")}</p>
          <small>{pick("校验只检查重叠历法字段，不替代完整推断。", "The cross-check covers overlapping calendrical fields, not interpretation.")}</small>
        </article>
      </div>

      <div className="rule-audit-summary">
        <div>
          <strong>{pick("传统规则条件门禁", "Traditional-rule condition gate")}</strong>
          <span>
            {pick(
              `${ruleHits.length} 条命中 · ${ruleAudits.length} 条已审计`,
              `${ruleHits.length} matched · ${ruleAudits.length} audited`
            )}
          </span>
        </div>
        {ruleHits.length ? (
          <ul>
            {ruleHits.map((item, index) => (
              <li key={item.id ?? `${item.source?.title}-${index}`}>
                <CheckCircle2 size={14} />
                <div>
                  <strong>{item.source?.title || pick("传统规则", "Traditional rule")}</strong>
                  <span>{item.source?.section || item.text || "—"}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>{pick("当前命盘没有满足已编码条件的传统条文。", "No encoded traditional rule passed its conditions for this chart.")}</p>
        )}
      </div>

      {profile.warnings.length ? (
        <div className="audit-warnings">
          <div><ShieldAlert size={16} /><strong>{pick("需要保留的提醒", "Warnings to preserve")}</strong></div>
          {profile.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      ) : (
        <div className="audit-clear"><CheckCircle2 size={16} />{pick("当前没有额外数据警告。", "No additional data warnings for the current chart.")}</div>
      )}
    </section>
  );
}
