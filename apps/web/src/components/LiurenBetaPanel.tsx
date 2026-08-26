import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Braces,
  CheckCircle2,
  Clock3,
  Copy,
  GitCompareArrows,
  Orbit,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import {
  createCompleteLiurenChart,
  type LiurenCastingMethod,
  type LiurenCompleteChart,
  type TrueSolarTimeMode
} from "@sizhu/core";
import { showFeedback } from "@/lib/feedback";
import { currentLocalDateTime, getBrowserTimeZone } from "@/lib/timezone";
import { copyText, localDateTimeToOffset } from "@/lib/utils";
import { TimeZoneField } from "./TimeZoneField";

const timeModes: Array<{ value: TrueSolarTimeMode; label: string }> = [
  { value: "none", label: "标准时" },
  { value: "longitude", label: "地方平太阳时" },
  { value: "apparent", label: "视太阳时（真太阳时）" }
];

const castingMethods: Array<{ value: LiurenCastingMethod; label: string; hint: string }> = [
  { value: "time", label: "正时", hint: "按实际起课时间" },
  { value: "number", label: "报数", hint: "1=子…12=亥循环" },
  { value: "branch", label: "指定占时", hint: "直接选择十二地支" }
];

const branches = [..."子丑寅卯辰巳午未申酉戌亥"];

type CopyKind = "ai" | "json" | null;

function buildAiText(chart: LiurenCompleteChart, question: string) {
  return [
    "请基于下面这份已经由程序排好的大六壬结构进行分析，不要自行重排天地盘、四课或三传。",
    "请先区分：程序计算事实 / 传统规则与课体 / 综合解释。若 crossCheck.status 不是 matched，应先解释差异，不要跳过。",
    question.trim()
      ? `占问：${question.trim()}`
      : "占问：未填写，请先按盘面结构做一般性说明，再提示我补充具体问题。",
    "",
    JSON.stringify(chart, null, 2)
  ].join("\n");
}

export function LiurenBetaPanel() {
  const [dateTime, setDateTime] = useState("");
  const [timezone, setTimezone] = useState(getBrowserTimeZone);
  const [question, setQuestion] = useState("");
  const [castingMethod, setCastingMethod] = useState<LiurenCastingMethod>("time");
  const [castingNumber, setCastingNumber] = useState("");
  const [castingBranch, setCastingBranch] = useState("子");
  const [timeMode, setTimeMode] = useState<TrueSolarTimeMode>("none");
  const [longitude, setLongitude] = useState("");
  const [chart, setChart] = useState<LiurenCompleteChart | null>(null);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [copyKind, setCopyKind] = useState<CopyKind>(null);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);

  function flashCopy(kind: Exclude<CopyKind, null>) {
    setCopyKind(kind);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyKind(null), 2800);
  }

  function fail(message: string) {
    setError(message);
    showFeedback("error", "操作失败", message);
  }

  function useCurrentTime() {
    try {
      setDateTime(currentLocalDateTime(timezone));
      setError("");
    } catch (cause) {
      fail(cause instanceof Error ? cause.message : "无法读取当前时区时间。");
    }
  }

  function calculate() {
    if (!dateTime) {
      fail(castingMethod === "time" ? "请选择起课日期和时间。" : "请选择起课的基础日期。");
      return;
    }
    if (castingMethod === "time" && timeMode !== "none" && !longitude) {
      fail("使用太阳时修正时，需要填写经度。");
      return;
    }
    if (
      castingMethod === "number"
      && (!castingNumber || Number(castingNumber) <= 0 || !Number.isInteger(Number(castingNumber)))
    ) {
      fail("报数起课请输入大于 0 的整数。");
      return;
    }

    try {
      const next = createCompleteLiurenChart({
        dateTime: localDateTimeToOffset(dateTime, timezone),
        timezone,
        trueSolarTime: castingMethod === "time" ? timeMode : "none",
        location: castingMethod === "time" && timeMode !== "none"
          ? { longitude: Number(longitude) }
          : undefined,
        question: question.trim() || undefined,
        castingMethod,
        castingNumber: castingMethod === "number" ? Number(castingNumber) : undefined,
        castingBranch: castingMethod === "branch" ? castingBranch : undefined
      });
      setChart(next);
      setError("");
      setCopyStatus("");
      setCopyKind(null);
      showFeedback("success", "起课成功", "完整大六壬课盘已经生成，可以直接复制给 AI 解课。");
      window.setTimeout(
        () => document.getElementById("liuren-ready")?.scrollIntoView({ behavior: "smooth", block: "center" }),
        100
      );
    } catch (cause) {
      setChart(null);
      fail(cause instanceof Error ? cause.message : "大六壬排盘失败，请检查输入。");
    }
  }

  async function copyStructure() {
    if (!chart) return;
    try {
      await copyText(JSON.stringify(chart, null, 2));
      flashCopy("json");
      const message = "完整课盘 JSON 已复制。";
      setCopyStatus(message);
      showFeedback("success", "复制成功", message);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "复制失败";
      setCopyStatus(message);
      showFeedback("error", "复制失败", message);
    }
  }

  async function copyForAi() {
    if (!chart) return;
    try {
      await copyText(buildAiText(chart, question));
      flashCopy("ai");
      const message = "完整课盘与分析约束已复制，现在直接粘贴到你喜欢的 AI 解课即可。";
      setCopyStatus(message);
      showFeedback("success", "复制成功", message);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "复制失败";
      setCopyStatus(message);
      showFeedback("error", "复制失败", message);
    }
  }

  return (
    <section className="liuren-beta liuren-complete panel" aria-labelledby="liuren-title">
      <div className="liuren-beta-heading">
        <div>
          <p className="eyeline"><Orbit size={14} /> Da Liu Ren · Complete chart</p>
          <h2 id="liuren-title">大六壬问事</h2>
          <p>有一件具体的事想问，就在这里起课。普通用户只要选起课方式、填写时间和问题；天地盘、四课、三传等专业计算由程序完成，生成后直接复制给 AI 解课。</p>
        </div>
        <span className="liuren-beta-badge"><ShieldCheck size={16} /> 多引擎校验</span>
      </div>

      <div className="liuren-methods" role="tablist" aria-label="大六壬起课方式">
        {castingMethods.map((item) => (
          <button
            className={castingMethod === item.value ? "active" : ""}
            key={item.value}
            onClick={() => {
              setCastingMethod(item.value);
              setChart(null);
              setError("");
              setCopyKind(null);
            }}
            type="button"
          >
            <strong>{item.label}</strong><small>{item.hint}</small>
          </button>
        ))}
      </div>

      <div className="liuren-beta-form liuren-complete-form">
        <label>
          <span><Clock3 size={14} /> {castingMethod === "time" ? "起课时间" : "基础日期"}</span>
          <div className="liuren-datetime-row">
            <input type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} />
            <button type="button" onClick={useCurrentTime}>现在</button>
          </div>
        </label>

        <TimeZoneField label="起课地时区" value={timezone} onChange={setTimezone} />

        {castingMethod === "time" ? (
          <>
            <label>
              <span>时间口径</span>
              <select value={timeMode} onChange={(event) => setTimeMode(event.target.value as TrueSolarTimeMode)}>
                {timeModes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            {timeMode !== "none" ? (
              <label>
                <span>经度</span>
                <input inputMode="decimal" placeholder="例如 121.47" value={longitude} onChange={(event) => setLongitude(event.target.value)} />
              </label>
            ) : null}
          </>
        ) : null}

        {castingMethod === "number" ? (
          <label>
            <span>报数</span>
            <input inputMode="numeric" min="1" step="1" type="number" placeholder="例如 26 → 丑" value={castingNumber} onChange={(event) => setCastingNumber(event.target.value)} />
          </label>
        ) : null}

        {castingMethod === "branch" ? (
          <label>
            <span>指定占时</span>
            <select value={castingBranch} onChange={(event) => setCastingBranch(event.target.value)}>
              {branches.map((branch, index) => <option key={branch} value={branch}>{index + 1}. {branch}时</option>)}
            </select>
          </label>
        ) : null}

        <label className="liuren-question">
          <span>你想问什么？ <small>可选，但建议填写</small></span>
          <input placeholder="例如：这次合作能不能顺利推进？" value={question} onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <button className="liuren-calc-button" type="button" onClick={calculate}><Sparkles size={15} />生成完整课盘</button>
      </div>

      {error ? <p className="liuren-error">{error}</p> : null}

      <AnimatePresence mode="wait">
        {chart ? (
          <motion.div
            className="liuren-beta-result"
            key={`${chart.calendar.dayGanZhi}-${chart.calendar.hourGanZhi}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="liuren-ready-card" id="liuren-ready">
              <div><CheckCircle2 size={23} /></div>
              <section>
                <p className="eyeline">课盘已生成</p>
                <h3>{question.trim() ? `“${question.trim()}”` : "完整大六壬课盘已经准备好"}</h3>
                <span>不需要先看懂四课三传。程序已经把完整结构与校验信息整理好。</span>
              </section>
              <button className={copyKind === "ai" ? "is-copied" : ""} type="button" onClick={copyForAi}>
                {copyKind === "ai" ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}
                {copyKind === "ai" ? "已复制 ✓" : "复制给 AI 解课"}
              </button>
            </div>

            <div className="liuren-casting-note"><strong>{chart.casting.label}</strong><span>{chart.casting.note}</span></div>

            <div className="liuren-meta-grid liuren-meta-complete">
              <span><small>月将</small><strong>{chart.complete.monthLeader}</strong></span>
              <span><small>日干支</small><strong>{chart.complete.ganzhi.day || chart.calendar.dayGanZhi}</strong></span>
              <span><small>占时</small><strong>{chart.complete.ganzhi.hour || chart.calendar.hourGanZhi}</strong></span>
              <span><small>旬空</small><strong>{chart.complete.xunKong.join("、") || "—"}</strong></span>
              <span><small>昼夜</small><strong>{chart.complete.dayNight || "—"}</strong></span>
              <span><small>贵人</small><strong>{chart.complete.noblemanBranch || "—"}</strong></span>
              <span><small>取传法</small><strong>{chart.complete.transmissionRule || "—"}</strong></span>
              <span>
                <small>双引擎</small>
                <strong className={chart.crossCheck.status === "matched" ? "liuren-ok" : "liuren-warn"}>
                  {chart.crossCheck.status === "matched" ? "一致" : `${chart.crossCheck.differences.length} 差异`}
                </strong>
              </span>
            </div>

            <div className="liuren-disk-wrap" role="region" aria-label="大六壬天地盘与天将" tabIndex={0}>
              <div className="liuren-disk-row liuren-disk-label">
                <strong>地盘</strong>{chart.native.disk.earthPlate.map((item) => <span key={`earth-${item}`}>{item}</span>)}
              </div>
              <div className="liuren-disk-row">
                <strong>天盘</strong>{chart.native.disk.heavenPlate.map((item) => <span key={`heaven-${item}`}>{item}</span>)}
              </div>
              <div className="liuren-disk-row liuren-general-row">
                <strong>天将</strong>{chart.native.skyGenerals.alignedToHeavenPlate.map((item, index) => <span key={`general-${index}`}>{item}</span>)}
              </div>
            </div>

            <div className="liuren-section-title"><span>四课</span><small>上下神 · 天将 · 生克关系</small></div>
            <div className="liuren-courses">
              {chart.complete.fourLessons.map((course) => (
                <article key={course.name}>
                  <small>{course.name}</small><strong>{course.upper}{course.lower}</strong><span>{course.god}</span><em>{course.relation}</em>
                </article>
              ))}
            </div>

            <div className="liuren-section-title"><span>三传</span><small>{chart.complete.transmissionPattern} · {chart.complete.transmissionRule}</small></div>
            <div className="liuren-transmissions">
              {chart.complete.threeTransmissions.map((item) => (
                <article key={item.stage}>
                  <div><small>{item.stage}</small>{item.isVoid ? <i>空</i> : null}</div>
                  <strong>{item.branch}</strong><b>{item.god}</b>
                  <p>
                    <span>{item.liuQing || "—"}</span>
                    <span>{item.dunGan ? `遁${item.dunGan}` : "遁空"}</span>
                    <span>{item.wuxing}{item.seasonState ? `·${item.seasonState}` : ""}</span>
                  </p>
                  <em>{item.dayRelation || item.relation}</em>
                </article>
              ))}
            </div>

            <div className="liuren-tags-wrap">
              <div>
                <small>课体 / 格局</small>
                <p>{[...new Set([...chart.complete.patternTags, ...chart.complete.guaTi])].map((tag) => <span key={tag}>{tag}</span>)}</p>
              </div>
              <div>
                <small>传统神煞（有来源门禁）</small>
                <p>{chart.complete.shenSha.map((item) => <span key={`${item.name}-${item.target}`} title={item.sources.join("；")}>{item.name}·{item.target}</span>)}</p>
              </div>
            </div>

            <div className={`liuren-engine-audit ${chart.crossCheck.status}`}>
              <div><GitCompareArrows size={18} /><strong>引擎校验</strong></div>
              <p><code>{chart.engineManifest.native}</code> 负责自主结构层；<code>{chart.engineManifest.complete}</code> 提供完整三传/课体/神煞；CI 另以固定 <code>kinliuren</code> 源码课例作 oracle。</p>
              {chart.crossCheck.status === "matched" ? (
                <span><CheckCircle2 size={15} /> {chart.crossCheck.overlapChecks} 项重叠结构未发现差异</span>
              ) : (
                <ul>{chart.crossCheck.differences.map((item) => <li key={item}>{item}</li>)}</ul>
              )}
            </div>

            {chart.warnings.length ? <div className="liuren-warnings">{chart.warnings.map((item) => <p key={item}>{item}</p>)}</div> : null}

            <div className="liuren-beta-footer">
              <p><Braces size={15} /> 专业课盘保留给想深入的人；普通用户可以直接复制给 AI。</p>
              <div className="liuren-copy-actions">
                <button className={copyKind === "json" ? "is-copied" : ""} type="button" onClick={copyStructure}>
                  {copyKind === "json" ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                  {copyKind === "json" ? "JSON 已复制 ✓" : "复制 JSON"}
                </button>
                <button className={`liuren-ai-button ${copyKind === "ai" ? "is-copied" : ""}`} type="button" onClick={copyForAi}>
                  {copyKind === "ai" ? <CheckCircle2 size={15} /> : <Sparkles size={15} />}
                  {copyKind === "ai" ? "已复制 ✓" : "复制给 AI 解课"}
                </button>
              </div>
            </div>
            {copyStatus ? <p className="liuren-copy-status">{copyStatus}</p> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
