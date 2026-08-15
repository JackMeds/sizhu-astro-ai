import { useState } from "react";
import { Braces, CheckCircle2, Clock3, Copy, GitCompareArrows, Orbit, ShieldCheck } from "lucide-react";
import {
  createCompleteLiurenChart,
  type LiurenCastingMethod,
  type LiurenCompleteChart,
  type TrueSolarTimeMode
} from "@sizhu/core";
import { copyText, localDateTimeToOffset } from "@/lib/utils";

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

function shanghaiNowInput() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((item) => item.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function buildAiText(chart: LiurenCompleteChart, question: string) {
  return [
    "请基于下面这份已经由程序排好的大六壬结构进行分析，不要自行重排天地盘、四课或三传。",
    "请先区分：程序计算事实 / 传统规则与课体 / 综合解释。若 crossCheck.status 不是 matched，应先解释差异，不要跳过。",
    question.trim() ? `占问：${question.trim()}` : "占问：未填写，请先按盘面结构做一般性说明，再提示我补充具体问题。",
    "",
    JSON.stringify(chart, null, 2)
  ].join("\n");
}

export function LiurenBetaPanel() {
  const [dateTime, setDateTime] = useState("");
  const [question, setQuestion] = useState("");
  const [castingMethod, setCastingMethod] = useState<LiurenCastingMethod>("time");
  const [castingNumber, setCastingNumber] = useState("");
  const [castingBranch, setCastingBranch] = useState("子");
  const [timeMode, setTimeMode] = useState<TrueSolarTimeMode>("none");
  const [longitude, setLongitude] = useState("");
  const [chart, setChart] = useState<LiurenCompleteChart | null>(null);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  function calculate() {
    if (!dateTime) {
      setError(castingMethod === "time" ? "请选择起课日期和时间。" : "请选择起课的基础日期。");
      return;
    }
    if (castingMethod === "time" && timeMode !== "none" && !longitude) {
      setError("使用太阳时修正时，需要填写经度。");
      return;
    }
    if (castingMethod === "number" && (!castingNumber || Number(castingNumber) <= 0 || !Number.isInteger(Number(castingNumber)))) {
      setError("报数起课请输入大于 0 的整数。");
      return;
    }

    try {
      const next = createCompleteLiurenChart({
        dateTime: localDateTimeToOffset(dateTime, "Asia/Shanghai"),
        timezone: "Asia/Shanghai",
        trueSolarTime: castingMethod === "time" ? timeMode : "none",
        location: castingMethod === "time" && timeMode !== "none" ? { longitude: Number(longitude) } : undefined,
        question: question.trim() || undefined,
        castingMethod,
        castingNumber: castingMethod === "number" ? Number(castingNumber) : undefined,
        castingBranch: castingMethod === "branch" ? castingBranch : undefined
      });
      setChart(next);
      setError("");
      setCopyStatus("");
    } catch (cause) {
      setChart(null);
      setError(cause instanceof Error ? cause.message : "大六壬排盘失败，请检查输入。");
    }
  }

  async function copyStructure() {
    if (!chart) return;
    try {
      await copyText(JSON.stringify(chart, null, 2));
      setCopyStatus("完整课盘 JSON 已复制。");
    } catch (cause) {
      setCopyStatus(cause instanceof Error ? cause.message : "复制失败");
    }
  }

  async function copyForAi() {
    if (!chart) return;
    try {
      await copyText(buildAiText(chart, question));
      setCopyStatus("已复制给 AI 的完整课盘与分析约束；可以粘贴到 ChatGPT、Claude、DeepSeek、Kimi 等继续解课。");
    } catch (cause) {
      setCopyStatus(cause instanceof Error ? cause.message : "复制失败");
    }
  }

  return (
    <section className="liuren-beta liuren-complete panel" aria-labelledby="liuren-title">
      <div className="liuren-beta-heading">
        <div>
          <p className="eyeline"><Orbit size={14} /> Da Liu Ren · Complete chart</p>
          <h2 id="liuren-title">大六壬起课</h2>
          <p>起课入口与排课算法分开：正时、报数和指定占时最终进入同一套天地盘、天将、四课、三传计算。本站只排课、校验和整理证据，不在站内解课；生成后可复制给你喜欢的 AI。</p>
        </div>
        <span className="liuren-beta-badge"><ShieldCheck size={16} /> Multi-engine checked</span>
      </div>

      <div className="liuren-methods" role="tablist" aria-label="大六壬起课方式">
        {castingMethods.map((item) => (
          <button
            className={castingMethod === item.value ? "active" : ""}
            key={item.value}
            onClick={() => { setCastingMethod(item.value); setChart(null); setError(""); }}
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
            <button type="button" onClick={() => setDateTime(shanghaiNowInput())}>现在</button>
          </div>
        </label>

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
          <span>占问（可选，只随结构交给 AI）</span>
          <input placeholder="例如：这次合作推进如何？" value={question} onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <button className="liuren-calc-button" type="button" onClick={calculate}>生成完整课盘</button>
      </div>

      {error ? <p className="liuren-error">{error}</p> : null}

      {chart ? (
        <div className="liuren-beta-result">
          <div className="liuren-casting-note"><strong>{chart.casting.label}</strong><span>{chart.casting.note}</span></div>

          <div className="liuren-meta-grid liuren-meta-complete">
            <span><small>月将</small><strong>{chart.complete.monthLeader}</strong></span>
            <span><small>日干支</small><strong>{chart.complete.ganzhi.day || chart.calendar.dayGanZhi}</strong></span>
            <span><small>占时</small><strong>{chart.complete.ganzhi.hour || chart.calendar.hourGanZhi}</strong></span>
            <span><small>旬空</small><strong>{chart.complete.xunKong.join("、") || "—"}</strong></span>
            <span><small>昼夜</small><strong>{chart.complete.dayNight || "—"}</strong></span>
            <span><small>贵人</small><strong>{chart.complete.noblemanBranch || "—"}</strong></span>
            <span><small>取传法</small><strong>{chart.complete.transmissionRule || "—"}</strong></span>
            <span><small>双引擎</small><strong className={chart.crossCheck.status === "matched" ? "liuren-ok" : "liuren-warn"}>{chart.crossCheck.status === "matched" ? "一致" : `${chart.crossCheck.differences.length} 差异`}</strong></span>
          </div>

          <div className="liuren-disk-wrap" role="region" aria-label="大六壬天地盘与天将" tabIndex={0}>
            <div className="liuren-disk-row liuren-disk-label"><strong>地盘</strong>{chart.native.disk.earthPlate.map((item) => <span key={`earth-${item}`}>{item}</span>)}</div>
            <div className="liuren-disk-row"><strong>天盘</strong>{chart.native.disk.heavenPlate.map((item) => <span key={`heaven-${item}`}>{item}</span>)}</div>
            <div className="liuren-disk-row liuren-general-row"><strong>天将</strong>{chart.native.skyGenerals.alignedToHeavenPlate.map((item, index) => <span key={`general-${index}`}>{item}</span>)}</div>
          </div>

          <div className="liuren-section-title"><span>四课</span><small>上下神 · 天将 · 生克关系</small></div>
          <div className="liuren-courses">
            {chart.complete.fourLessons.map((course) => (
              <article key={course.name}>
                <small>{course.name}</small>
                <strong>{course.upper}{course.lower}</strong>
                <span>{course.god}</span>
                <em>{course.relation}</em>
              </article>
            ))}
          </div>

          <div className="liuren-section-title"><span>三传</span><small>{chart.complete.transmissionPattern} · {chart.complete.transmissionRule}</small></div>
          <div className="liuren-transmissions">
            {chart.complete.threeTransmissions.map((item) => (
              <article key={item.stage}>
                <div><small>{item.stage}</small>{item.isVoid ? <i>空</i> : null}</div>
                <strong>{item.branch}</strong>
                <b>{item.god}</b>
                <p><span>{item.liuQing || "—"}</span><span>{item.dunGan ? `遁${item.dunGan}` : "遁空"}</span><span>{item.wuxing}{item.seasonState ? `·${item.seasonState}` : ""}</span></p>
                <em>{item.dayRelation || item.relation}</em>
              </article>
            ))}
          </div>

          <div className="liuren-tags-wrap">
            <div><small>课体 / 格局</small><p>{[...new Set([...chart.complete.patternTags, ...chart.complete.guaTi])].map((tag) => <span key={tag}>{tag}</span>)}</p></div>
            <div><small>传统神煞（有来源门禁）</small><p>{chart.complete.shenSha.map((item) => <span key={`${item.name}-${item.target}`} title={item.sources.join("；")}>{item.name}·{item.target}</span>)}</p></div>
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
            <p><Braces size={15} /> 完整结果只负责排课和证据整理，本站不输出吉凶解读。</p>
            <div className="liuren-copy-actions">
              <button type="button" onClick={copyStructure}><Copy size={15} />复制 JSON</button>
              <button className="liuren-ai-button" type="button" onClick={copyForAi}><Copy size={15} />复制给 AI</button>
            </div>
          </div>
          {copyStatus ? <p className="liuren-copy-status">{copyStatus}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
