import { useState } from "react";
import { Braces, Clock3, Copy, Orbit, ShieldCheck } from "lucide-react";
import {
  createLiurenBaseChart,
  type LiurenBaseChart,
  type TrueSolarTimeMode
} from "@sizhu/core";
import { copyText, localDateTimeToOffset } from "@/lib/utils";

const timeModes: Array<{ value: TrueSolarTimeMode; label: string }> = [
  { value: "none", label: "标准时" },
  { value: "longitude", label: "地方平太阳时" },
  { value: "apparent", label: "视太阳时（真太阳时）" }
];

export function LiurenBetaPanel() {
  const [dateTime, setDateTime] = useState("");
  const [question, setQuestion] = useState("");
  const [timeMode, setTimeMode] = useState<TrueSolarTimeMode>("none");
  const [longitude, setLongitude] = useState("");
  const [chart, setChart] = useState<LiurenBaseChart | null>(null);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  function calculate() {
    if (!dateTime) {
      setError("请选择起课日期和时间。");
      return;
    }
    if (timeMode !== "none" && !longitude) {
      setError("使用太阳时修正时，需要填写经度。");
      return;
    }

    try {
      const next = createLiurenBaseChart({
        dateTime: localDateTimeToOffset(dateTime, "Asia/Shanghai"),
        timezone: "Asia/Shanghai",
        trueSolarTime: timeMode,
        location: timeMode === "none" ? undefined : { longitude: Number(longitude) },
        question: question.trim() || undefined
      });
      setChart(next);
      setError("");
      setCopyStatus("");
    } catch (cause) {
      setChart(null);
      setError(cause instanceof Error ? cause.message : "大六壬结构排盘失败，请检查输入。");
    }
  }

  async function copyStructure() {
    if (!chart) return;
    try {
      await copyText(JSON.stringify(chart, null, 2));
      setCopyStatus("已复制当前 Beta 结构 JSON。三传 / 课体尚未上线，请不要把这份结构当作完整六壬课。 ");
    } catch (cause) {
      setCopyStatus(cause instanceof Error ? cause.message : "复制失败");
    }
  }

  return (
    <section className="liuren-beta panel" aria-labelledby="liuren-beta-title">
      <div className="liuren-beta-heading">
        <div>
          <p className="eyeline"><Orbit size={14} /> Da Liu Ren · Beta</p>
          <h2 id="liuren-beta-title">大六壬结构起课</h2>
          <p>当前只公开已经和固定 Python oracle 对照通过的结构：月将、天地盘、天将、四课。本站不解课；三传、课体、神煞尚未完成迁移前不会伪装成完整结果。</p>
        </div>
        <span className="liuren-beta-badge"><ShieldCheck size={16} /> Oracle-checked</span>
      </div>

      <div className="liuren-beta-form">
        <label>
          <span><Clock3 size={14} /> 起课时间</span>
          <input type="datetime-local" value={dateTime} onChange={(event) => setDateTime(event.target.value)} />
        </label>
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
        <label className="liuren-question">
          <span>占问（可选，仅随结构保存）</span>
          <input placeholder="例如：这次合作推进如何？" value={question} onChange={(event) => setQuestion(event.target.value)} />
        </label>
        <button className="liuren-calc-button" type="button" onClick={calculate}>生成结构课</button>
      </div>

      {error ? <p className="liuren-error">{error}</p> : null}

      {chart ? (
        <div className="liuren-beta-result">
          <div className="liuren-meta-grid">
            <span><small>节气</small><strong>{chart.calendar.solarTerm}</strong></span>
            <span><small>农历月</small><strong>{chart.calendar.lunarMonth}</strong></span>
            <span><small>日干支</small><strong>{chart.calendar.dayGanZhi}</strong></span>
            <span><small>时干支</small><strong>{chart.calendar.hourGanZhi}</strong></span>
            <span><small>月将</small><strong>{chart.disk.moonGeneral}</strong></span>
            <span><small>贵人</small><strong>{chart.skyGenerals.noblemanHeavenBranch} / {chart.skyGenerals.noblemanEarthBranch}</strong></span>
            <span><small>昼夜</small><strong>{chart.skyGenerals.dayOrNight}</strong></span>
            <span><small>布将</small><strong>{chart.skyGenerals.direction}</strong></span>
          </div>

          <div className="liuren-disk-wrap" role="region" aria-label="大六壬天地盘与天将" tabIndex={0}>
            <div className="liuren-disk-row liuren-disk-label"><strong>地盘</strong>{chart.disk.earthPlate.map((item) => <span key={`earth-${item}`}>{item}</span>)}</div>
            <div className="liuren-disk-row"><strong>天盘</strong>{chart.disk.heavenPlate.map((item) => <span key={`heaven-${item}`}>{item}</span>)}</div>
            <div className="liuren-disk-row liuren-general-row"><strong>天将</strong>{chart.skyGenerals.alignedToHeavenPlate.map((item, index) => <span key={`general-${index}`}>{item}</span>)}</div>
          </div>

          <div className="liuren-courses">
            {chart.fourCourses.upstreamOrder.map((course) => (
              <article key={course.label}>
                <small>{course.label}</small>
                <strong>{course.pair}</strong>
                <span>{course.general}</span>
              </article>
            ))}
          </div>

          <div className="liuren-beta-footer">
            <p><Braces size={15} /> 当前版本 <strong>{chart.engineVersion}</strong>：天地盘 → 天将 → 四课已进入原生 TypeScript；下一步迁移三传 / 课体。</p>
            <button type="button" onClick={copyStructure}><Copy size={15} />复制结构 JSON</button>
          </div>
          {copyStatus ? <p className="liuren-copy-status">{copyStatus}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
