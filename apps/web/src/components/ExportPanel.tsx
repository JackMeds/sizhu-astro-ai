import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy, Download, ImageDown, ServerCog, Sparkles } from "lucide-react";
import type { AstroProfile } from "@sizhu/core";
import { Button } from "./Button";
import { copySvgAsPng, copyText, downloadText } from "@/lib/utils";
import { showFeedback } from "@/lib/feedback";
import {
  buildPrompt,
  promptModes,
  promptSystems,
  renderPromptSvg,
  type PromptFormat,
  type PromptMode,
  type PromptSystem
} from "@/lib/promptBuilder";

interface ExportPanelProps { profile: AstroProfile; }
const aiDestinations = [
  { name: "ChatGPT", href: "https://chatgpt.com/" },
  { name: "Claude", href: "https://claude.ai/" },
  { name: "DeepSeek", href: "https://chat.deepseek.com/" },
  { name: "Kimi", href: "https://www.kimi.com/" },
  { name: "Gemini", href: "https://gemini.google.com/app" }
];

function displayModeLabel(mode: PromptMode) {
  if (mode === "xp") return "XP（性癖）";
  return promptModes.find((item) => item.key === mode)?.label ?? "综合";
}

function appendEngineEvidence(base: string, profile: AstroProfile, format: PromptFormat, system: PromptSystem) {
  if (system === "ziwei") return base;
  const selected = profile.ai.evidence.filter((item) => item.label === "传统规则命中");
  if (!selected.length) return base;
  const lines = selected.map((item) => `- ${item.label}：${item.value}`).join("\n");
  if (format === "txt") return `${base}\n\n计算底座追加证据\n${lines}`;
  return `${base}\n\n## 计算底座追加证据\n\n${lines}\n\n> 以上仅表示对应传统条文满足已编码的适用条件；不代表该条文是现代科学事实，也不自动推出吉凶或合化成立。`;
}

export function ExportPanel({ profile }: ExportPanelProps) {
  const [system, setSystem] = useState<PromptSystem>("combined");
  const [mode, setMode] = useState<PromptMode>("general");
  const [format, setFormat] = useState<PromptFormat>("markdown");
  const [status, setStatus] = useState("默认用八字 + 紫微综合资料；不想选也可以直接复制。");
  const [copied, setCopied] = useState(false);
  const effectiveSystem = mode === "xp" ? "combined" : system;
  const content = useMemo(
    () => appendEngineEvidence(buildPrompt(profile, mode, format, effectiveSystem), profile, format, effectiveSystem),
    [effectiveSystem, format, mode, profile]
  );
  const modeLabel = displayModeLabel(mode);
  const systemLabel = promptSystems.find((item) => item.key === effectiveSystem)?.label ?? "八字 + 紫微";

  function resetCopied() { setCopied(false); }

  async function copyCurrent() {
    try {
      await copyText(content);
      setCopied(true);
      const message = `${systemLabel} · ${modeLabel}资料已复制，可以直接粘贴到你喜欢的 AI。`;
      setStatus(message);
      showFeedback("success", "复制成功", message);
    } catch (error) {
      setCopied(false);
      const message = error instanceof Error ? error.message : "复制失败，请在高级导出里手动复制文本";
      setStatus(message);
      showFeedback("error", "复制失败", message);
    }
  }

  function downloadCurrent() {
    const ext = format === "markdown" ? "md" : "txt";
    downloadText(`ai-prompt-${profile.input.name}-${effectiveSystem}-${mode}.${ext}`, content, "text/plain;charset=utf-8");
    const message = `${systemLabel} · ${modeLabel}分析资料已下载。`;
    setStatus(message);
    showFeedback("success", "下载成功", message);
  }

  async function copyPromptImage() {
    const svg = renderPromptSvg(`${systemLabel} · ${modeLabel}分析提示词`, content);
    try {
      const didCopy = await copySvgAsPng(svg);
      if (didCopy) {
        const message = `${systemLabel} · ${modeLabel}提示词图片已复制。`;
        setStatus(message);
        showFeedback("success", "复制成功", message);
        return;
      }
      downloadText(`ai-prompt-${profile.input.name}-${effectiveSystem}-${mode}.svg`, svg, "image/svg+xml;charset=utf-8");
      const message = "当前浏览器不支持复制图片，已自动改为下载 SVG。";
      setStatus(message);
      showFeedback("success", "已改为下载", message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "图片复制失败";
      setStatus(message);
      showFeedback("error", "复制失败", message);
    }
  }

  return (
    <aside className="panel export-panel export-panel-v3">
      <div className="panel-heading">
        <div><p className="eyeline">下一步 · AI Handoff</p><h2>交给你喜欢的 AI 解读</h2></div>
        <ServerCog className="export-heading-icon" size={22} />
      </div>
      <p className="export-intro">命盘已经由程序算好。你<strong>不需要看懂全部专业术语</strong>。默认直接把八字和紫微一起交给 AI；如果你只想看其中一套，也可以一键切换。</p>

      <div className="handoff-step"><span>1</span><div><strong>让 AI 看哪一套？</strong><small>{mode === "xp" ? "XP（性癖）会自动使用八字 + 紫微完整资料。" : "第一次用保持“八字 + 紫微”即可。"}</small></div></div>
      <div className="system-switch-v3">
        {promptSystems.map((item) => (
          <button
            className={effectiveSystem === item.key ? "active" : ""}
            disabled={mode === "xp" && item.key !== "combined"}
            key={item.key}
            onClick={() => { setSystem(item.key); resetCopied(); }}
            type="button"
          >
            <strong>{item.label}</strong><small>{item.hint}</small>
          </button>
        ))}
      </div>

      <div className="handoff-step"><span>2</span><div><strong>你最想问什么？</strong><small>综合适合第一次使用；XP（性癖）会调用原来的成人亲密偏好提示词。</small></div></div>
      <div className="mode-switch mode-switch-v3">
        {promptModes.map((item) => (
          <button
            className={mode === item.key ? "active" : ""}
            key={item.key}
            onClick={() => {
              setMode(item.key);
              if (item.key === "xp") setSystem("combined");
              resetCopied();
            }}
            type="button"
          >
            {item.key === "xp" ? "XP（性癖）" : item.label}
          </button>
        ))}
      </div>

      <div className="handoff-step"><span>3</span><div><strong>复制完整资料</strong><small>程序已经自动整理所选体系、时间口径和必要计算依据。</small></div></div>
      <Button className={`copy-prompt-button copy-prompt-button-v3 ${copied ? "is-copied" : ""}`} title="复制并交给你喜欢的 AI" onClick={copyCurrent} variant="primary">
        {copied ? <Check size={20} /> : <Sparkles size={20} />}{copied ? "已复制 ✓" : `复制${systemLabel} · ${modeLabel}资料给 AI`}
      </Button>

      <div className={`ai-launcher ${copied ? "is-ready" : ""}`}>
        <div><strong>{copied ? "✓ 已复制，选择一个 AI 继续" : "复制后可快捷打开"}</strong><small>本站不会自动把出生资料发送给这些平台。</small></div>
        <div className="ai-destination-grid">
          {aiDestinations.map((item) => <a href={item.href} key={item.name} target="_blank" rel="noreferrer">{item.name}<ArrowUpRight size={13} /></a>)}
        </div>
      </div>
      <p className="status-line status-line-v3">{status}</p>

      <details className="advanced-export">
        <summary>高级导出 <small>格式、预览、下载</small></summary>
        <div className="advanced-export-inner">
          <div className="export-switch">{(["markdown", "txt"] as PromptFormat[]).map((item) => <button className={format === item ? "active" : ""} key={item} onClick={() => setFormat(item)} type="button">{item === "markdown" ? "Markdown" : "纯文本"}</button>)}</div>
          <pre className="export-preview">{content}</pre>
          <div className="export-actions">
            <Button size="sm" onClick={downloadCurrent}><Download size={17} />下载文本</Button>
            <Button size="sm" onClick={copyPromptImage}><ImageDown size={17} />复制图片</Button>
            <Button size="sm" onClick={copyCurrent}><Copy size={17} />复制当前格式</Button>
          </div>
        </div>
      </details>
    </aside>
  );
}
