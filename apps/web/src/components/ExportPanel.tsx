import { useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, Copy, Download, ImageDown, ServerCog, Sparkles } from "lucide-react";
import type { AstroProfile } from "@sizhu/core";
import { Button } from "./Button";
import { copySvgAsPng, copyText, downloadText } from "@/lib/utils";
import { showFeedback } from "@/lib/feedback";
import { useRuntimeLocale } from "@/lib/useRuntimeLocale";
import {
  buildPrompt,
  promptModes,
  promptSystems,
  renderPromptSvg,
  type PromptFormat,
  type PromptMode,
  type PromptSystem
} from "@/lib/promptBuilder";

interface ExportPanelProps { profile: AstroProfile; compact?: boolean; }

const aiDestinations = [
  { name: "ChatGPT", href: "https://chatgpt.com/" },
  { name: "Claude", href: "https://claude.ai/" },
  { name: "Gemini", href: "https://gemini.google.com/app" },
  { name: "DeepSeek", href: "https://chat.deepseek.com/" },
  { name: "Kimi", href: "https://www.kimi.com/" }
];

const modeEnglish: Record<Exclude<PromptMode, "xp">, { label: string; focus: string }> = {
  general: {
    label: "Overview",
    focus: "overall structure, Five-Phase flow, Ten-God combinations, long-term cycle rhythm and actionable questions"
  },
  relationship: {
    label: "Relationships",
    focus: "relationship patterns, communication, timing, tensions and questions that should remain uncertain"
  },
  career: {
    label: "Career",
    focus: "strengths, preferred working style, organizational dynamics, career timing and realistic decision points"
  },
  wealth: {
    label: "Wealth",
    focus: "income structure, Wealth and Output pathways, risk habits, cash-flow themes and stage-specific opportunities"
  },
  health: {
    label: "Well-being",
    focus: "symbolic Five-Phase imbalance, stress and routines without making medical diagnoses"
  },
  yearly: {
    label: "Transits",
    focus: "the current 10-year cycle and nearby annual or monthly transits, with opportunities, risks and action windows"
  }
};

const systemEnglish: Record<PromptSystem, { label: string; hint: string }> = {
  combined: { label: "BaZi + Zi Wei", hint: "Recommended: compare both systems without forcing agreement" },
  bazi: { label: "BaZi only", hint: "Four Pillars, Ten Gods, relations and luck cycles" },
  ziwei: { label: "Zi Wei only", hint: "Twelve palaces, stars, transformations and decadal cycles" }
};

function displayModeLabel(mode: PromptMode, isEnglish: boolean) {
  if (mode === "xp") return isEnglish ? "Private preferences" : "XP（性癖）";
  if (isEnglish) return modeEnglish[mode].label;
  return promptModes.find((item) => item.key === mode)?.label ?? "综合";
}

function displaySystemLabel(system: PromptSystem, isEnglish: boolean) {
  if (isEnglish) return systemEnglish[system].label;
  return promptSystems.find((item) => item.key === system)?.label ?? "八字 + 紫微";
}

function appendEngineEvidence(
  base: string,
  profile: AstroProfile,
  format: PromptFormat,
  system: PromptSystem,
  isEnglish: boolean
) {
  if (system === "ziwei") return base;
  const selected = profile.ai.evidence.filter((item) => item.label === "传统规则命中");
  if (!selected.length) return base;
  const lines = selected.map((item) => `- ${item.label}: ${item.value}`).join("\n");
  if (format === "txt") {
    return `${base}\n\n${isEnglish ? "Additional engine-gated evidence" : "计算底座追加证据"}\n${lines}`;
  }
  return isEnglish
    ? `${base}\n\n## Additional engine-gated evidence\n\n${lines}\n\n> A rule appearing here only means its encoded entry conditions matched. It is not a modern scientific fact and does not by itself establish fortune or a successful transformation.`
    : `${base}\n\n## 计算底座追加证据\n\n${lines}\n\n> 以上仅表示对应传统条文满足已编码的适用条件；不代表该条文是现代科学事实，也不自动推出吉凶或合化成立。`;
}

function englishPillars(profile: AstroProfile) {
  const labels = ["Year", "Month", "Day", "Hour"];
  return profile.bazi.pillars.map((pillar, index) =>
    `- ${labels[index] ?? pillar.key} Pillar: ${pillar.ganZhi}; stem ${pillar.stem}; branch ${pillar.branch}; Ten God ${pillar.tenGod || "not returned"}; hidden stems ${pillar.hiddenStems.join(", ") || "none"}; Na Yin ${pillar.nayin || "not returned"}; void ${pillar.empty || "not returned"}.`
  ).join("\n");
}

function englishRelations(profile: AstroProfile) {
  if (!profile.bazi.facts.natal.length) return "No natal relation was identified by the currently encoded deterministic rules.";
  return profile.bazi.facts.natal.map((fact) => {
    const participants = fact.participants
      .map((item) => `${item.label}${item.ganZhi ? ` ${item.ganZhi}` : ""}`)
      .join(" ↔ ");
    const transformation = fact.transformation
      ? ` Transformation toward ${fact.transformation.targetElement} is a candidate only.`
      : "";
    return `- ${fact.kind} / ${fact.label} [${fact.status}]: ${participants}.${transformation}`;
  }).join("\n");
}

function englishLuck(profile: AstroProfile) {
  if (!profile.bazi.luck.dayun.length) return "No 10-year luck-cycle data returned.";
  return profile.bazi.luck.dayun.slice(0, 10).map((cycle) => {
    const years = cycle.years.slice(0, 10)
      .map((year) => `${year.year ?? "?"} ${year.ganZhi}${year.tenGod ? ` (${year.tenGod})` : ""}`)
      .join(", ");
    return `- From age ${cycle.startAge ?? "?"}, ${cycle.ganZhi}${cycle.tenGod ? ` (${cycle.tenGod})` : ""}, starting around ${cycle.startYear ?? "?"}. Annual sequence: ${years || "not returned"}.`;
  }).join("\n");
}

function englishZiwei(profile: AstroProfile) {
  if (!profile.ziwei.available) return `Zi Wei data unavailable: ${profile.ziwei.error || "no palace data returned"}.`;
  const header = [
    `Life Palace branch ${profile.ziwei.soulPalaceBranch || "—"}`,
    `Body Palace branch ${profile.ziwei.bodyPalaceBranch || "—"}`,
    `Soul Star ${profile.ziwei.soulStar || "—"}`,
    `Body Star ${profile.ziwei.bodyStar || "—"}`,
    `Five-Phase Class ${profile.ziwei.fiveElementsClass || "—"}`
  ].join("; ");
  const transformations = profile.ziwei.natalMutagens?.length
    ? profile.ziwei.natalMutagens.map((item) => `${item.star}${item.mutagen} in ${item.palace}`).join(", ")
    : "not returned";
  const palaces = profile.ziwei.palaces.slice(0, 12).map((palace) => {
    const major = palace.majorStars.map((star) => `${star.name}${star.brightness ? ` (${star.brightness})` : ""}${star.mutagen ? ` [${star.mutagen}]` : ""}`).join(", ") || "none";
    const supporting = palace.minorStars.map((star) => star.name).join(", ") || "none";
    const decadal = palace.decadal
      ? `${palace.decadal.range[0]}–${palace.decadal.range[1]} years, ${palace.decadal.heavenlyStem}${palace.decadal.earthlyBranch}`
      : "none";
    return `- ${palace.name}${palace.isBodyPalace ? " (Body Palace)" : ""}: ${palace.heavenlyStem}${palace.earthlyBranch}; major stars ${major}; supporting stars ${supporting}; decadal range ${decadal}.`;
  }).join("\n");
  return `${header}.\nNatal transformations: ${transformations}.\n${palaces}`;
}

function buildEnglishPrompt(
  profile: AstroProfile,
  mode: Exclude<PromptMode, "xp">,
  format: PromptFormat,
  system: PromptSystem
) {
  const focus = modeEnglish[mode].focus;
  const fivePhases = Object.entries(profile.bazi.elementCounts)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");
  const warnings = profile.warnings.length
    ? profile.warnings.map((warning) => `- ${warning}`).join("\n")
    : "- No additional data warning was generated.";
  const time = profile.time;
  const base = [
    `Name: ${profile.input.name}`,
    `Gender input: ${profile.input.gender}`,
    `Calendar input: ${profile.input.calendar}`,
    `Time zone: ${profile.input.timezone}`,
    `Standard wall time: ${time.standard.isoLocal}`,
    `Effective calculation time: ${time.effective.isoLocal}`,
    `Time basis: ${time.effective.label} (${time.effective.mode})`,
    `Longitude correction: ${time.longitudeCorrectionMinutes ?? "not supplied"} minutes`,
    `Equation of time: ${time.equationOfTimeMinutes} minutes`,
    `Time branch changed: ${time.shichenChanged}`,
    `Calendar date changed: ${time.dateChanged}`
  ].join("\n");

  const baziBlock = `## BaZi deterministic data\n\nSolar text: ${profile.bazi.solarText}\nLunar text: ${profile.bazi.lunarText}\nZodiac: ${profile.bazi.zodiac}\nDay Master: ${profile.bazi.dayMaster}\nFive-Phase structural counts: ${fivePhases}\n\n### Four Pillars\n${englishPillars(profile)}\n\n### Deterministic structural relations\n${englishRelations(profile)}\n\n### 10-year and annual cycles\n${englishLuck(profile)}`;
  const ziweiBlock = `## Zi Wei Dou Shu deterministic data\n\n${englishZiwei(profile)}`;
  const data = system === "bazi" ? baziBlock : system === "ziwei" ? ziweiBlock : `${baziBlock}\n\n${ziweiBlock}`;
  const method = system === "combined"
    ? "Treat BaZi and Zi Wei as separate traditional systems. State evidence from each system separately; compare them only where useful, and do not force agreement."
    : system === "bazi"
      ? "Analyze only the supplied BaZi data. Do not invent Zi Wei evidence."
      : "Analyze only the supplied Zi Wei data. Do not invent BaZi evidence.";

  const sections = [
    "# MingXu structured analysis request",
    "",
    "## Role and boundaries",
    "Use the supplied chart as deterministic input from MingXu (AstroCopy engine). Do not recalculate the Four Pillars, luck cycles, Zi Wei palaces or transformations from memory. Clearly separate: (1) program-computed facts, (2) traditional interpretive rules, and (3) your synthesis. Present traditional metaphysics as a cultural interpretive framework, not modern scientific fact. Do not replace medical, legal, financial or other professional advice.",
    "",
    "## Analysis focus",
    `Focus on ${focus}. Ask for missing real-world context before making a strong practical recommendation. Preserve uncertainty and identify conclusions that depend on school-specific assumptions.`,
    "",
    "## Method",
    method,
    "",
    "## Input and time semantics",
    base,
    "",
    data,
    "",
    "## Engine warnings",
    warnings,
    "",
    "## Requested output",
    "1. A concise structural summary.\n2. Evidence table with source system and confidence.\n3. Main hypotheses, explicitly labeled as traditional interpretation.\n4. Alternative readings or conflicts.\n5. Practical questions or actions that do not depend on supernatural certainty.\n6. Data limitations and what additional context would materially change the analysis."
  ];
  const markdown = sections.join("\n");
  return format === "markdown"
    ? markdown
    : markdown.replace(/^#{1,6}\s+/gm, "").replace(/\*\*/g, "");
}

export function ExportPanel({ profile, compact = false }: ExportPanelProps) {
  const { isEnglish, pick } = useRuntimeLocale();
  const [system, setSystem] = useState<PromptSystem>("combined");
  const [mode, setMode] = useState<Exclude<PromptMode, "xp">>("general");
  const [format, setFormat] = useState<PromptFormat>("markdown");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const visibleModes = promptModes.filter((item): item is typeof item & { key: Exclude<PromptMode, "xp"> } => item.key !== "xp");
  const content = useMemo(() => {
    const base = isEnglish
      ? buildEnglishPrompt(profile, mode, format, system)
      : buildPrompt(profile, mode, format, system);
    return appendEngineEvidence(base, profile, format, system, isEnglish);
  }, [format, isEnglish, mode, profile, system]);
  const modeLabel = displayModeLabel(mode, isEnglish);
  const systemLabel = displaySystemLabel(system, isEnglish);
  const defaultStatus = pick(
    "默认使用八字 + 紫微综合资料；不想选也可以直接复制。",
    "BaZi + Zi Wei is selected by default. You can copy immediately without changing any options."
  );

  function resetCopied() {
    setCopied(false);
    setStatus("");
  }

  async function copyCurrent() {
    try {
      await copyText(content);
      setCopied(true);
      const message = pick(
        `${systemLabel} · ${modeLabel}资料已复制，可以直接粘贴到你喜欢的 AI。`,
        `${systemLabel} · ${modeLabel} data copied. Paste it into the AI of your choice.`
      );
      setStatus(message);
      showFeedback("success", pick("复制成功", "Copied"), message);
    } catch (error) {
      setCopied(false);
      const message = error instanceof Error
        ? error.message
        : pick("复制失败，请在高级导出里手动复制文本", "Copy failed. Use the advanced preview to copy manually.");
      setStatus(message);
      showFeedback("error", pick("复制失败", "Copy failed"), message);
    }
  }

  function downloadCurrent() {
    const ext = format === "markdown" ? "md" : "txt";
    downloadText(`astrocopy-${profile.input.name}-${system}-${mode}.${ext}`, content, "text/plain;charset=utf-8");
    const message = pick(`${systemLabel} · ${modeLabel}分析资料已下载。`, `${systemLabel} · ${modeLabel} analysis data downloaded.`);
    setStatus(message);
    showFeedback("success", pick("下载成功", "Downloaded"), message);
  }

  async function copyPromptImage() {
    const title = pick(`${systemLabel} · ${modeLabel}分析提示词`, `${systemLabel} · ${modeLabel} analysis prompt`);
    const svg = renderPromptSvg(title, content);
    try {
      const didCopy = await copySvgAsPng(svg);
      if (didCopy) {
        const message = pick("提示词图片已复制。", "Prompt image copied.");
        setStatus(message);
        showFeedback("success", pick("复制成功", "Copied"), message);
        return;
      }
      downloadText(`astrocopy-${profile.input.name}-${system}-${mode}.svg`, svg, "image/svg+xml;charset=utf-8");
      const message = pick("当前浏览器不支持复制图片，已自动下载 SVG。", "This browser cannot copy images, so an SVG was downloaded instead.");
      setStatus(message);
      showFeedback("success", pick("已改为下载", "Downloaded instead"), message);
    } catch (error) {
      const message = error instanceof Error ? error.message : pick("图片复制失败", "Image copy failed");
      setStatus(message);
      showFeedback("error", pick("复制失败", "Copy failed"), message);
    }
  }

  if (compact) {
    return (
      <aside className="panel export-panel export-panel-compact" aria-label={pick("交给 AI 分析", "AI analysis handoff")}>
        <div className="compact-export-heading">
          <div>
            <p className="eyeline">AI Handoff</p>
            <h2>{pick("交给 AI 分析", "Continue with AI")}</h2>
          </div>
          <Sparkles aria-hidden="true" size={17} />
        </div>
        <p className="compact-export-copy">{pick("命盘已由程序算好，复制结构化资料到你选择的 AI。", "The chart is computed. Copy a structured package to the AI you choose.")}</p>
        <label className="compact-export-field">
          <span>{pick("分析系统", "Chart system")}</span>
          <select value={system} onChange={(event) => { setSystem(event.target.value as PromptSystem); resetCopied(); }}>
            {promptSystems.map((item) => <option key={item.key} value={item.key}>{isEnglish ? systemEnglish[item.key].label : item.label}</option>)}
          </select>
        </label>
        <div className="compact-export-modes" aria-label={pick("分析重点", "Analysis focus")}>
          {visibleModes.map((item) => (
            <button className={mode === item.key ? "active" : ""} key={item.key} onClick={() => { setMode(item.key); resetCopied(); }} type="button">
              {isEnglish ? modeEnglish[item.key].label : item.label}
            </button>
          ))}
        </div>
        <Button className={`copy-prompt-button copy-prompt-button-v3 ${copied ? "is-copied" : ""}`} title={pick("复制分析资料", "Copy analysis package")} onClick={copyCurrent} variant="primary">
          {copied ? <Check size={17} /> : <Sparkles size={17} />}
          {copied ? pick("已复制", "Copied") : pick("复制给 AI", "Copy for AI")}
        </Button>
        <p className="status-line status-line-v3">{status || defaultStatus}</p>
        <details className="compact-export-details">
          <summary>{pick("打开 AI 链接与高级导出", "Open AI links and advanced export")} <ChevronDown size={14} /></summary>
          <div className="compact-export-details-inner">
            <div className="ai-destination-grid">
              {aiDestinations.map((item) => <a href={item.href} key={item.name} target="_blank" rel="noreferrer">{item.name}<ArrowUpRight size={12} /></a>)}
            </div>
            <div className="export-switch">
              {(["markdown", "txt"] as PromptFormat[]).map((item) => (
                <button className={format === item ? "active" : ""} key={item} onClick={() => setFormat(item)} type="button">
                  {item === "markdown" ? "Markdown" : pick("纯文本", "Plain text")}
                </button>
              ))}
            </div>
            <pre className="export-preview">{content}</pre>
            <div className="export-actions">
              <Button size="sm" onClick={downloadCurrent}><Download size={14} />{pick("下载", "Download")}</Button>
              <Button size="sm" onClick={copyPromptImage}><ImageDown size={14} />{pick("复制图片", "Copy image")}</Button>
              <Button size="sm" onClick={copyCurrent}><Copy size={14} />{pick("复制", "Copy")}</Button>
            </div>
          </div>
        </details>
      </aside>
    );
  }

  return (
    <aside className="panel export-panel export-panel-v3">
      <div className="panel-heading">
        <div>
          <p className="eyeline">AI Handoff</p>
          <h2>{pick("交给你喜欢的 AI 解读", "Continue with the AI of your choice")}</h2>
        </div>
        <ServerCog className="export-heading-icon" size={22} />
      </div>
      <p className="export-intro">
        {pick(
          "命盘已经由程序算好。你不需要先看懂全部专业术语。默认把八字和紫微一起交给 AI，也可以只导出其中一套。",
          "The chart has already been computed by code. You do not need to understand every technical term. Export both systems together, or choose one."
        )}
      </p>

      <div className="handoff-step">
        <span>1</span>
        <div><strong>{pick("让 AI 看哪一套？", "Choose the chart system")}</strong><small>{pick("第一次使用保持“八字 + 紫微”即可。", "Keep BaZi + Zi Wei for the first run.")}</small></div>
      </div>
      <div className="system-switch-v3">
        {promptSystems.map((item) => (
          <button
            className={system === item.key ? "active" : ""}
            key={item.key}
            onClick={() => { setSystem(item.key); resetCopied(); }}
            type="button"
          >
            <strong>{isEnglish ? systemEnglish[item.key].label : item.label}</strong>
            <small>{isEnglish ? systemEnglish[item.key].hint : item.hint}</small>
          </button>
        ))}
      </div>

      <div className="handoff-step">
        <span>2</span>
        <div><strong>{pick("你最想问什么？", "Choose an analysis focus")}</strong><small>{pick("综合适合第一次使用。", "Overview works best for a first pass.")}</small></div>
      </div>
      <div className="mode-switch mode-switch-v3">
        {visibleModes.map((item) => (
          <button
            className={mode === item.key ? "active" : ""}
            key={item.key}
            onClick={() => { setMode(item.key); resetCopied(); }}
            type="button"
          >
            {isEnglish ? modeEnglish[item.key].label : item.label}
          </button>
        ))}
      </div>

      <div className="handoff-step">
        <span>3</span>
        <div><strong>{pick("复制完整资料", "Copy the structured package")}</strong><small>{pick("时间口径、结构事实和必要警告已经整理好。", "Time semantics, structural facts and warnings are included.")}</small></div>
      </div>
      <Button className={`copy-prompt-button copy-prompt-button-v3 ${copied ? "is-copied" : ""}`} title={pick("复制分析资料", "Copy analysis package")} onClick={copyCurrent} variant="primary">
        {copied ? <Check size={20} /> : <Sparkles size={20} />}
        {copied ? pick("已复制 ✓", "Copied ✓") : pick(`复制${systemLabel} · ${modeLabel}资料给 AI`, `Copy ${systemLabel} · ${modeLabel} package`)}
      </Button>

      <div className={`ai-launcher ${copied ? "is-ready" : ""}`}>
        <div>
          <strong>{copied ? pick("✓ 已复制，选择一个 AI 继续", "✓ Copied — choose an AI to continue") : pick("复制后可快捷打开", "Quick links after copying")}</strong>
          <small>{pick("本站不会自动把出生资料发送给这些平台。", "MingXu does not automatically send your birth data to these services.")}</small>
        </div>
        <div className="ai-destination-grid">
          {aiDestinations.map((item) => <a href={item.href} key={item.name} target="_blank" rel="noreferrer">{item.name}<ArrowUpRight size={13} /></a>)}
        </div>
      </div>
      <p className="status-line status-line-v3">{status || defaultStatus}</p>

      <details className="advanced-export">
        <summary>{pick("高级导出", "Advanced export")} <small>{pick("格式、预览、下载", "format, preview and download")}</small></summary>
        <div className="advanced-export-inner">
          <div className="export-switch">
            {(["markdown", "txt"] as PromptFormat[]).map((item) => (
              <button className={format === item ? "active" : ""} key={item} onClick={() => setFormat(item)} type="button">
                {item === "markdown" ? "Markdown" : pick("纯文本", "Plain text")}
              </button>
            ))}
          </div>
          <pre className="export-preview">{content}</pre>
          <div className="export-actions">
            <Button size="sm" onClick={downloadCurrent}><Download size={17} />{pick("下载文本", "Download text")}</Button>
            <Button size="sm" onClick={copyPromptImage}><ImageDown size={17} />{pick("复制图片", "Copy image")}</Button>
            <Button size="sm" onClick={copyCurrent}><Copy size={17} />{pick("复制当前格式", "Copy current format")}</Button>
          </div>
        </div>
      </details>
    </aside>
  );
}
