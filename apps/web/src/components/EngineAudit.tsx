import type { AstroProfile } from "@sizhu/core";
import { Braces, CheckCircle2, Clock3, Orbit, ShieldCheck } from "lucide-react";

export function EngineAudit({ profile }: { profile: AstroProfile }) {
  const time = profile.time;
  return (
    <section className="engine-audit" aria-label="计算口径与引擎状态">
      <div className="audit-intro">
        <span className="audit-icon"><ShieldCheck size={18} /></span>
        <div>
          <strong>可审计计算链</strong>
          <small>这几项是代码输出，不由 AI 临时推算。</small>
        </div>
      </div>
      <div className="audit-facts">
        <article>
          <span><Clock3 size={14} />时间口径</span>
          <strong>{time.effective.label}</strong>
          <small>{time.effective.date} · {time.effective.time} · {time.effective.shichen}时</small>
        </article>
        <article>
          <span><Braces size={14} />八字引擎</span>
          <strong>{profile.bazi.engine}</strong>
          <small>{profile.bazi.luck.startText || "大运 / 流年 / 流月已结构化"}</small>
        </article>
        <article>
          <span><Orbit size={14} />紫微引擎</span>
          <strong>{profile.ziwei.engine}</strong>
          <small>{profile.ziwei.calculation ? `${profile.ziwei.calculation.solarDate} · ${profile.ziwei.calculation.shichen}时` : "等待排盘"}</small>
        </article>
        <article data-status={profile.warnings.length ? "warn" : "ok"}>
          <span><CheckCircle2 size={14} />一致性</span>
          <strong>{profile.warnings.length ? `${profile.warnings.length} 项需注意` : "当前无警告"}</strong>
          <small>{time.shichenChanged ? `标准时 ${time.standard.shichen} → ${time.effective.shichen}` : `时辰未跨界 · 修正 ${time.effective.correctionMinutes.toFixed(1)} 分钟`}</small>
        </article>
      </div>
      {profile.warnings.length ? (
        <details className="audit-warnings">
          <summary>查看计算警告</summary>
          <ul>{profile.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </details>
      ) : null}
    </section>
  );
}
