import type { AstroProfile } from "@sizhu/core";
import { Orbit, Sparkles } from "lucide-react";

export function ZiweiSummaryPanel({ profile }: { profile: AstroProfile }) {
  const ziwei = profile.ziwei;
  if (!ziwei.available) return null;
  const meta = [
    ["命宫", ziwei.soulPalaceBranch || "-"],
    ["身宫", ziwei.bodyPalaceBranch || "-"],
    ["命主", ziwei.soulStar || "-"],
    ["身主", ziwei.bodyStar || "-"],
    ["五行局", ziwei.fiveElementsClass || "-"]
  ];
  return (
    <section className="panel evidence-panel ziwei-summary-panel" aria-label="紫微斗数结构化摘要">
      <div className="evidence-title">
        <div><p className="eyeline">Normalized Zi Wei</p><h2>紫微结构化摘要</h2></div>
        <Orbit size={22} />
      </div>
      <div className="ziwei-meta-grid">
        {meta.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      <div className="mutagen-block">
        <div><Sparkles size={15} /><strong>生年四化</strong><span>按 iztro 当前配置</span></div>
        <div className="mutagen-list">
          {ziwei.natalMutagens?.length ? ziwei.natalMutagens.map((item, index) => (
            <span key={`${item.palace}-${item.star}-${item.mutagen}-${index}`}><b>{item.star}{item.mutagen}</b><em>{item.palace}</em></span>
          )) : <small>当前盘未读取到星曜四化字段。</small>}
        </div>
      </div>
      <details className="palace-data-details">
        <summary>查看十二宫结构化字段</summary>
        <div className="palace-data-grid">
          {ziwei.palaces.map((palace) => (
            <article key={`${palace.index}-${palace.name}`}>
              <header><strong>{palace.name}</strong><span>{palace.heavenlyStem}{palace.earthlyBranch}{palace.isBodyPalace ? " · 身宫" : ""}</span></header>
              <p>{palace.majorStars.map((star) => `${star.name}${star.brightness ? `(${star.brightness})` : ""}${star.mutagen ? star.mutagen : ""}`).join("、") || "无主星"}</p>
              <small>{palace.decadal ? `${palace.decadal.range[0]}–${palace.decadal.range[1]}岁 · ${palace.decadal.heavenlyStem}${palace.decadal.earthlyBranch}` : "大限数据未取"}</small>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
