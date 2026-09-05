import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clipboard,
  ChevronDown,
  Code2,
  ExternalLink,
  MonitorSmartphone,
  SquareTerminal,
  Wrench
} from "lucide-react";
import { showFeedback } from "@/lib/feedback";
import { useI18n } from "@/lib/i18n";
import { copyText } from "@/lib/utils";

const siteUrl = "https://mingxu.jackmeds.top/";
const repoUrl = "https://github.com/JackMeds/mingxu";

const unixInstall = `DIR="$HOME/.local/share/mingxu"; if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone https://github.com/JackMeds/mingxu.git "$DIR"; fi; npm --prefix "$DIR" install && npm --prefix "$DIR" run build:mcp`;
const unixCodex = `codex mcp add mingxu -- npm --prefix "$HOME/.local/share/mingxu" run start:mcp`;
const windowsInstall = `$dir="$env:LOCALAPPDATA\\mingxu"; if (Test-Path "$dir\\.git") { git -C $dir pull --ff-only } else { git clone https://github.com/JackMeds/mingxu.git $dir }; npm --prefix $dir install; npm --prefix $dir run build:mcp`;
const windowsCodex = `codex mcp add mingxu -- npm --prefix "$env:LOCALAPPDATA\\mingxu" run start:mcp`;

const genericJson = `{
  "mcpServers": {
    "mingxu": {
      "command": "npm",
      "args": [
        "--prefix",
        "/ABSOLUTE/PATH/TO/mingxu",
        "run",
        "start:mcp"
      ]
    }
  }
}`;

const webMcpTools = [
  "mingxu.about",
  "mingxu.create_birth_chart",
  "mingxu.get_transit_snapshot",
  "mingxu.compare_transits",
  "mingxu.create_liuren_chart",
  "mingxu.export_profile",
  "mingxu.ui.get_workspace_state",
  "mingxu.ui.inspect_chart",
  "mingxu.ui.inspect_transit",
  "mingxu.ui.compare_transits"
];

interface AgentAccessPanelProps {
  compact?: boolean;
}

export function AgentAccessPanel({ compact = false }: AgentAccessPanelProps) {
  const { t } = useI18n();
  const [os, setOs] = useState<"unix" | "windows">("windows");
  const [tab, setTab] = useState<"webmcp" | "codex" | "generic">("webmcp");
  const [webMcpAvailable, setWebMcpAvailable] = useState(false);

  useEffect(() => {
    const checkAvailability = () => {
      if (typeof document === "undefined" || typeof navigator === "undefined") return false;
      const doc = document as unknown as { modelContext?: unknown };
      const nav = navigator as unknown as { modelContext?: unknown };
      return Boolean(doc.modelContext ?? nav.modelContext);
    };
    const update = () => setWebMcpAvailable(checkAvailability());
    update();
    const timer = window.setTimeout(update, 120);
    return () => window.clearTimeout(timer);
  }, []);

  async function copy(value: string, label: string) {
    try {
      await copyText(value);
      showFeedback("success", t("feedback.copied"), t("feedback.copiedDetail", { label }));
    } catch (error) {
      showFeedback(
        "error",
        t("feedback.copyFailed"),
        error instanceof Error ? error.message : t("feedback.copyManual")
      );
    }
  }

  const installCommand = os === "windows" ? windowsInstall : unixInstall;
  const codexCommand = os === "windows" ? windowsCodex : unixCodex;

  if (compact) {
    return (
      <section className="agent-access agent-access-compact panel" aria-label="WebMCP / Agent">
        <div className="compact-agent-heading">
          <div>
            <p className="eyeline">WebMCP / Agent</p>
            <h2>{t("agent.title")}</h2>
          </div>
          <span className={`compact-agent-dot ${webMcpAvailable ? "is-ready" : "is-pending"}`} aria-hidden="true" />
        </div>
        <div className="compact-agent-status">
          <strong>{webMcpAvailable ? t("agent.webmcp.detected") : t("agent.webmcp.notDetected")}</strong>
          <span>{t("agent.webmcp.toolCount", { count: webMcpTools.length })}</span>
        </div>
        <p className="compact-agent-copy">{webMcpAvailable ? t("agent.webmcp.detectedHelp") : t("agent.webmcp.notDetectedHelp")}</p>
        <details className="agent-compact-details">
          <summary>{t("agent.fullGuide")} <ChevronDown size={14} /></summary>
          <div className="compact-agent-details-inner">
            <p>{t("agent.webmcp.note")}</p>
            <div className="compact-tool-list">
              {webMcpTools.map((tool) => <code key={tool}>{tool}</code>)}
            </div>
            <button type="button" onClick={() => copy(webMcpTools.join("\n"), t("agent.copy.toolsLabel"))}>
              <Clipboard size={14} />{t("agent.copy.tools")}
            </button>
            <div className="compact-command">
              <span>{t("agent.codex.register")}</span>
              <button type="button" onClick={() => copy(codexCommand, t("agent.copy.codexLabel"))}>
                <Clipboard size={13} />{t("common.copy")}
              </button>
              <code>{codexCommand}</code>
            </div>
            <a href={`${import.meta.env.BASE_URL}guide/agent.html`}>{t("agent.fullGuide")} <ExternalLink size={13} /></a>
          </div>
        </details>
      </section>
    );
  }

  return (
    <section className="agent-access panel" id="agent-access" aria-labelledby="agent-access-title">
      <div className="agent-access-heading">
        <div>
          <p className="eyeline"><Wrench size={14} /> Agent / MCP Access</p>
          <h2 id="agent-access-title">{t("agent.title")}</h2>
          <p>{t("agent.description")}</p>
        </div>
        <a className="agent-guide-link" href={`${import.meta.env.BASE_URL}guide/agent.html`}>
          {t("agent.fullGuide")} <ExternalLink size={15} />
        </a>
      </div>

      <div className="agent-access-tabs" role="tablist" aria-label={t("agent.tabs.label")}>
        <button className={tab === "webmcp" ? "active" : ""} onClick={() => setTab("webmcp")} type="button">
          <MonitorSmartphone size={16} />{t("agent.tabs.webmcp")}
        </button>
        <button className={tab === "codex" ? "active" : ""} onClick={() => setTab("codex")} type="button">
          <SquareTerminal size={16} />{t("agent.tabs.codex")}
        </button>
        <button className={tab === "generic" ? "active" : ""} onClick={() => setTab("generic")} type="button">
          <Code2 size={16} />{t("agent.tabs.generic")}
        </button>
      </div>

      {tab === "webmcp" ? (
        <div className="agent-access-content">
          <div className={`webmcp-status ${webMcpAvailable ? "ok" : "warn"}`}>
            <CheckCircle2 size={18} />
            <div>
              <strong>{webMcpAvailable ? t("agent.webmcp.detected") : t("agent.webmcp.notDetected")}</strong>
              <span>{webMcpAvailable ? t("agent.webmcp.detectedHelp") : t("agent.webmcp.notDetectedHelp")}</span>
            </div>
          </div>
          <div className="agent-quick-grid">
            <article>
              <small>{t("agent.webmcp.step1")}</small>
              <strong>{t("agent.webmcp.openSite")}</strong>
              <p>{t("agent.webmcp.openSiteHelp")}</p>
              <button onClick={() => copy(siteUrl, t("agent.copy.siteLabel"))} type="button">
                <Clipboard size={14} />{t("agent.copy.site")}
              </button>
            </article>
            <article>
              <small>{t("agent.webmcp.step2")}</small>
              <strong>{t("agent.webmcp.toolCount", { count: webMcpTools.length })}</strong>
              <p className="tool-cloud">{webMcpTools.map((tool) => <code key={tool}>{tool}</code>)}</p>
              <button onClick={() => copy(webMcpTools.join("\n"), t("agent.copy.toolsLabel"))} type="button">
                <Clipboard size={14} />{t("agent.copy.tools")}
              </button>
            </article>
          </div>
          <p className="agent-note">{t("agent.webmcp.note")}</p>
        </div>
      ) : null}

      {tab === "codex" ? (
        <div className="agent-access-content">
          <div className="os-switch" aria-label={t("agent.os.label")}>
            <button className={os === "windows" ? "active" : ""} onClick={() => setOs("windows")} type="button">Windows PowerShell</button>
            <button className={os === "unix" ? "active" : ""} onClick={() => setOs("unix")} type="button">macOS / Linux</button>
          </div>
          <div className="command-card">
            <div><small>{t("agent.codex.install")}</small><button onClick={() => copy(installCommand, t("agent.copy.installLabel"))} type="button"><Clipboard size={14} />{t("common.copy")}</button></div>
            <pre>{installCommand}</pre>
          </div>
          <div className="command-card">
            <div><small>{t("agent.codex.register")}</small><button onClick={() => copy(codexCommand, t("agent.copy.codexLabel"))} type="button"><Clipboard size={14} />{t("common.copy")}</button></div>
            <pre>{codexCommand}</pre>
          </div>
          <p className="agent-note">{t("agent.codex.note")}</p>
        </div>
      ) : null}

      {tab === "generic" ? (
        <div className="agent-access-content">
          <div className="command-card">
            <div><small>{t("agent.generic.install")}</small><button onClick={() => copy(installCommand, t("agent.copy.installLabel"))} type="button"><Clipboard size={14} />{t("common.copy")}</button></div>
            <pre>{installCommand}</pre>
          </div>
          <div className="command-card">
            <div><small>{t("agent.generic.config")}</small><button onClick={() => copy(genericJson, t("agent.copy.configLabel"))} type="button"><Clipboard size={14} />{t("common.copy")}</button></div>
            <pre>{genericJson}</pre>
          </div>
          <p className="agent-note">{t("agent.generic.note")}</p>
        </div>
      ) : null}

      <div className="agent-access-footer">
        <span>{t("agent.footer.question")}</span>
        <a href={`${import.meta.env.BASE_URL}agents.md`}>{t("agent.footer.agents")}</a>
        <a href={repoUrl} target="_blank" rel="noreferrer">{t("agent.footer.source")}</a>
      </div>
    </section>
  );
}
