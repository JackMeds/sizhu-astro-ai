import { useEffect, useMemo, useRef, useState } from "react";
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
import { buildLiurenAnalysisPrompt } from "@sizhu/prompt";
import { copyText, localDateTimeToOffset } from "@/lib/utils";
import { showFeedback } from "@/lib/feedback";
import { useRuntimeLocale } from "@/lib/useRuntimeLocale";

const timeModes: Array<{ value: TrueSolarTimeMode; zh: string; en: string }> = [
  { value: "none", zh: "标准时", en: "Standard civil time" },
  { value: "longitude", zh: "地方平太阳时", en: "Local mean solar time" },
  { value: "apparent", zh: "视太阳时（真太阳时）", en: "Apparent solar time" }
];
const castingMethods: Array<{ value: LiurenCastingMethod; zh: string; en: string; zhHint: string; enHint: string }> = [
  { value: "time", zh: "正时", en: "Time casting", zhHint: "按实际起课时间", enHint: "Use the actual casting time" },
  { value: "number", zh: "报数", en: "Number casting", zhHint: "1=子…12=亥循环", enHint: "Cycle 1=Zi through 12=Hai" },
  { value: "branch", zh: "指定占时", en: "Branch casting", zhHint: "直接选择十二地支", enHint: "Choose an Earthly Branch directly" }
];
const branches = [..."子丑寅卯辰巳午未申酉戌亥"];

type CopyKind = "ai" | "json" | null;

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai";
  } catch {
    return "Asia/Shanghai";
  }
}

function nowInput(timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());
    const get = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
  } catch {
    return "";
  }
}

export function buildAiText(chart: LiurenCompleteChart, question: string, isEnglish: boolean) {
  return buildLiurenAnalysisPrompt(chart, {
    locale: isEnglish ? "en" : "zh-CN",
    question,
    format: "txt"
  });
}

export function LiurenBetaPanel() {
  const { isEnglish, pick } = useRuntimeLocale();
  const [dateTime, setDateTime] = useState("");
  const [timeZone, setTimeZone] = useState(browserTimeZone);
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
  const selectedMethod = useMemo(
    () => castingMethods.find((item) => item.value === castingMethod) ?? castingMethods[0],
    [castingMethod]
  );

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
    showFeedback("error", pick("操作失败", "Action failed"), message);
  }

  function calculate() {
    if (!dateTime) {
      fail(castingMethod === "time"
        ? pick("请选择起课日期和时间。", "Choose a casting date and time.")
        : pick("请选择起课的基础日期。", "Choose the base date for the casting."));
      return;
    }
    if (!timeZone.trim()) {
      fail(pick("请填写 IANA 时区，例如 Asia/Shanghai。", "Enter an IANA time zone such as America/Los_Angeles."));
      return;
    }
    if (castingMethod === "time" && timeMode !== "none" && !longitude) {
      fail(pick("使用太阳时修正时，需要填写经度。", "Longitude is required when applying a solar-time correction."));
      return;
    }
    if (castingMethod === "number" && (!castingNumber || Number(castingNumber) <= 0 || !Number.isInteger(Number(castingNumber)))) {
      fail(pick("报数起课请输入大于 0 的整数。", "Number casting requires a positive integer."));
      return;
    }

    try {
      const next = createCompleteLiurenChart({
        dateTime: localDateTimeToOffset(dateTime, timeZone.trim()),
        timezone: timeZone.trim(),
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
      showFeedback(
        "success",
        pick("起课成功", "Chart created"),
        pick("完整大六壬课盘已经生成，可以直接复制给 AI 解课。", "The complete Da Liu Ren structure is ready to inspect or copy to an AI.")
      );
      window.setTimeout(() => document.getElementById("liuren-ready")?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    } catch (cause) {
      setChart(null);
      fail(cause instanceof Error ? cause.message : pick("大六壬排盘失败，请检查输入。", "Da Liu Ren calculation failed. Check the inputs."));
    }
  }

  async function copyStructure() {
    if (!chart) return;
    try {
      await copyText(JSON.stringify(chart, null, 2));
      flashCopy("json");
      const message = pick("完整课盘 JSON 已复制。", "Complete chart JSON copied.");
      setCopyStatus(message);
      showFeedback("success", pick("复制成功", "Copied"), message);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : pick("复制失败", "Copy failed");
      setCopyStatus(message);
      showFeedback("error", pick("复制失败", "Copy failed"), message);
    }
  }

  async function copyForAi() {
    if (!chart) return;
    try {
      await copyText(buildAiText(chart, question, isEnglish));
      flashCopy("ai");
      const message = pick(
        "完整课盘与分析约束已复制，现在直接粘贴到你喜欢的 AI 解课即可。",
        "The complete chart and analysis constraints were copied. Paste them into the AI of your choice."
      );
      setCopyStatus(message);
      showFeedback("success", pick("复制成功", "Copied"), message);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : pick("复制失败", "Copy failed");
      setCopyStatus(message);
      showFeedback("error", pick("复制失败", "Copy failed"), message);
    }
  }

  return (
    <section className="liuren-beta liuren-complete panel" aria-labelledby="liuren-title">
      <div className="liuren-beta-heading">
        <div>
          <p className="eyeline"><Orbit size={14} /> Da Liu Ren · Complete Chart</p>
          <h2 id="liuren-title">{pick("大六壬问事", "Da Liu Ren question workspace")}</h2>
          <p>
            {pick(
              "针对一件具体的事起课。选择起课方式、时间和问题；天地盘、四课、三传等结构由程序计算，解释留给你选择的 AI。",
              "Create a chart for one concrete question. Choose the casting method, time and question; the engine computes the plates, Four Lessons and Three Transmissions, while interpretation remains with the AI you choose."
            )}
          </p>
        </div>
        <span className="liuren-beta-badge"><ShieldCheck size={16} />{pick("多引擎校验", "Multi-engine validation")}</span>
      </div>

      <div className="liuren-methods" role="tablist" aria-label={pick("大六壬起课方式", "Da Liu Ren casting method")}>
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
            <strong>{isEnglish ? item.en : item.zh}</strong>
            <small>{isEnglish ? item.enHint : item.zhHint}</small>
          </button>
        ))}
      </div>

      <div className="liuren-beta-form liuren-complete-form">
        <label>
          <span><Clock3 size={14} />{castingMethod === "time" ? pick("起课时间", "Casting time") : pick("基础日期", "Base date and time")}</span>
          <div className="liuren-datetime-row">
            <input type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} />
            <button type="button" onClick={() => setDateTime(nowInput(timeZone))}>{pick("现在", "Now")}</button>
          </div>
        </label>

        <label>
          <span>{pick("时区", "Time zone")}</span>
          <input
            list="liuren-timezones"
            placeholder={isEnglish ? "e.g. America/Los_Angeles" : "例如 Asia/Shanghai"}
            value={timeZone}
            onChange={(event) => setTimeZone(event.target.value)}
          />
          <datalist id="liuren-timezones">
            <option value="Asia/Shanghai" />
            <option value="Asia/Tokyo" />
            <option value="Asia/Singapore" />
            <option value="Europe/London" />
            <option value="America/New_York" />
            <option value="America/Los_Angeles" />
            <option value="Australia/Sydney" />
          </datalist>
        </label>

        {castingMethod === "time" ? (
          <>
            <label>
              <span>{pick("时间口径", "Time basis")}</span>
              <select value={timeMode} onChange={(event) => setTimeMode(event.target.value as TrueSolarTimeMode)}>
                {timeModes.map((item) => <option key={item.value} value={item.value}>{isEnglish ? item.en : item.zh}</option>)}
              </select>
            </label>
            {timeMode !== "none" ? (
              <label>
                <span>{pick("经度", "Longitude")}</span>
                <input inputMode="decimal" placeholder="e.g. -118.24" value={longitude} onChange={(event) => setLongitude(event.target.value)} />
              </label>
            ) : null}
          </>
        ) : null}

        {castingMethod === "number" ? (
          <label>
            <span>{pick("报数", "Reported number")}</span>
            <input inputMode="numeric" min="1" step="1" type="number" placeholder={pick("例如 26 → 丑", "e.g. 26 → Chou") } value={castingNumber} onChange={(event) => setCastingNumber(event.target.value)} />
          </label>
        ) : null}

        {castingMethod === "branch" ? (
          <label>
            <span>{pick("指定占时", "Selected hour branch")}</span>
            <select value={castingBranch} onChange={(event) => setCastingBranch(event.target.value)}>
              {branches.map((branch, index) => <option key={branch} value={branch}>{index + 1}. {branch}{pick("时", "")}</option>)}
            </select>
          </label>
        ) : null}

        <label className="liuren-question">
          <span>{pick("你想问什么？", "What is the question?")} <small>{pick("可选，但建议填写", "Optional, but recommended")}</small></span>
          <input
            placeholder={pick("例如：这次合作能不能顺利推进？", "e.g. What should I watch for in this collaboration?")}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </label>
        <button className="liuren-calc-button" type="button" onClick={calculate}>
          <Sparkles size={15} />{pick("生成完整课盘", "Create complete chart")}
        </button>
      </div>

      <p className="liuren-time-note">
        {pick(
          `当前使用 ${timeZone || "—"}。正时起课会按该 IANA 时区处理夏令时和 UTC 偏移。`,
          `Using ${timeZone || "—"}. Time casting resolves daylight-saving rules and UTC offset from this IANA zone.`
        )}
      </p>
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
                <p className="eyeline">Chart Ready</p>
                <h3>{question.trim() ? `“${question.trim()}”` : pick("完整大六壬课盘已经准备好", "The complete Da Liu Ren chart is ready")}</h3>
                <span>{pick("程序已经整理完整结构与校验信息，不必先看懂所有术语。", "The engine has organized the full structure and validation data; you do not need to understand every term first.")}</span>
              </section>
              <button className={copyKind === "ai" ? "is-copied" : ""} type="button" onClick={copyForAi}>
                {copyKind === "ai" ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}
                {copyKind === "ai" ? pick("已复制 ✓", "Copied ✓") : pick("复制给 AI 解课", "Copy for AI analysis")}
              </button>
            </div>

            <div className="liuren-casting-note">
              <strong>{chart.casting.label || (isEnglish ? selectedMethod.en : selectedMethod.zh)}</strong>
              <span>{chart.casting.note}</span>
            </div>

            <div className="liuren-meta-grid liuren-meta-complete">
              <span><small>{pick("月将", "Month General")}</small><strong>{chart.complete.monthLeader}</strong></span>
              <span><small>{pick("日干支", "Day Gan-Zhi")}</small><strong>{chart.complete.ganzhi.day || chart.calendar.dayGanZhi}</strong></span>
              <span><small>{pick("占时", "Hour Gan-Zhi")}</small><strong>{chart.complete.ganzhi.hour || chart.calendar.hourGanZhi}</strong></span>
              <span><small>{pick("旬空", "Void Branches")}</small><strong>{chart.complete.xunKong.join("、") || "—"}</strong></span>
              <span><small>{pick("昼夜", "Day / Night")}</small><strong>{chart.complete.dayNight || "—"}</strong></span>
              <span><small>{pick("贵人", "Nobleman")}</small><strong>{chart.complete.noblemanBranch || "—"}</strong></span>
              <span><small>{pick("取传法", "Transmission Rule")}</small><strong>{chart.complete.transmissionRule || "—"}</strong></span>
              <span>
                <small>{pick("双引擎", "Cross-check")}</small>
                <strong className={chart.crossCheck.status === "matched" ? "liuren-ok" : "liuren-warn"}>
                  {chart.crossCheck.status === "matched"
                    ? pick("一致", "Matched")
                    : pick(`${chart.crossCheck.differences.length} 差异`, `${chart.crossCheck.differences.length} differences`)}
                </strong>
              </span>
            </div>

            <div className="liuren-disk-wrap" role="region" aria-label={pick("大六壬天地盘与天将", "Da Liu Ren Earth/Heaven plates and Generals")} tabIndex={0}>
              <div className="liuren-disk-row liuren-disk-label">
                <strong>{pick("地盘", "Earth")}</strong>
                {chart.native.disk.earthPlate.map((item) => <span key={`earth-${item}`}>{item}</span>)}
              </div>
              <div className="liuren-disk-row">
                <strong>{pick("天盘", "Heaven")}</strong>
                {chart.native.disk.heavenPlate.map((item) => <span key={`heaven-${item}`}>{item}</span>)}
              </div>
              <div className="liuren-disk-row liuren-general-row">
                <strong>{pick("天将", "General")}</strong>
                {chart.native.skyGenerals.alignedToHeavenPlate.map((item, index) => <span key={`general-${index}`}>{item}</span>)}
              </div>
            </div>

            <div className="liuren-section-title"><span>{pick("四课", "Four Lessons")}</span><small>{pick("上下神 · 天将 · 生克关系", "upper/lower spirits · General · generating/controlling relation")}</small></div>
            <div className="liuren-courses">
              {chart.complete.fourLessons.map((course) => (
                <article key={course.name}>
                  <small>{course.name}</small><strong>{course.upper}{course.lower}</strong><span>{course.god}</span><em>{course.relation}</em>
                </article>
              ))}
            </div>

            <div className="liuren-section-title"><span>{pick("三传", "Three Transmissions")}</span><small>{chart.complete.transmissionPattern} · {chart.complete.transmissionRule}</small></div>
            <div className="liuren-transmissions">
              {chart.complete.threeTransmissions.map((item) => (
                <article key={item.stage}>
                  <div><small>{item.stage}</small>{item.isVoid ? <i>{pick("空", "Void")}</i> : null}</div>
                  <strong>{item.branch}</strong>
                  <b>{item.god}</b>
                  <p>
                    <span>{item.liuQing || "—"}</span>
                    <span>{item.dunGan ? `${pick("遁", "Hidden stem ")}${item.dunGan}` : pick("遁空", "No hidden stem")}</span>
                    <span>{item.wuxing}{item.seasonState ? ` · ${item.seasonState}` : ""}</span>
                  </p>
                  <em>{item.dayRelation || item.relation}</em>
                </article>
              ))}
            </div>

            <div className="liuren-tags-wrap">
              <div>
                <small>{pick("课体 / 格局", "Patterns / chart forms")}</small>
                <p>{[...new Set([...chart.complete.patternTags, ...chart.complete.guaTi])].map((tag) => <span key={tag}>{tag}</span>)}</p>
              </div>
              <div>
                <small>{pick("传统神煞（有来源门禁）", "Traditional Shen-Sha (source-gated)")}</small>
                <p>{chart.complete.shenSha.map((item) => <span key={`${item.name}-${item.target}`} title={item.sources.join("; ")}>{item.name} · {item.target}</span>)}</p>
              </div>
            </div>

            <div className={`liuren-engine-audit ${chart.crossCheck.status}`}>
              <div><GitCompareArrows size={18} /><strong>{pick("引擎校验", "Engine validation")}</strong></div>
              <p>
                <code>{chart.engineManifest.native}</code> {pick("负责自主结构层；", "provides the native auditable layer; ")}
                <code>{chart.engineManifest.complete}</code> {pick("提供完整三传、课体和神煞；CI 另以固定 kinliuren 源码课例作 oracle。", "provides complete transmissions, patterns and Shen-Sha; CI also checks pinned kinliuren fixtures as an oracle.")}
              </p>
              {chart.crossCheck.status === "matched" ? (
                <span><CheckCircle2 size={15} />{pick(`${chart.crossCheck.overlapChecks} 项重叠结构未发现差异`, `${chart.crossCheck.overlapChecks} overlapping fields matched`)}</span>
              ) : (
                <ul>{chart.crossCheck.differences.map((item) => <li key={item}>{item}</li>)}</ul>
              )}
            </div>

            {chart.warnings.length ? <div className="liuren-warnings">{chart.warnings.map((item) => <p key={item}>{item}</p>)}</div> : null}

            <div className="liuren-beta-footer">
              <p><Braces size={15} />{pick("专业课盘保留给想深入的人；也可以直接复制给 AI。", "Inspect the professional structure here, or copy it directly for AI-assisted analysis.")}</p>
              <div className="liuren-copy-actions">
                <button className={copyKind === "json" ? "is-copied" : ""} type="button" onClick={copyStructure}>
                  {copyKind === "json" ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                  {copyKind === "json" ? pick("JSON 已复制 ✓", "JSON copied ✓") : pick("复制 JSON", "Copy JSON")}
                </button>
                <button className={`liuren-ai-button ${copyKind === "ai" ? "is-copied" : ""}`} type="button" onClick={copyForAi}>
                  {copyKind === "ai" ? <CheckCircle2 size={15} /> : <Sparkles size={15} />}
                  {copyKind === "ai" ? pick("已复制 ✓", "Copied ✓") : pick("复制给 AI 解课", "Copy for AI analysis")}
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
