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
  const [status, setStatus] = useState("Ready");
  const content = useMemo(() => buildPrompt(profile, mode, format), [format, mode, profile]);
  const modeLabel = promptModes.find((item) => item.key === mode)?.label ?? "综合";

  async function copyCurrent() {
    try {
      await copyText(content);
      setStatus(`${modeLabel} ${format === "markdown" ? "Markdown" : "纯文本"} 已复制，可直接粘贴到 ChatGPT、Claude、豆包、通义或 Kimi 中进行分析`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "复制失败，请手动复制预览框内容");
    }
  }

  function downloadCurrent() {
    const ext = format === "markdown" ? "md" : "txt";
    downloadText(`ai-prompt-${profile.input.name}-${mode}.${ext}`, content, "text/plain;charset=utf-8");
    setStatus(`${modeLabel}提示词已下载`);
  }

  async function copyPromptImage() {
    const svg = renderPromptSvg(`${modeLabel}命盘分析提示词`, content);
    try {
      const copied = await copySvgAsPng(svg);
      if (copied) {
        setStatus(`${modeLabel}提示词图片已复制到剪贴板`);
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
          <p className="eyeline">AI Prompt</p>
          <h2>AI 提示词</h2>
        </div>
        <ServerCog className="text-[#49b39a]" size={22} />
      </div>

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
        <Button className="copy-prompt-button" title="复制当前提示词" onClick={copyCurrent} variant="primary">
          <Copy size={20} />
          复制提示词
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
        <strong>复制用途</strong>
        <span>把当前模式提示词发给 AI；图片按钮会优先复制 PNG，不支持时自动下载 SVG。</span>
      </div>
      <p className="status-line">{status}</p>
    </aside>
  );
}
