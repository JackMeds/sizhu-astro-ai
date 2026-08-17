import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy, Download, ImageDown, ServerCog, Sparkles } from "lucide-react";
import type { AstroProfile } from "@sizhu/core";
import { Button } from "./Button";
import { copySvgAsPng, copyText, downloadText } from "@/lib/utils";
import { buildPrompt, promptModes, renderPromptSvg, type PromptFormat, type PromptMode } from "@/lib/promptBuilder";

interface ExportPanelProps { profile: AstroProfile; }
const aiDestinations = [
  { name: "ChatGPT", href: "https://chatgpt.com/" },
  { name: "Claude", href: "https://claude.ai/" },
  { name: "DeepSeek", href: "https://chat.deepseek.com/" },
  { name: "Kimi", href: "https://www.kimi.com/" },
  { name: "Gemini", href: "https://gemini.google.com/app" }
];
const primaryModes = promptModes.filter((item) => item.key !== "xp");

function appendEngineEvidence(base: string, profile: AstroProfile, format: PromptFormat) {
  const selected = profile.ai.evidence.filter((item) => item.label === "传统规则命中");
  if (!selected.length) return base;
  const lines = selected.map((item) => `- ${item.label}：${item.value}`).join("\n");
  if (format === "txt") return `${base}\n\n计算底座追加证据\n${lines}`;
  return `${base}\n\n## 计算底座追加证据\n\n${lines}\n\n> 以上仅表示对应传统条文满足已编码的适用条件；不代表该条文是现代科学事实，也不自动推出吉凶或合化成立。`;
}

export function ExportPanel({ profile }: ExportPanelProps) {
  const [mode, setMode] = useState<PromptMode>("general");
  const [format, setFormat] = useState<PromptFormat>("markdown");
  const [status, setStatus] = useState("选择你最想问的方向，然后点一次复制即可。");
  const [copied, setCopied] = useState(false);
  const content = useMemo(() => appendEngineEvidence(buildPrompt(profile, mode, format), profile, format), [format, mode, profile]);
  const modeLabel = promptModes.find((item) => item.key === mode)?.label ?? "综合";

  async function copyCurrent() {
    try {
      await copyText(content);
      setCopied(true);
      setStatus(`${modeLabel}分析资料已复制。现在打开你喜欢的 AI，直接粘贴即可。`);
    } catch (error) {
      setCopied(false);
      setStatus(error instanceof Error ? error.message : "复制失败，请在高级导出里手动复制文本");
    }
  }
  function downloadCurrent() {
    const ext = format === "markdown" ? "md" : "txt";
    downloadText(`ai-prompt-${profile.input.name}-${mode}.${ext}`, content, "text/plain;charset=utf-8");
    setStatus(`${modeLabel}分析资料已下载`);
  }
  async function copyPromptImage() {
    const svg = renderPromptSvg(`${modeLabel}命盘分析提示词`, content);
    try {
      const didCopy = await copySvgAsPng(svg);
      if (didCopy) { setStatus(`${modeLabel}提示词图片已复制`); return; }
      downloadText(`ai-prompt-${profile.input.name}-${mode}.svg`, svg, "image/svg+xml;charset=utf-8");
      setStatus("当前浏览器不支持复制图片，已改为下载 SVG");
    } catch {
      downloadText(`ai-prompt-${profile.input.name}-${mode}.svg`, svg, "image/svg+xml;charset=utf-8");
      setStatus("图片复制失败，已改为下载 SVG");
    }
  }

  return (
    <aside className="panel export-panel export-panel-v3">
      <div className="panel-heading">
        <div><p className="eyeline">下一步 · AI Handoff</p><h2>交给你喜欢的 AI 解读</h2></div>
        <ServerCog className="export-heading-icon" size={22} />
      </div>
      <p className="export-intro">命盘已经由程序算好。你<strong>不需要看懂全部专业术语</strong>，只要选择想问的方向，再复制给 ChatGPT、Claude、DeepSeek、Kimi、Gemini 或其他 AI。</p>

      <div className="handoff-step"><span>1</span><div><strong>你最想问什么？</strong><small>综合适合第一次使用，其他选项会让 AI 更聚焦。</small></div></div>
      <div className="mode-switch mode-switch-v3">
        {primaryModes.map((item) => <button className={mode === item.key ? "active" : ""} key={item.key} onClick={() => { setMode(item.key); setCopied(false); }} type="button">{item.label}</button>)}
      </div>

      <div className="handoff-step"><span>2</span><div><strong>复制完整资料</strong><small>已经自动包含八字、紫微、时间口径和必要计算依据。</small></div></div>
      <Button className="copy-prompt-button copy-prompt-button-v3" title="复制并交给你喜欢的 AI" onClick={copyCurrent} variant="primary">
        {copied ? <Check size={20} /> : <Sparkles size={20} />}{copied ? "已复制，可以去 AI 了" : `复制${modeLabel}资料给 AI`}
      </Button>

      <div className={`ai-launcher ${copied ? "is-ready" : ""}`}>
        <div><strong>{copied ? "✓ 已复制，选择一个 AI 继续" : "复制后可快捷打开"}</strong><small>本站不会自动把出生资料发送给这些平台。</small></div>
        <div className="ai-destination-grid">
          {aiDestinations.map((item) => <a href={item.href} key={item.name} target="_blank" rel="noreferrer">{item.name}<ArrowUpRight size={13} /></a>)}
        </div>
      </div>
      <p className="status-line status-line-v3">{status}</p>

      <details className="advanced-export">
        <summary>高级导出 <small>格式、预览、下载与特殊分析方向</small></summary>
        <div className="advanced-export-inner">
          <div className="advanced-mode-row"><span>特殊方向</span><button className={mode === "xp" ? "active" : ""} onClick={() => setMode("xp")} type="button">XP / 私密偏好</button></div>
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
