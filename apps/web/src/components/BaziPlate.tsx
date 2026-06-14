import type { AstroProfile } from "@sizhu/core";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Flame, Gem, Leaf, Mountain, Waves } from "lucide-react";

interface BaziPlateProps {
  profile: AstroProfile;
}

const pillarOrder = ["年柱", "月柱", "日柱", "时柱"];
const elements = ["木", "火", "土", "金", "水"];
const stemElements: Record<string, string> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水"
};
const branchElements: Record<string, string> = {
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  辰: "土",
  戌: "土",
  丑: "土",
  未: "土",
  申: "金",
  酉: "金",
  亥: "水",
  子: "水"
};

function elementOf(value: string) {
  return stemElements[value] ?? branchElements[value] ?? elements.find((element) => value.includes(element)) ?? "";
}

function ElementMark({ element }: { element: string }) {
  const icons = {
    木: Leaf,
    火: Flame,
    土: Mountain,
    金: Gem,
    水: Waves
  } as const;
  const Icon = icons[element as keyof typeof icons];
  return (
    <i className="element-mark" data-element={element} title={element || "未知"} aria-label={element || "未知"}>
      {Icon ? <Icon size={12} strokeWidth={2.4} /> : null}
    </i>
  );
}

function GanZhiText({ value }: { value: string }) {
  const stem = value[0] ?? "";
  const branch = value[1] ?? "";
  return (
    <span className="ganzhi-text">
      <b data-element={elementOf(stem)}>{stem}</b>
      <b data-element={elementOf(branch)}>{branch}</b>
    </span>
  );
}

export function BaziPlate({ profile }: BaziPlateProps) {
  const [selectedDayunIndex, setSelectedDayunIndex] = useState(0);
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const pillars = profile.bazi.pillars;
  const maxElement = Math.max(...Object.values(profile.bazi.elementCounts), 1);
  const dayunList = profile.bazi.luck.dayun;
  const selectedDayun = dayunList[Math.min(selectedDayunIndex, Math.max(0, dayunList.length - 1))];
  const selectedYear = selectedDayun?.years[Math.min(selectedYearIndex, Math.max(0, selectedDayun.years.length - 1))];
  const selectedMonth = selectedYear?.months[Math.min(selectedMonthIndex, Math.max(0, selectedYear.months.length - 1))];

  useEffect(() => {
    setSelectedDayunIndex(0);
    setSelectedYearIndex(0);
    setSelectedMonthIndex(0);
  }, [profile]);

  function selectDayun(index: number) {
    setSelectedDayunIndex(index);
    setSelectedYearIndex(0);
    setSelectedMonthIndex(0);
  }

  function selectYear(index: number) {
    setSelectedYearIndex(index);
    setSelectedMonthIndex(0);
  }

  return (
    <section className="panel bazi-plate" aria-label="八字排盘">
      <div className="plate-title">
        <div>
          <p className="eyeline">BaZi Chart</p>
          <h2>八字排盘</h2>
        </div>
        <div className="plate-meta">
          <span>{profile.bazi.solarText}</span>
          <strong>{profile.bazi.lunarText}</strong>
        </div>
      </div>

      <div className="bazi-board">
        <div className="bazi-row bazi-head">
          <span />
          {pillarOrder.map((label) => (
            <strong key={label}>{label}</strong>
          ))}
        </div>

        <div className="bazi-row">
          <span>天干</span>
          {pillars.map((pillar) => (
            <b className="stem-cell" data-element={elementOf(pillar.stem)} key={`${pillar.key}-stem`}>
              <ElementMark element={elementOf(pillar.stem)} />
              <strong>{pillar.stem}</strong>
              <em className="relation-chip">{pillar.tenGod}</em>
            </b>
          ))}
        </div>

        <div className="bazi-row">
          <span>地支</span>
          {pillars.map((pillar) => (
            <b className="branch-cell" data-element={elementOf(pillar.branch)} key={`${pillar.key}-branch`}>
              <ElementMark element={elementOf(pillar.branch)} />
              <strong>{pillar.branch}</strong>
              <em>{pillar.element}</em>
            </b>
          ))}
        </div>

        <div className="bazi-row">
          <span>藏干</span>
          {pillars.map((pillar) => (
            <small className="hidden-stems" key={`${pillar.key}-hidden`}>
              {pillar.hiddenStems.length
                ? pillar.hiddenStems.map((stem) => (
                    <span data-element={elementOf(stem)} key={stem}>
                      <ElementMark element={elementOf(stem)} />
                      {stem}
                    </span>
                  ))
                : "-"}
            </small>
          ))}
        </div>

        <div className="bazi-row">
          <span>纳音</span>
          {pillars.map((pillar) => (
            <small className="nayin-cell" data-element={elementOf(pillar.nayin)} key={`${pillar.key}-nayin`}>
              <ElementMark element={elementOf(pillar.nayin)} />
              {pillar.nayin || "-"}
            </small>
          ))}
        </div>

        <div className="bazi-row">
          <span>空亡</span>
          {pillars.map((pillar) => (
            <small key={`${pillar.key}-empty`}>{pillar.empty || "-"}</small>
          ))}
        </div>
      </div>

      <div className="bazi-secondary">
        <div className="element-panel">
          <h3>五行分布</h3>
          {elements.map((element) => {
            const value = profile.bazi.elementCounts[element] ?? 0;
            return (
              <div className="element-row" data-element={element} key={element}>
                <span><ElementMark element={element} />{element}</span>
                <div>
                  <i style={{ width: `${Math.max(6, (value / maxElement) * 100)}%` }} />
                </div>
                <em>{value}</em>
              </div>
            );
          })}
        </div>
        <div className="luck-panel">
          <h3>大运</h3>
          <div className="luck-table">
            {profile.bazi.luck.dayun.slice(0, 10).map((item, index) => (
              <div className="luck-item" key={`${item.ganZhi}-${index}`}>
                <span>{item.startAge ?? "-"}岁</span>
                <strong><GanZhiText value={item.ganZhi} /></strong>
                <em>{item.startYear ?? "-"} · {item.tenGod || "-"}</em>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="bazi-hint">{profile.bazi.strengthHint}</p>

      <div className="cycle-panel">
        <div className="cycle-title">
          <h3>大运 · 流年 · 流月明细</h3>
          <span>先选大运与流年，再在固定月份面板里切换流月</span>
        </div>
        <div className="cycle-browser">
          <div className="dayun-strip" aria-label="选择大运">
            {dayunList.map((dayun, index) => (
              <button
                data-selected={index === selectedDayunIndex}
                key={`${dayun.ganZhi}-${dayun.startYear ?? index}`}
                onClick={() => selectDayun(index)}
                type="button"
              >
                <span>{dayun.startAge ?? "-"}岁起</span>
                <strong><GanZhiText value={dayun.ganZhi} /></strong>
                <em>{dayun.startYear ?? "-"} · {dayun.tenGod || "-"}</em>
              </button>
            ))}
          </div>

          {selectedDayun ? (
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="cycle-detail"
                exit={{ opacity: 0, y: 8 }}
                initial={{ opacity: 0, y: 10 }}
                key={`${selectedDayun.ganZhi}-${selectedDayun.startYear ?? selectedDayunIndex}`}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div className="year-grid" aria-label="选择流年">
                  {selectedDayun.years.map((year, index) => (
                    <button
                      className="year-card"
                      data-selected={index === selectedYearIndex}
                      key={`${selectedDayun.ganZhi}-${year.year}`}
                      onClick={() => selectYear(index)}
                      type="button"
                    >
                      <span>{year.year ?? "-"}</span>
                      <strong><GanZhiText value={year.ganZhi} /></strong>
                      <em>{year.age ?? "-"}岁 · {year.tenGod || "-"}</em>
                    </button>
                  ))}
                </div>

                {selectedYear ? (
                  <div className="month-workspace">
                    <div className="month-grid" aria-label="选择流月">
                      {selectedYear.months.map((month, index) => (
                        <button
                          data-selected={index === selectedMonthIndex}
                          key={`${selectedYear.year}-${month.index}`}
                          onClick={() => setSelectedMonthIndex(index)}
                          title={`${month.label} ${month.ganZhi} ${month.tenGod}`}
                          type="button"
                        >
                          <small>{month.label}</small>
                          <GanZhiText value={month.ganZhi} />
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {selectedMonth ? (
                        <motion.aside
                          animate={{ opacity: 1, x: 0 }}
                          className="month-inspector"
                          exit={{ opacity: 0, x: 10 }}
                          initial={{ opacity: 0, x: 12 }}
                          key={`${selectedYear.year}-${selectedMonth.index}`}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <span>{selectedYear.year ?? "-"} · {selectedMonth.label}</span>
                          <strong><GanZhiText value={selectedMonth.ganZhi} /></strong>
                          <div>
                            <em>{selectedYear.age ?? "-"}岁</em>
                            <em>{selectedMonth.tenGod || "十神未定"}</em>
                          </div>
                          <p>
                            当前路径：{selectedDayun.startAge ?? "-"}岁起 {selectedDayun.ganZhi}大运，
                            {selectedYear.year ?? "-"}年 {selectedYear.ganZhi}流年，
                            {selectedMonth.label} {selectedMonth.ganZhi}流月。
                          </p>
                        </motion.aside>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </div>
    </section>
  );
}
