import type { CSSProperties } from "react";
import type { AstroProfile, ZiweiPalace, ZiweiStar } from "@sizhu/core";
import { useI18n } from "@/lib/i18n";
import { getZiweiPalaceFocusIds } from "@/lib/ziweiFocus";

interface ZiweiPlateProps {
  profile: AstroProfile;
  focusedIds?: string[];
}

const palacePositions = [
  "1 / 1",
  "1 / 2",
  "1 / 3",
  "1 / 4",
  "2 / 4",
  "3 / 4",
  "4 / 4",
  "4 / 3",
  "4 / 2",
  "4 / 1",
  "3 / 1",
  "2 / 1"
];

const palaceEnglish: Record<string, string> = {
  命宫: "Life",
  兄弟: "Siblings",
  夫妻: "Partner",
  子女: "Children",
  财帛: "Wealth",
  疾厄: "Health",
  迁移: "Travel",
  仆役: "Network",
  交友: "Network",
  官禄: "Career",
  事业: "Career",
  田宅: "Property",
  福德: "Wellbeing",
  父母: "Parents"
};

function starLabel(star: ZiweiStar) {
  return [
    star.name,
    star.brightness ? `·${star.brightness}` : "",
    star.mutagen ? `·${star.mutagen}` : ""
  ].join("");
}

function PalaceCard({
  palace,
  index,
  focusedIds,
  focusLabel,
  isEnglish,
  noMajorLabel,
  noSupportLabel,
  palaceLabel
}: {
  palace: ZiweiPalace;
  index: number;
  focusedIds: string[];
  focusLabel: string;
  isEnglish: boolean;
  noMajorLabel: string;
  noSupportLabel: string;
  palaceLabel: string;
}) {
  const majorStars = palace.majorStars.slice(0, 4);
  const supportingStars = [...palace.minorStars, ...palace.adjectiveStars].slice(0, 5);
  const style = { gridArea: palacePositions[index] } as CSSProperties;
  const semanticIds = getZiweiPalaceFocusIds(palace);
  const isLifePalace = semanticIds.includes("ziwei-palace-life");
  const isAgentFocused = semanticIds.some((id) => focusedIds.includes(id));
  const primarySemanticId = semanticIds.includes("ziwei-palace-life")
    ? "ziwei-palace-life"
    : semanticIds.includes("ziwei-palace-body")
      ? "ziwei-palace-body"
      : semanticIds[0];
  const englishName = palaceEnglish[palace.name] ?? palaceLabel;
  const primaryName = isEnglish ? englishName : palace.name || `${palaceLabel} ${index + 1}`;
  const secondaryName = isEnglish ? palace.name : englishName;

  return (
    <article
      className={`ziwei-palace-card${isAgentFocused ? " is-agent-focused" : ""}`}
      id={primarySemanticId}
      data-agent-focused={isAgentFocused || undefined}
      data-body-palace={palace.isBodyPalace || undefined}
      data-focus-ids={semanticIds.join(" ") || undefined}
      data-life-palace={isLifePalace || undefined}
      data-original-palace={palace.isOriginalPalace || undefined}
      style={style}
      aria-label={`${palace.name} ${palace.heavenlyStem}${palace.earthlyBranch}`}
    >
      {isAgentFocused ? <span className="ziwei-agent-focus-label">{focusLabel}</span> : null}
      <header>
        <div>
          <strong>{primaryName}</strong>
          <small>{secondaryName}</small>
        </div>
        <span>{palace.heavenlyStem}{palace.earthlyBranch}</span>
      </header>

      <div className="ziwei-palace-badges">
        {isLifePalace ? <b>命</b> : null}
        {palace.isBodyPalace ? <b>身</b> : null}
        {palace.isOriginalPalace ? <b className="is-original">因</b> : null}
        {palace.decadal ? <em>{palace.decadal.range[0]}–{palace.decadal.range[1]}</em> : null}
      </div>

      <div className="ziwei-major-stars">
        {majorStars.length
          ? majorStars.map((star, starIndex) => (
            <span data-mutagen={star.mutagen || undefined} key={`${star.name}-${starIndex}`}>
              {starLabel(star)}
            </span>
          ))
          : <span className="is-empty">{noMajorLabel}</span>}
      </div>

      {supportingStars.length ? (
        <p>{supportingStars.map((star) => starLabel(star)).join(" · ")}</p>
      ) : <p className="is-empty">{noSupportLabel}</p>}

      <footer>
        <span>{palace.changsheng12 || "—"}</span>
        <span>{palace.boshi12 || "—"}</span>
      </footer>
    </article>
  );
}

export function ZiweiPlate({ profile, focusedIds = [] }: ZiweiPlateProps) {
  const { isEnglish, t } = useI18n();
  const calculation = profile.ziwei.calculation;
  if (!calculation || !profile.ziwei.available) {
    return (
      <section className="panel ziwei-custom-plate">
        <div className="plate-title">
          <div><p className="eyeline">Zi Wei Dou Shu</p><h2>{t("ziwei.title")}</h2></div>
        </div>
        <p>{t("ziwei.unavailable")}</p>
      </section>
    );
  }

  const palaces = profile.ziwei.palaces.slice(0, 12);
  return (
    <section className="panel ziwei-custom-plate" aria-label={t("ziwei.aria")}>
      <div className="plate-title ziwei-custom-title">
        <div>
          <p className="eyeline">Zi Wei Dou Shu · Native AstroCopy renderer</p>
          <h2>{t("ziwei.title")}</h2>
        </div>
        <div className="plate-meta">
          <span>{t("ziwei.engine")}</span>
          <strong>{calculation.solarDate} · {calculation.shichen} {t("ziwei.shichen")} · {profile.input.timezone}</strong>
        </div>
      </div>

      <div className="ziwei-custom-board">
        {palaces.map((palace, index) => (
          <PalaceCard
            key={`${palace.index}-${palace.name}`}
            palace={palace}
            index={index}
            focusedIds={focusedIds}
            focusLabel={t("ziwei.focus.agent")}
            isEnglish={isEnglish}
            noMajorLabel={t("ziwei.noMajor")}
            noSupportLabel={t("ziwei.noSupport")}
            palaceLabel={t("ziwei.palace")}
          />
        ))}

        <section className="ziwei-center-card" aria-label={t("ziwei.centerAria")}>
          <p>ASTROCOPY · {isEnglish ? "ZI WEI" : "紫微"}</p>
          <h3>{profile.input.name}</h3>
          <strong>{isEnglish ? profile.ziwei.solarDate : profile.ziwei.chineseDate || profile.ziwei.lunarDate || profile.ziwei.solarDate}</strong>
          <div className="ziwei-center-grid">
            <span><small>{t("ziwei.life")}</small><b>{profile.ziwei.soulPalaceBranch || "—"}</b></span>
            <span><small>{t("ziwei.body")}</small><b>{profile.ziwei.bodyPalaceBranch || "—"}</b></span>
            <span><small>{t("ziwei.soul")}</small><b>{profile.ziwei.soulStar || "—"}</b></span>
            <span><small>{t("ziwei.bodyRuler")}</small><b>{profile.ziwei.bodyStar || "—"}</b></span>
          </div>
          <footer>
            <span>{profile.ziwei.fiveElementsClass || t("ziwei.classMissing")}</span>
            <span>{t(`time.mode.${profile.time.effective.mode}`)}</span>
          </footer>
        </section>
      </div>

      <div className="ziwei-legend" aria-label={t("ziwei.legendAria")}>
        <span><b>命</b> {t("ziwei.legend.life")}</span>
        <span><b>身</b> {t("ziwei.legend.body")}</span>
        <span><b className="is-original">因</b> {t("ziwei.legend.original")}</span>
        <span><i>禄</i><i>权</i><i>科</i><i>忌</i> {t("ziwei.legend.mutagen")}</span>
        <small>{t("ziwei.legend.note")}</small>
      </div>
    </section>
  );
}
