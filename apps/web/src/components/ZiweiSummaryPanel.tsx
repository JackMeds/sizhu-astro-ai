import type { AstroProfile } from "@mingxu/core";
import { Orbit, Sparkles } from "lucide-react";
import { useRuntimeLocale } from "@/lib/useRuntimeLocale";

const palaceEnglish: Record<string, string> = {
  命宫: "Life Palace",
  兄弟: "Siblings",
  夫妻: "Spouse",
  子女: "Children",
  财帛: "Wealth",
  疾厄: "Health",
  迁移: "Travel",
  仆役: "Friends",
  官禄: "Career",
  田宅: "Property",
  福德: "Well-being",
  父母: "Parents"
};

export function ZiweiSummaryPanel({ profile }: { profile: AstroProfile }) {
  const { isEnglish, pick } = useRuntimeLocale();
  const ziwei = profile.ziwei;
  const majorPalaces = ziwei.palaces
    .filter((palace) => palace.majorStars.length)
    .slice(0, 6);

  if (!ziwei.available) {
    return (
      <section className="panel ziwei-summary-panel">
        <div className="evidence-title">
          <div><p className="eyeline">Zi Wei Dou Shu</p><h2>{pick("紫微摘要", "Zi Wei summary")}</h2></div>
          <Orbit size={22} />
        </div>
        <p>{pick("紫微斗数当前不可用，请查看计算依据中的警告。", "Zi Wei calculation is currently unavailable. Review the warnings in Calculation Audit.")}</p>
      </section>
    );
  }

  return (
    <section className="panel ziwei-summary-panel" aria-label={pick("紫微斗数结构摘要", "Zi Wei Dou Shu structural summary")}>
      <div className="evidence-title">
        <div><p className="eyeline">Zi Wei Dou Shu</p><h2>{pick("紫微结构摘要", "Zi Wei structural summary")}</h2></div>
        <Orbit size={22} />
      </div>

      <div className="ziwei-summary-grid">
        <article><span>{pick("命宫", "Life Palace")}</span><strong>{ziwei.soulPalaceBranch || "—"}</strong></article>
        <article><span>{pick("身宫", "Body Palace")}</span><strong>{ziwei.bodyPalaceBranch || "—"}</strong></article>
        <article><span>{pick("命主", "Soul Star")}</span><strong>{ziwei.soulStar || "—"}</strong></article>
        <article><span>{pick("身主", "Body Star")}</span><strong>{ziwei.bodyStar || "—"}</strong></article>
        <article><span>{pick("五行局", "Five-Phase Class")}</span><strong>{ziwei.fiveElementsClass || "—"}</strong></article>
        <article><span>{pick("生肖", "Zodiac")}</span><strong>{ziwei.zodiac || profile.bazi.zodiac || "—"}</strong></article>
      </div>

      <div className="ziwei-mutagen-row">
        <div><Sparkles size={15} /><strong>{pick("生年四化", "Natal transformations")}</strong></div>
        <p>
          {ziwei.natalMutagens?.length
            ? ziwei.natalMutagens.map((item) => `${item.star}${item.mutagen} · ${item.palace}`).join("　")
            : pick("未取到四化资料", "No natal transformation data returned")}
        </p>
      </div>

      <div className="ziwei-major-list">
        <strong>{pick("主星宫位速览", "Major-star palace overview")}</strong>
        <div>
          {majorPalaces.map((palace) => (
            <article key={`${palace.index}-${palace.name}`}>
              <span>
                {palace.name}
                {isEnglish ? ` · ${palaceEnglish[palace.name] ?? "Palace"}` : ""}
              </span>
              <strong>{palace.majorStars.map((star) => `${star.name}${star.mutagen ? `[${star.mutagen}]` : ""}`).join(" · ")}</strong>
              <small>{palace.heavenlyStem}{palace.earthlyBranch}{palace.isBodyPalace ? pick(" · 身宫", " · Body Palace") : ""}</small>
            </article>
          ))}
        </div>
      </div>

      <p className="evidence-intro">
        {pick(
          "这里呈现标准化宫位和星曜结构，不把星曜名称直接转换成现实结论。",
          "This view exposes normalized palaces and stars without turning symbolic labels directly into real-world claims."
        )}
      </p>
    </section>
  );
}
