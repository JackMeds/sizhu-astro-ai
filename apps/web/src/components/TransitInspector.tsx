import { useEffect, useMemo, useState } from "react";
import {
  createTransitBaziFacts,
  createTransitSnapshot,
  createZiweiHoroscope,
  type AstroProfile,
  type BaziRelationParticipant,
  type ZiweiHoroscopeItem
} from "@sizhu/core";
import { CalendarSearch, GitCompareArrows, Orbit, Pin, PinOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { currentLocalDateTime } from "@/lib/timezone";
import { useWorkspace } from "@/lib/workspace";

function todayLocal(timezone: string) {
  try {
    return currentLocalDateTime(timezone).slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function scopeCard(label: string, item: ZiweiHoroscopeItem | undefined, mutagenMissing: string) {
  if (!item) return null;
  return (
    <article className="transit-scope-card" key={label}>
      <span>{label}</span>
      <strong>{item.name || `${item.heavenlyStem}${item.earthlyBranch}`}</strong>
      <small>{item.heavenlyStem}{item.earthlyBranch}</small>
      <p>{item.mutagen.length ? item.mutagen.map((value, index) => `${["禄", "权", "科", "忌"][index] ?? index + 1}:${value}`).join(" · ") : mutagenMissing}</p>
    </article>
  );
}

export function TransitInspector({ profile }: { profile: AstroProfile }) {
  const { state, dispatch } = useWorkspace();
  const { isEnglish, t } = useI18n();
  const targetDate = state.selectedTransitDate ?? todayLocal(profile.input.timezone);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
  }, [profile]);

  const result = useMemo(() => {
    try {
      const year = Number(targetDate.slice(0, 4));
      const dayun = profile.bazi.luck.dayun.find((item) => item.years.some((yearItem) => yearItem.year === year));
      const yearItem = dayun?.years.find((item) => item.year === year);
      const context: BaziRelationParticipant[] = [];
      const dayunFacts = dayun && dayun.ganZhi && dayun.ganZhi !== "童限"
        ? createTransitBaziFacts(profile.bazi.pillars, { scope: "dayun", label: isEnglish ? `${dayun.ganZhi} cycle` : `${dayun.ganZhi}大运`, ganZhi: dayun.ganZhi })
        : [];
      if (dayun && dayun.ganZhi && dayun.ganZhi !== "童限") {
        context.push({
          scope: "dayun",
          label: isEnglish ? `${dayun.ganZhi} cycle` : `${dayun.ganZhi}大运`,
          ganZhi: dayun.ganZhi,
          stem: dayun.ganZhi[0] ?? "",
          branch: dayun.ganZhi[1] ?? ""
        });
      }
      const yearFacts = yearItem?.ganZhi
        ? createTransitBaziFacts(profile.bazi.pillars, { scope: "year", label: isEnglish ? `${year} annual` : `${year}流年`, ganZhi: yearItem.ganZhi }, context)
        : [];
      const ziwei = createZiweiHoroscope(profile.input, targetDate);
      return { year, dayun, yearItem, dayunFacts, yearFacts, ziwei };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : String(caught) };
    }
  }, [isEnglish, profile, targetDate]);

  const comparisons = useMemo(() => {
    return state.comparedTransitDates.map((date) => {
      try {
        return { date, snapshot: createTransitSnapshot(profile.input, date) };
      } catch (caught) {
        return { date, error: caught instanceof Error ? caught.message : String(caught) };
      }
    });
  }, [profile, state.comparedTransitDates]);

  useEffect(() => {
    setError("error" in result ? result.error ?? t("transit.error") : "");
  }, [result, t]);

  function selectDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    dispatch({
      type: "select-transit",
      date,
      actor: "user",
      label: t("activity.transit.user"),
      detail: date
    });
  }

  function togglePinnedDate(date: string) {
    const unpinning = state.pinnedTransitDate === date;
    dispatch({
      type: "pin-transit",
      date: unpinning ? null : date,
      actor: "user",
      label: t(unpinning ? "activity.unpin.user" : "activity.pin.user"),
      detail: date
    });
  }

  if ("error" in result) {
    return (
      <section className="panel transit-inspector" id="transit-inspector">
        <div className="transit-title"><div><p className="eyeline">{t("transit.kicker")}</p><h2>{t("transit.title")}</h2></div><CalendarSearch size={22} /></div>
        <label className="transit-date"><span>{t("transit.date")}</span><input required type="date" value={targetDate} onChange={(event) => selectDate(event.target.value)} /></label>
        <p className="form-error">{error}</p>
      </section>
    );
  }

  const relationFacts = [...result.dayunFacts, ...result.yearFacts];
  const uniqueFacts = Array.from(new Map(relationFacts.map((item) => [item.id, item])).values());

  return (
    <section className="panel transit-inspector" id="transit-inspector" aria-label={t("transit.aria")}>
      <div className="transit-title">
        <div><p className="eyeline">{t("transit.kicker")}</p><h2>{t("transit.title")}</h2><p>{t("transit.description")}</p></div>
        <CalendarSearch size={22} />
      </div>

      <div className="transit-toolbar">
        <label className="transit-date"><span>{t("transit.date")}</span><input required type="date" value={targetDate} onChange={(event) => selectDate(event.target.value)} /></label>
        <div><span>{t("transit.dayun")}</span><strong>{result.dayun?.ganZhi || t("transit.uncovered")}</strong><small>{t("transit.ageStart", { age: result.dayun?.startAge ?? "-" })}</small></div>
        <div><span>{t("transit.year")}</span><strong>{result.yearItem?.ganZhi || result.year}</strong><small>{result.yearItem?.tenGod || t("transit.tenGodMissing")}</small></div>
        <div className="transit-pinned-summary" data-pinned-transit={state.pinnedTransitDate ?? ""}>
          <span>{t("transit.pinned")}</span>
          <strong>{state.pinnedTransitDate ?? "—"}</strong>
          {state.pinnedTransitDate ? (
            <button data-action="unpin-transit" type="button" onClick={() => togglePinnedDate(state.pinnedTransitDate as string)}>
              <PinOff size={12} />{t("transit.unpin")}
            </button>
          ) : <small>{t("transit.notPinned")}</small>}
        </div>
      </div>

      <div className="transit-columns">
        <div className="transit-facts">
          <header><GitCompareArrows size={16} /><strong>{t("transit.baziFacts")}</strong><span>{t("transit.factCount", { count: uniqueFacts.length })}</span></header>
          {uniqueFacts.length ? (
            <div>{uniqueFacts.map((fact) => (
              <article key={fact.id} data-status={fact.status}>
                <strong>{fact.label}</strong>
                <span>{fact.participants.map((item) => `${item.label}${item.ganZhi ? ` ${item.ganZhi}` : ""}`).join(" ↔ ")}</span>
                {fact.transformation ? <small>{t("transit.transformCandidate", { element: fact.transformation.targetElement })}</small> : null}
              </article>
            ))}</div>
          ) : <p>{t("transit.noFacts")}</p>}
        </div>

        <div className="transit-ziwei">
          <header><Orbit size={16} /><strong>{t("transit.ziweiScope")}</strong><span>{result.ziwei.solarDate}</span></header>
          <div className="transit-scope-grid">
            {scopeCard(t("transit.scope.decadal"), result.ziwei.decadal, t("transit.mutagenMissing"))}
            {scopeCard(t("transit.scope.age"), result.ziwei.age, t("transit.mutagenMissing"))}
            {scopeCard(t("transit.scope.year"), result.ziwei.yearly, t("transit.mutagenMissing"))}
            {scopeCard(t("transit.scope.month"), result.ziwei.monthly, t("transit.mutagenMissing"))}
            {scopeCard(t("transit.scope.day"), result.ziwei.daily, t("transit.mutagenMissing"))}
            {scopeCard(t("transit.scope.hour"), result.ziwei.hourly, t("transit.mutagenMissing"))}
          </div>
        </div>
      </div>

      {comparisons.length ? (
        <section className="transit-comparison" aria-label={t("transit.comparison")}>
          <header><strong>{t("transit.comparison")}</strong><span>{t("transit.dateCount", { count: comparisons.length })}</span></header>
          <div className="transit-comparison-grid">
            {comparisons.map((item) => {
              if ("error" in item) {
                return <article className="transit-comparison-card is-error" data-date={item.date} key={item.date}><span>{item.date}</span><strong>{t("transit.failed")}</strong><p>{item.error}</p></article>;
              }
              const snapshot = item.snapshot;
              const isPinned = state.pinnedTransitDate === item.date;
              return (
                <article
                  className="transit-comparison-card"
                  data-selected={targetDate === item.date}
                  data-pinned={isPinned}
                  data-date={item.date}
                  key={item.date}
                >
                  <button
                    aria-label={`${t("transit.select")} ${item.date}`}
                    className="transit-comparison-select"
                    data-action="select-transit"
                    onClick={() => selectDate(item.date)}
                    type="button"
                  >
                    <span>{item.date}</span>
                    <strong>{snapshot.bazi.year?.ganZhi || snapshot.targetYear}</strong>
                    <small>{snapshot.bazi.dayun?.ganZhi || t("transit.uncoveredDayun")} · {t("transit.factCountInline", { count: snapshot.bazi.facts.length })}</small>
                    <p>{t("transit.ziweiAnnual", { value: snapshot.ziwei.yearly.name || `${snapshot.ziwei.yearly.heavenlyStem}${snapshot.ziwei.yearly.earthlyBranch}` })}</p>
                  </button>
                  <button
                    aria-label={`${t(isPinned ? "transit.unpin" : "transit.pin")} ${item.date}`}
                    aria-pressed={isPinned}
                    className="transit-comparison-pin"
                    data-action="pin-transit"
                    onClick={() => togglePinnedDate(item.date)}
                    type="button"
                  >
                    {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                    {t(isPinned ? "transit.unpin" : "transit.pin")}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}
