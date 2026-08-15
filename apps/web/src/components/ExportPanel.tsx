import { useMemo, useState } from "react";
import { Copy, Download, ImageDown, ServerCog } from "lucide-react";
import type { AstroProfile } from "@sizhu/core";
import { Button } from "./Button";
import { copySvgAsPng, copyText, downloadText } from "@/lib/utils";
import { buildPrompt, promptModes, renderPromptSvg, type PromptFormat, type PromptMode } from "@/lib/promptBuilder";

interface ExportPanelProps {
  profile: AstroProfile;
}

export function ExportPanel({ profile }: ExportPanelProps) {
  const [mode, setMode] = useState<PromptMode>("general");
  const [format, setFormat] = useState<PromptFormat>("markdown");
  const [status, setStatus] = useState("生成后复制给你喜欢的 AI 继续分析");
  const content = useMemo(() => buildPrompt(profile, mode, format), [format, mode, profile]);
  const modeLabel = promptModes.find((item) => item.key === mode)?.label ?? "综合";

  async function copyCurrent() {
    try {
      await copyText(content);
      setStatus(`${modeLabel} ${format === "markdown" ? "Markdown" : "纯文本"} 已复制。现在可以粘贴到你喜欢的 AI（如 ChatGPT、Claude、DeepSeek、Kimi 等）继续分析。`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "复制失败，请手动复制预览框内容");
    }
  }

  function downloadCurrent() {
    const ext = format === "markdown" ? "md" : "txt";
    downloadText(`ai-prompt-${profile.input.name}-${mode}.${ext}`, content, "text/plain;charset=utf-8");
    setStatus(`${modeLabel}提示词已下载，可发送给你喜欢的 AI 进行分析`);
  }

  async function copyPromptImage() {
    const svg = renderPromptSvg(`${modeLabel}命盘分析提示词`, content);
    try {
      const copied = await copySvgAsPng(svg);
      if (copied) {
        setStatus(`${modeLabel}提示词图片已复制，可以发送给你喜欢的 AI`);
        return;
      }
      downloadText(`ai-prompt-${profile.input.name}-${mode}.svg`, svg, "image/svg+xml;charset=utf-8");
      setStatus("当前浏览器不支持复制图片，已改为下载 SVG");
    } catch {
      downloadText(`ai-prompt-${profile.input.name}-${mode}.svg`, svg, "image/svg+xml;charset=utf-8");
      setStatus("图片复制失败，已改为下载 SVG");
    }
  }

  return (
    <aside className="panel export-panel">
      <div className="panel-heading">
        <div>
          <p className="eyeline">AI Handoff</p>
          <h2>交给你喜欢的 AI</h2>
        </div>
        <ServerCog className="text-[#49b39a]" size={22} />
      </div>

      <p className="export-intro">
        本站负责排盘、校验和整理结构化资料，<strong>不在站内提供命理解读</strong>。选择你想分析的方向后，复制结果到 ChatGPT、Claude、DeepSeek、Kimi 或其他你习惯使用的 AI 即可。
      </p>

      <div className="mode-switch">
        {promptModes.map((item) => (
          <button className={mode === item.key ? "active" : ""} key={item.key} onClick={() => setMode(item.key)} type="button">
            {item.label}
          </button>
        ))}
      </div>

      <div className="export-switch">
        {(["markdown", "txt"] as PromptFormat[]).map((item) => (
          <button className={format === item ? "active" : ""} key={item} onClick={() => setFormat(item)} type="button">
            {item === "markdown" ? "Markdown" : "纯文本"}
          </button>
        ))}
      </div>

      <pre className="export-preview">{content}</pre>

      <div className="export-actions">
        <Button className="copy-prompt-button" title="复制并交给你喜欢的 AI" onClick={copyCurrent} variant="primary">
          <Copy size={20} />
          复制给 AI
        </Button>
        <Button size="sm" title="下载当前提示词" onClick={downloadCurrent}>
          <Download size={17} />
          下载文本
        </Button>
        <Button size="sm" title="复制提示词图片" onClick={copyPromptImage}>
          <ImageDown size={17} />
          复制图片
        </Button>
      </div>

      <div className="mcp-hint">
        <strong>推荐流程</strong>
        <span>本站算盘与整理证据 → 复制提示词/JSON → 粘贴到你喜欢的 AI → 由 AI 做解释、比较流派或继续追问。</span>
      </div>
      <p className="status-line">{status}</p>
    </aside>
  );
}
