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

function scopeCard(label: string, item: ZiweiHoroscopeItem | undefined) {
  if (!item) return null;
  return (
    <article className="transit-scope-card" key={label}>
      <span>{label}</span>
      <strong>{item.name || `${item.heavenlyStem}${item.earthlyBranch}`}</strong>
      <small>{item.heavenlyStem}{item.earthlyBranch}</small>
      <p>{item.mutagen.length ? item.mutagen.map((value, index) => `${["禄", "权", "科", "忌"][index] ?? index + 1}:${value}`).join(" · ") : "四化未取"}</p>
    </article>
  );
}

export function TransitInspector({ profile }: { profile: AstroProfile }) {
  const { state, dispatch } = useWorkspace();
  const { t } = useI18n();
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
        ? createTransitBaziFacts(profile.bazi.pillars, { scope: "dayun", label: `${dayun.ganZhi}大运`, ganZhi: dayun.ganZhi })
        : [];
      if (dayun && dayun.ganZhi && dayun.ganZhi !== "童限") {
        context.push({
          scope: "dayun",
          label: `${dayun.ganZhi}大运`,
          ganZhi: dayun.ganZhi,
          stem: dayun.ganZhi[0] ?? "",
          branch: dayun.ganZhi[1] ?? ""
        });
      }
      const yearFacts = yearItem?.ganZhi
        ? createTransitBaziFacts(profile.bazi.pillars, { scope: "year", label: `${year}流年`, ganZhi: yearItem.ganZhi }, context)
        : [];
      const ziwei = createZiweiHoroscope(profile.input, targetDate);
      return { year, dayun, yearItem, dayunFacts, yearFacts, ziwei };
    } catch (caught) {
      return { error: caught instanceof Error ? caught.message : String(caught) };
    }
  }, [profile, targetDate]);

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
    setError("error" in result ? result.error ?? "运限计算失败" : "");
  }, [result]);

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
        <div className="transit-title"><div><p className="eyeline">Transit Explorer</p><h2>目标日期联动</h2></div><CalendarSearch size={22} /></div>
        <label className="transit-date"><span>目标日期</span><input required type="date" value={targetDate} onChange={(event) => selectDate(event.target.value)} /></label>
        <p className="form-error">{error}</p>
      </section>
    );
  }

  const relationFacts = [...result.dayunFacts, ...result.yearFacts];
  const uniqueFacts = Array.from(new Map(relationFacts.map((item) => [item.id, item])).values());

  return (
    <section className="panel transit-inspector" id="transit-inspector" aria-label="八字紫微目标日期联动">
      <div className="transit-title">
        <div><p className="eyeline">Transit Explorer</p><h2>目标日期联动</h2><p>同一日期同时读取八字运限关系和紫微动态范围。</p></div>
        <CalendarSearch size={22} />
      </div>

      <div className="transit-toolbar">
        <label className="transit-date"><span>目标日期</span><input required type="date" value={targetDate} onChange={(event) => selectDate(event.target.value)} /></label>
        <div><span>八字大运</span><strong>{result.dayun?.ganZhi || "未覆盖"}</strong><small>{result.dayun?.startAge ?? "-"}岁起</small></div>
        <div><span>流年</span><strong>{result.yearItem?.ganZhi || result.year}</strong><small>{result.yearItem?.tenGod || "十神未取"}</small></div>
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
          <header><GitCompareArrows size={16} /><strong>八字动态关系事实</strong><span>{uniqueFacts.length} 条</span></header>
          {uniqueFacts.length ? (
            <div>{uniqueFacts.map((fact) => (
              <article key={fact.id} data-status={fact.status}>
                <strong>{fact.label}</strong>
                <span>{fact.participants.map((item) => `${item.label}${item.ganZhi ? ` ${item.ganZhi}` : ""}`).join(" ↔ ")}</span>
                {fact.transformation ? <small>合化{fact.transformation.targetElement}仅为候选</small> : null}
              </article>
            ))}</div>
          ) : <p>当前已编码规则未识别到目标大运/流年与原局的关系。</p>}
        </div>

        <div className="transit-ziwei">
          <header><Orbit size={16} /><strong>紫微动态范围</strong><span>{result.ziwei.solarDate}</span></header>
          <div className="transit-scope-grid">
            {scopeCard("大限", result.ziwei.decadal)}
            {scopeCard("小限", result.ziwei.age)}
            {scopeCard("流年", result.ziwei.yearly)}
            {scopeCard("流月", result.ziwei.monthly)}
            {scopeCard("流日", result.ziwei.daily)}
            {scopeCard("流时", result.ziwei.hourly)}
          </div>
        </div>
      </div>

      {comparisons.length ? (
        <section className="transit-comparison" aria-label="多个目标日期比较">
          <header><strong>Agent / human transit comparison</strong><span>{comparisons.length} 个日期</span></header>
          <div className="transit-comparison-grid">
            {comparisons.map((item) => {
              if ("error" in item) {
                return <article className="transit-comparison-card is-error" data-date={item.date} key={item.date}><span>{item.date}</span><strong>计算失败</strong><p>{item.error}</p></article>;
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
                    <small>{snapshot.bazi.dayun?.ganZhi || "未覆盖大运"} · {snapshot.bazi.facts.length} 条关系事实</small>
                    <p>紫微流年：{snapshot.ziwei.yearly.name || `${snapshot.ziwei.yearly.heavenlyStem}${snapshot.ziwei.yearly.earthlyBranch}`}</p>
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
