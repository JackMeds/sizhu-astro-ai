import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { createAstroProfile, type AstroProfile } from "@sizhu/core";
import { PencilLine } from "lucide-react";
import { BaziPlate } from "./components/BaziPlate";
import { ExportPanel } from "./components/ExportPanel";
import { HistoryRail } from "./components/HistoryRail";
import { InputPanel, type FormState } from "./components/InputPanel";
import { ThemeToggle } from "./components/ThemeToggle";
import { ZiweiPlate } from "./components/ZiweiPlate";
import { loadHistory, saveHistory, toHistoryItem, type HistoryItem } from "./lib/history";
import { localDateTimeToOffset } from "./lib/utils";
import { registerWebMcpTools } from "./lib/webmcp";

const DRAFT_KEY = "sizhu-ai-form-draft-v1";

const defaultForm: FormState = {
  name: "",
  gender: "female",
  birthDateTime: "",
  calendar: "solar",
  timezone: "Asia/Shanghai",
  locationName: "",
  longitude: "",
  trueSolarTime: "none",
  sect: 1
};

const agentGuideHref = `${import.meta.env.BASE_URL}agents.md`;

const qaItems = [
  {
    question: "乾造和坤造是什么意思？",
    answer: "乾造通常指男命，坤造通常指女命。为了让新手更容易理解，四柱星盘 AI 在界面里优先使用“男命 / 女命”，并在结构化资料里保留传统术语的语境。"
  },
  {
    question: "标准时和真太阳时有什么区别？",
    answer: "标准时是日常钟表时间。真太阳时会按出生地经度修正太阳到达当地中天的时间，适合对时辰边界特别敏感的排盘场景。选择标准时时不需要填写经度，选择真太阳时时建议填写具体县市区或经度。"
  },
  {
    question: "AI 提示词怎么用？",
    answer: "生成命盘后，选择综合、姻缘、事业、财运、身心、流年或 XP 模式，再复制 Markdown 或纯文本提示词，粘贴到 ChatGPT、Claude、DeepSeek、豆包、通义或 Kimi 中继续分析。"
  },
  {
    question: "出生信息和历史记录会上传吗？",
    answer: "不会。当前网页的排盘、提示词生成和历史记录都在浏览器本地完成；历史记录保存在当前浏览器的 localStorage 中，换设备或清理浏览器数据后不会自动同步。"
  },
  {
    question: "MCP 和 WebMCP 是一回事吗？",
    answer: "不是。传统 MCP Server 需要本地或远程进程供 AI 客户端连接；WebMCP 是网页在支持 modelContext 的浏览器或扩展环境里注册工具。四柱星盘 AI 会同时保留本地 MCP Server，并为静态网页提供实验性的 WebMCP 工具。"
  }
];

function buildProfile(form: FormState): AstroProfile {
  return createAstroProfile({
    ...form,
    name: form.name.trim() || "未命名",
    birthDateTime: localDateTimeToOffset(form.birthDateTime, form.timezone),
    location:
      form.trueSolarTime === "longitude"
        ? {
            name: form.locationName || undefined,
            longitude: form.longitude ? Number(form.longitude) : undefined
          }
        : undefined
  });
}

function loadDraft(): FormState {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return defaultForm;
    return { ...defaultForm, ...JSON.parse(raw) };
  } catch {
    return defaultForm;
  }
}

function formFromProfile(profile: AstroProfile): FormState {
  const localDateTime = profile.input.birthDateTime.slice(0, 16);
  return {
    ...defaultForm,
    name: profile.input.name,
    gender: profile.input.gender,
    birthDateTime: localDateTime,
    calendar: profile.input.calendar,
    timezone: profile.input.timezone,
    locationName: profile.input.location?.name ?? "",
    longitude: profile.input.location?.longitude?.toString() ?? "",
    trueSolarTime: profile.input.trueSolarTime,
    sect: profile.input.sect
  };
}

export function App() {
  const [form, setForm] = useState<FormState>(() => loadDraft());
  const [profile, setProfile] = useState<AstroProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [formError, setFormError] = useState("");
  const [inputExpanded, setInputExpanded] = useState(true);
  const profileRef = useRef<AstroProfile | null>(null);

  const signature = useMemo(
    () => profile?.bazi.pillars.map((pillar) => `${pillar.label}${pillar.ganZhi}`).join(" · ") ?? "填写出生信息后生成命盘；记录只保存在本机浏览器。",
    [profile]
  );

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    registerWebMcpTools(() => profileRef.current);
  }, []);

  function generate() {
    if (!form.birthDateTime || !form.birthDateTime.includes(":")) {
      setFormError("请先选择出生日期和时间。");
      return;
    }
    const nextProfile = buildProfile(form);
    setFormError("");
    setProfile(nextProfile);
    setInputExpanded(false);
    const historyItem = toHistoryItem(nextProfile);
    const nextHistory = [historyItem, ...history.filter((item) => item.id !== historyItem.id)].slice(0, 12);
    setHistory(nextHistory);
    saveHistory(nextHistory);
  }

  function selectHistory(item: HistoryItem) {
    setForm(formFromProfile(item.profile));
    setProfile(item.profile);
    setInputExpanded(false);
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  return (
    <main className="app-shell">
      <div className="texture" />
      <header className="topbar">
        <div>
          <strong>四柱星盘 AI 工作台</strong>
          <span>Static Bazi · Zi Wei · AI Profile</span>
        </div>
        <nav>
          <ThemeToggle />
          <a href="#chart">命盘</a>
          <a href="#export">导出</a>
          <a href="#mcp">AI/Agent</a>
        </nav>
      </header>

      <section className="hero-workbench">
        <motion.div className="intro-copy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1>把传统排盘转成 AI 能稳定读取的结构化资料。</h1>
          <p>{signature}</p>
        </motion.div>

        {!profile ? (
          <motion.section animate={{ opacity: 1, y: 0 }} className="empty-guide" initial={{ opacity: 0, y: 10 }} transition={{ duration: 0.28, ease: "easeOut" }}>
            <span>使用方法</span>
            <p>填写出生信息，确认标准时或真太阳时，然后生成命盘；记录只保存在本机浏览器。</p>
          </motion.section>
        ) : null}

        <div className={profile ? "workbench-grid" : "workbench-grid empty-workbench"}>
          <aside className="side-stack">
            {profile && !inputExpanded ? (
              <motion.section animate={{ opacity: 1, y: 0 }} className="panel input-summary-panel" initial={{ opacity: 0, y: 10 }} transition={{ duration: 0.22, ease: "easeOut" }}>
                <div>
                  <p className="eyeline">Birth Data</p>
                  <h2>出生信息已生成</h2>
                </div>
                <p>{profile.input.name} · {profile.input.gender === "male" ? "男命" : "女命"}</p>
                <strong>{profile.bazi.solarText}</strong>
                <button onClick={() => setInputExpanded(true)} type="button">
                  <PencilLine size={15} />
                  修改或重新输入
                </button>
              </motion.section>
            ) : (
              <InputPanel error={formError} form={form} onChange={setForm} onSubmit={generate} />
            )}
            {profile ? (
              <motion.div animate={{ opacity: 1, y: 0 }} id="export" initial={{ opacity: 0, y: 12 }} transition={{ duration: 0.28, ease: "easeOut" }}>
                <ExportPanel profile={profile} />
              </motion.div>
            ) : null}
          </aside>
          {profile ? (
            <motion.div animate={{ opacity: 1, y: 0 }} className="center-stack" id="chart" initial={{ opacity: 0, y: 18 }} transition={{ duration: 0.34, ease: "easeOut" }}>
              <BaziPlate profile={profile} />
              <ZiweiPlate profile={profile} />
            </motion.div>
          ) : null}
        </div>
      </section>

      <section className="qa-panel" aria-labelledby="qa-title">
        <div className="qa-heading">
          <p className="eyeline">Q&A</p>
          <h2 id="qa-title">常见问题</h2>
          <span>先把输入、时间口径、隐私和 AI 使用方式讲清楚，减少新手误操作。</span>
        </div>
        <div className="qa-grid">
          {qaItems.map((item) => (
            <article className="qa-item" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <HistoryRail items={history} onClear={clearHistory} onSelect={selectHistory} />

      <footer id="mcp" className="footer-strip">
        <div className="footer-copy">
          <strong>四柱星盘 AI 计划作为全新开源项目发布，排盘与提示词生成均在浏览器本地完成。</strong>
          <span>开源仓库：<a href="https://github.com/JackMeds/sizhu-astro-ai" target="_blank" rel="noreferrer">sizhu-astro-ai</a></span>
          <span>AI/Agent 接入说明：<a href={agentGuideHref} target="_blank" rel="noreferrer">agents.md</a></span>
        </div>
        <div className="footer-links" aria-label="项目使用的开源框架">
          <span>使用框架与优秀开源项目：</span>
          <a href="https://react.dev/" target="_blank" rel="noreferrer">React</a>
          <a href="https://vite.dev/" target="_blank" rel="noreferrer">Vite</a>
          <a href="https://tailwindcss.com/" target="_blank" rel="noreferrer">Tailwind CSS</a>
          <a href="https://motion.dev/" target="_blank" rel="noreferrer">Motion</a>
          <a href="https://lucide.dev/" target="_blank" rel="noreferrer">Lucide</a>
          <a href="https://github.com/6tail/lunar-javascript" target="_blank" rel="noreferrer">lunar-javascript</a>
          <a href="https://iztro.com/" target="_blank" rel="noreferrer">iztro</a>
          <a href="https://github.com/SylarLong/react-iztro" target="_blank" rel="noreferrer">react-iztro</a>
        </div>
      </footer>
    </main>
  );
}
