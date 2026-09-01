import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, Copy, Download, ImageDown, ServerCog, Sparkles } from "lucide-react";
import { createTransitSnapshot, type AstroProfile, type TransitSnapshot } from "@sizhu/core";
import { PROMPT_MODE_META, PROMPT_SYSTEM_META } from "@sizhu/prompt";
import { Button } from "./Button";
import { copySvgAsPng, copyText, downloadText } from "@/lib/utils";
import { showFeedback } from "@/lib/feedback";
import { useRuntimeLocale } from "@/lib/useRuntimeLocale";
import { currentLocalDateTime } from "@/lib/timezone";
import { useWorkspace } from "@/lib/workspace";
import {
  buildEnglishPrompt,
  buildPrompt,
  promptModes,
  promptSystems,
  renderPromptSvg,
  type PromptBuildContext,
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

function displayModeLabel(mode: PromptMode, isEnglish: boolean) {
  return isEnglish ? PROMPT_MODE_META[mode].label.en : PROMPT_MODE_META[mode].label.zh;
}

function displaySystemLabel(system: PromptSystem, isEnglish: boolean) {
  return isEnglish ? PROMPT_SYSTEM_META[system].label.en : PROMPT_SYSTEM_META[system].label.zh;
}

function todayInProfileTimeZone(profile: AstroProfile) {
  try {
    return currentLocalDateTime(profile.input.timezone).slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export interface PromptTransitContext extends PromptBuildContext {
  targetDate: string | null;
  dataWarningsEn?: string[];
}

export function createPromptTransitContext(
  profile: AstroProfile,
  mode: PromptMode,
  pinnedTransitDate: string | null,
  selectedTransitDate: string | null,
  comparedTransitDates: string[],
  fallbackToday = todayInProfileTimeZone(profile)
): PromptTransitContext {
  const targetDate = pinnedTransitDate ?? selectedTransitDate ?? (mode === "yearly" ? fallbackToday : null);
  const dataWarnings: string[] = [];
  const dataWarningsEn: string[] = [];
  let targetTransit: TransitSnapshot | undefined;
  if (targetDate) {
    try {
      targetTransit = createTransitSnapshot(profile.input, targetDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      dataWarnings.push(`目标日期${targetDate}动态运限计算失败：${message}`);
      dataWarningsEn.push(`Dynamic-cycle calculation failed for target date ${targetDate}: ${message}`);
    }
  }

  const comparisonTransits: TransitSnapshot[] = [];
  if (mode === "yearly" && comparedTransitDates.length >= 2) {
    for (const date of comparedTransitDates.slice(0, 5)) {
      try {
        comparisonTransits.push(createTransitSnapshot(profile.input, date));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        dataWarnings.push(`比较日期${date}动态运限计算失败：${message}`);
        dataWarningsEn.push(`Dynamic-cycle calculation failed for comparison date ${date}: ${message}`);
      }
    }
  }

  return {
    targetDate,
    ...(targetTransit ? { targetTransit } : {}),
    ...(comparisonTransits.length >= 2 ? { comparisonTransits } : {}),
    ...(dataWarnings.length ? { dataWarnings, dataWarningsEn } : {})
  };
}

export function ExportPanel({ profile, compact = false }: ExportPanelProps) {
  const { isEnglish, pick } = useRuntimeLocale();
  const { state, dispatch } = useWorkspace();
  const [system, setSystem] = useState<PromptSystem>("combined");
  const [mode, setMode] = useState<PromptMode>("general");
  const [format, setFormat] = useState<PromptFormat>("markdown");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const transitContext = useMemo(
    () => createPromptTransitContext(profile, mode, state.pinnedTransitDate, state.selectedTransitDate, state.comparedTransitDates),
    [mode, profile, state.comparedTransitDates, state.pinnedTransitDate, state.selectedTransitDate]
  );
  const promptContext: PromptBuildContext = useMemo(() => ({
    ...(state.analysisQuestion.trim() ? { question: state.analysisQuestion.trim() } : {}),
    ...(transitContext.targetTransit ? { targetTransit: transitContext.targetTransit } : {}),
    ...(transitContext.comparisonTransits ? { comparisonTransits: transitContext.comparisonTransits } : {}),
    ...(transitContext.dataWarnings ? { dataWarnings: isEnglish ? (transitContext.dataWarningsEn ?? []) : transitContext.dataWarnings } : {})
  }), [isEnglish, state.analysisQuestion, transitContext]);
  const content = useMemo(() => isEnglish
    ? buildEnglishPrompt(profile, mode, format, system, promptContext)
    : buildPrompt(profile, mode, format, system, promptContext),
  [format, isEnglish, mode, profile, promptContext, system]);
  const modeLabel = displayModeLabel(mode, isEnglish);
  const systemLabel = displaySystemLabel(system, isEnglish);
  const comparisonCount = transitContext.comparisonTransits?.length ?? 0;
  const warningCount = profile.warnings.length + (transitContext.dataWarnings?.length ?? 0);

  useEffect(() => {
    setCopied(false);
    setStatus("");
  }, [content]);

  const defaultStatus = pick(
    "默认使用八字 + 紫微综合资料；方向决定方法，具体问题决定最终回答。",
    "BaZi + Zi Wei is selected by default; the mode controls method and the question controls the final answer."
  );

  function resetCopied() {
    setCopied(false);
    setStatus("");
  }

  function updateQuestion(question: string) {
    dispatch({ type: "set-analysis-question", question: question.slice(0, 500) });
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

  const contextSummary = (
    <div className="prompt-context-summary" aria-label={pick("导出上下文", "Export context")}>
      <span>{systemLabel}</span>
      <span>{modeLabel}</span>
      <span>{state.analysisQuestion.trim() ? pick("含具体问题", "Specific question") : pick("主题报告", "Theme report")}</span>
      {transitContext.targetDate ? <span>{pick(`目标 ${transitContext.targetDate}`, `Target ${transitContext.targetDate}`)}</span> : null}
      {comparisonCount ? <span>{pick(`比较 ${comparisonCount} 个日期`, `${comparisonCount} comparison dates`)}</span> : null}
      {warningCount ? <span className="is-warning">{pick(`${warningCount} 条提醒`, `${warningCount} notices`)}</span> : null}
    </div>
  );

  const questionField = (
    <label className="prompt-question-field">
      <span>{pick("你想让 AI 重点回答的具体问题（可选）", "Specific question for the AI (optional)")}</span>
      <textarea
        maxLength={500}
        onChange={(event) => updateQuestion(event.target.value)}
        placeholder={pick("例如：未来两年更适合留在现公司，还是主动跳槽？", "For example: Over the next two years, is staying or changing jobs more favorable?")}
        rows={3}
        value={state.analysisQuestion}
      />
      <small>{pick("留空时生成完整方向报告；内容只保存在当前本地工作区。", "Leave blank for a full theme report. This stays only in the current local workspace.")} {state.analysisQuestion.length}/500</small>
    </label>
  );

  if (compact) {
    return (
      <aside className="panel export-panel export-panel-compact" aria-label={pick("交给 AI 分析", "AI analysis handoff")}>
        <div className="compact-export-heading">
          <div><p className="eyeline">AI Handoff</p><h2>{pick("交给 AI 分析", "Continue with AI")}</h2></div>
          <Sparkles aria-hidden="true" size={17} />
        </div>
        <p className="compact-export-copy">{pick("命盘已由程序算好；选择体系、方向，也可以补充一个具体问题。", "The chart is computed. Choose a system and mode, and optionally add a specific question.")}</p>
        <label className="compact-export-field">
          <span>{pick("分析系统", "Chart system")}</span>
          <select value={system} onChange={(event) => { setSystem(event.target.value as PromptSystem); resetCopied(); }}>
            {promptSystems.map((item) => <option key={item.key} value={item.key}>{displaySystemLabel(item.key, isEnglish)}</option>)}
          </select>
        </label>
        <div className="compact-export-modes" aria-label={pick("分析重点", "Analysis focus")}>
          {promptModes.map((item) => (
            <button className={mode === item.key ? "active" : ""} key={item.key} onClick={() => { setMode(item.key); resetCopied(); }} type="button">
              {displayModeLabel(item.key, isEnglish)}
            </button>
          ))}
        </div>
        {questionField}
        {contextSummary}
        <Button className={`copy-prompt-button copy-prompt-button-v3 ${copied ? "is-copied" : ""}`} title={pick("复制分析资料", "Copy analysis package")} onClick={copyCurrent} variant="primary">
          {copied ? <Check size={17} /> : <Sparkles size={17} />}
          {copied ? pick("已复制", "Copied") : pick("复制给 AI", "Copy for AI")}
        </Button>
        <p className="status-line status-line-v3">{status || defaultStatus}</p>
        <details className="compact-export-details">
          <summary>{pick("打开 AI 链接与高级导出", "Open AI links and advanced export")} <ChevronDown size={14} /></summary>
          <div className="compact-export-details-inner">
            <div className="ai-destination-grid">{aiDestinations.map((item) => <a href={item.href} key={item.name} target="_blank" rel="noreferrer">{item.name}<ArrowUpRight size={12} /></a>)}</div>
            <div className="export-switch">{(["markdown", "txt"] as PromptFormat[]).map((item) => <button className={format === item ? "active" : ""} key={item} onClick={() => setFormat(item)} type="button">{item === "markdown" ? "Markdown" : pick("纯文本", "Plain text")}</button>)}</div>
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
        <div><p className="eyeline">AI Handoff</p><h2>{pick("交给你喜欢的 AI 解读", "Continue with the AI of your choice")}</h2></div>
        <ServerCog className="export-heading-icon" size={22} />
      </div>
      <p className="export-intro">{pick("命盘已经由程序算好。选择体系与方向，也可以补充一个希望 AI 正面回答的问题。", "The chart has already been computed. Choose a system and mode, and optionally add a question the AI must answer directly.")}</p>

      <div className="handoff-step"><span>1</span><div><strong>{pick("让 AI 看哪一套？", "Choose the chart system")}</strong><small>{pick("第一次使用保持“八字 + 紫微”即可。", "Keep BaZi + Zi Wei for the first run.")}</small></div></div>
      <div className="system-switch-v3">
        {promptSystems.map((item) => <button className={system === item.key ? "active" : ""} key={item.key} onClick={() => { setSystem(item.key); resetCopied(); }} type="button"><strong>{displaySystemLabel(item.key, isEnglish)}</strong><small>{isEnglish ? (item.key === "combined" ? "Judge separately, then cross-check" : item.key === "bazi" ? "Season, structure, regulation and cycles" : "Palaces, trines, transformations and cycles") : item.hint}</small></button>)}
      </div>

      <div className="handoff-step"><span>2</span><div><strong>{pick("你最想问什么？", "Choose an analysis focus")}</strong><small>{pick("方向决定分析方法；还可以补充具体问题。", "The mode controls method; a specific question is optional.")}</small></div></div>
      <div className="mode-switch mode-switch-v3">
        {promptModes.map((item) => <button className={mode === item.key ? "active" : ""} key={item.key} onClick={() => { setMode(item.key); resetCopied(); }} type="button">{displayModeLabel(item.key, isEnglish)}</button>)}
      </div>
      {questionField}
      {contextSummary}

      <div className="handoff-step"><span>3</span><div><strong>{pick("复制完整资料", "Copy the structured package")}</strong><small>{pick("方法协议、时间口径、结构事实和必要提醒已经整理好。", "Method protocol, time basis, structural facts and notices are included.")}</small></div></div>
      <Button className={`copy-prompt-button copy-prompt-button-v3 ${copied ? "is-copied" : ""}`} title={pick("复制分析资料", "Copy analysis package")} onClick={copyCurrent} variant="primary">
        {copied ? <Check size={20} /> : <Sparkles size={20} />}
        {copied ? pick("已复制 ✓", "Copied ✓") : pick(`复制${systemLabel} · ${modeLabel}资料给 AI`, `Copy ${systemLabel} · ${modeLabel} package`)}
      </Button>

      <div className={`ai-launcher ${copied ? "is-ready" : ""}`}>
        <div><strong>{copied ? pick("✓ 已复制，选择一个 AI 继续", "✓ Copied — choose an AI to continue") : pick("复制后可快捷打开", "Quick links after copying")}</strong><small>{pick("本站不会自动把出生资料或问题发送给这些平台。", "MingXu does not automatically send birth data or questions to these services.")}</small></div>
        <div className="ai-destination-grid">{aiDestinations.map((item) => <a href={item.href} key={item.name} target="_blank" rel="noreferrer">{item.name}<ArrowUpRight size={13} /></a>)}</div>
      </div>
      <p className="status-line status-line-v3">{status || defaultStatus}</p>

      <details className="advanced-export">
        <summary>{pick("高级导出", "Advanced export")} <small>{pick("格式、预览、下载", "format, preview and download")}</small></summary>
        <div className="advanced-export-inner">
          <div className="export-switch">{(["markdown", "txt"] as PromptFormat[]).map((item) => <button className={format === item ? "active" : ""} key={item} onClick={() => setFormat(item)} type="button">{item === "markdown" ? "Markdown" : pick("纯文本", "Plain text")}</button>)}</div>
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
