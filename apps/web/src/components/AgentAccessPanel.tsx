import { useMemo, useState } from "react";
import { CheckCircle2, Clipboard, Code2, ExternalLink, MonitorSmartphone, TerminalSquare, Wrench } from "lucide-react";
import { copyText } from "@/lib/utils";
import { showFeedback } from "@/lib/feedback";

const siteUrl = "https://jackmeds.github.io/sizhu-astro-ai/";
const repoUrl = "https://github.com/JackMeds/sizhu-astro-ai";

const unixInstall = `DIR="$HOME/.local/share/sizhu-astro-ai"; if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone https://github.com/JackMeds/sizhu-astro-ai.git "$DIR"; fi; npm --prefix "$DIR" install && npm --prefix "$DIR" run build:mcp`;
const unixCodex = `codex mcp add sizhu -- npm --prefix "$HOME/.local/share/sizhu-astro-ai" run start:mcp`;
const windowsInstall = `$dir="$env:LOCALAPPDATA\\sizhu-astro-ai"; if (Test-Path "$dir\\.git") { git -C $dir pull --ff-only } else { git clone https://github.com/JackMeds/sizhu-astro-ai.git $dir }; npm --prefix $dir install; npm --prefix $dir run build:mcp`;
const windowsCodex = `codex mcp add sizhu -- npm --prefix "$env:LOCALAPPDATA\\sizhu-astro-ai" run start:mcp`;

const genericJson = `{
  "mcpServers": {
    "sizhu": {
      "command": "npm",
      "args": [
        "--prefix",
        "/ABSOLUTE/PATH/TO/sizhu-astro-ai",
        "run",
        "start:mcp"
      ]
    }
  }
}`;

const webMcpTools = [
  "sizhu.about",
  "sizhu.create_profile",
  "sizhu.create_ai_prompt",
  "sizhu.get_transit_snapshot",
  "sizhu.create_liuren_chart",
  "sizhu.get_current_chart"
];

export function AgentAccessPanel() {
  const [os, setOs] = useState<"unix" | "windows">("windows");
  const [tab, setTab] = useState<"webmcp" | "codex" | "generic">("webmcp");
  const webMcpAvailable = useMemo(() => {
    if (typeof document === "undefined" || typeof navigator === "undefined") return false;
    const doc = document as unknown as { modelContext?: unknown };
    const nav = navigator as unknown as { modelContext?: unknown };
    return Boolean(doc.modelContext ?? nav.modelContext);
  }, []);

  async function copy(value: string, label: string) {
    try {
      await copyText(value);
      showFeedback("success", "已复制", `${label}已复制到剪贴板。`);
    } catch (error) {
      showFeedback("error", "复制失败", error instanceof Error ? error.message : "请手动复制代码块内容。");
    }
  }

  const installCommand = os === "windows" ? windowsInstall : unixInstall;
  const codexCommand = os === "windows" ? windowsCodex : unixCodex;

  return (
    <section className="agent-access panel" id="agent-access" aria-labelledby="agent-access-title">
      <div className="agent-access-heading">
        <div>
          <p className="eyeline"><Wrench size={14} /> Agent / MCP Access</p>
          <h2 id="agent-access-title">让 AI 直接调用排盘工具</h2>
          <p>除了网页里“复制给 AI”，也可以让支持工具调用的 Agent 直接使用八字、紫微、大运流年和完整大六壬计算。WebMCP 走当前网页；本地 MCP 走标准 stdio server。</p>
        </div>
        <a className="agent-guide-link" href={`${import.meta.env.BASE_URL}guide/agent.html`}>完整接入指南 <ExternalLink size={15} /></a>
      </div>

      <div className="agent-access-tabs" role="tablist" aria-label="Agent 接入方式">
        <button className={tab === "webmcp" ? "active" : ""} onClick={() => setTab("webmcp")} type="button"><MonitorSmartphone size={16} />网页 WebMCP</button>
        <button className={tab === "codex" ? "active" : ""} onClick={() => setTab("codex")} type="button"><TerminalSquare size={16} />Codex 一键接入</button>
        <button className={tab === "generic" ? "active" : ""} onClick={() => setTab("generic")} type="button"><Code2 size={16} />通用 MCP</button>
      </div>

      {tab === "webmcp" ? (
        <div className="agent-access-content">
          <div className={`webmcp-status ${webMcpAvailable ? "ok" : "warn"}`}>
            <CheckCircle2 size={18} />
            <div><strong>{webMcpAvailable ? "当前浏览器检测到 WebMCP" : "当前浏览器未检测到原生 WebMCP"}</strong><span>{webMcpAvailable ? "打开本站后，页面会自动注册 sizhu.* 工具；不需要额外安装本站。" : "网站仍可正常使用；WebMCP 属于实验性网页能力，可改用下面的本地 MCP。"}</span></div>
          </div>
          <div className="agent-quick-grid">
            <article><small>1 · 打开网页</small><strong>直接使用当前站点</strong><p>支持 WebMCP 的浏览器或 Agent 打开网站后，会发现页面注册的工具。</p><button onClick={() => copy(siteUrl, "网站地址")} type="button"><Clipboard size={14} />复制网站地址</button></article>
            <article><small>2 · 可调用工具</small><strong>{webMcpTools.length} 个主要入口</strong><p className="tool-cloud">{webMcpTools.map((tool) => <code key={tool}>{tool}</code>)}</p><button onClick={() => copy(webMcpTools.join("\n"), "WebMCP 工具列表")} type="button"><Clipboard size={14} />复制工具列表</button></article>
          </div>
          <p className="agent-note">WebMCP 是网页内工具注册，不等于远程 MCP URL；本站目前没有公开的 Remote MCP HTTP endpoint。</p>
        </div>
      ) : null}

      {tab === "codex" ? (
        <div className="agent-access-content">
          <div className="os-switch" aria-label="选择操作系统">
            <button className={os === "windows" ? "active" : ""} onClick={() => setOs("windows")} type="button">Windows PowerShell</button>
            <button className={os === "unix" ? "active" : ""} onClick={() => setOs("unix")} type="button">macOS / Linux</button>
          </div>
          <div className="command-card"><div><small>第一步 · 安装 / 更新并构建本地 MCP</small><button onClick={() => copy(installCommand, "安装命令")} type="button"><Clipboard size={14} />复制</button></div><pre>{installCommand}</pre></div>
          <div className="command-card"><div><small>第二步 · 注册到 Codex</small><button onClick={() => copy(codexCommand, "Codex MCP 命令")} type="button"><Clipboard size={14} />复制</button></div><pre>{codexCommand}</pre></div>
          <p className="agent-note">注册后可在 Codex 中用 <code>/mcp</code> 查看工具。服务器通过 stdio 启动，不需要额外端口。</p>
        </div>
      ) : null}

      {tab === "generic" ? (
        <div className="agent-access-content">
          <div className="command-card"><div><small>先安装项目</small><button onClick={() => copy(installCommand, "安装命令")} type="button"><Clipboard size={14} />复制</button></div><pre>{installCommand}</pre></div>
          <div className="command-card"><div><small>通用 stdio MCP 配置示例</small><button onClick={() => copy(genericJson, "MCP JSON 配置")} type="button"><Clipboard size={14} />复制</button></div><pre>{genericJson}</pre></div>
          <p className="agent-note">把 <code>/ABSOLUTE/PATH/TO/sizhu-astro-ai</code> 替换成实际安装目录。Claude Desktop、Cursor 等使用 <code>mcpServers</code> 风格配置的客户端可以据此接入；其他客户端按其 stdio MCP 配置格式填写相同 command/args。</p>
        </div>
      ) : null}

      <div className="agent-access-footer"><span>想让 Agent 先读规则？</span><a href={`${import.meta.env.BASE_URL}agents.md`}>打开 agents.md</a><a href={repoUrl} target="_blank" rel="noreferrer">查看源码</a></div>
    </section>
  );
}
