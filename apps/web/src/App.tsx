import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { createAstroProfile, type AstroProfile } from "@sizhu/core";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Braces,
  Cpu,
  Github,
  Home,
  LockKeyhole,
  MessageCircleQuestion,
  Orbit,
  PencilLine,
  Play,
  Sparkles,
  UserRound
} from "lucide-react";
import { AgentAccessPanel } from "./components/AgentAccessPanel";
import { ExportPanel } from "./components/ExportPanel";
import { HistoryRail } from "./components/HistoryRail";
import { InputPanel, type FormState } from "./components/InputPanel";
import { LiurenBetaPanel } from "./components/LiurenBetaPanel";
import { ProfileResults } from "./components/ProfileResults";
import { SponsorPlaceholder } from "./components/SponsorPlaceholder";
import { ThemeToggle } from "./components/ThemeToggle";
import { loadHistory, saveHistory, toHistoryItem, type HistoryItem } from "./lib/history";
import { localDateTimeToOffset } from "./lib/utils";
import { registerWebMcpTools } from "./lib/webmcp";

const DRAFT_KEY = "sizhu-ai-form-draft-v1";
const defaultForm: FormState = {
  name: "", gender: "male", birthDateTime: "", calendar: "solar", timezone: "Asia/Shanghai",
  locationName: "", longitude: "", trueSolarTime: "none", sect: 1
};
const exampleForm: FormState = {
  ...defaultForm,
  name: "示例命盘",
  gender: "female",
  birthDateTime: "1996-06-18T10:30"
};
const agentGuideHref = `${import.meta.env.BASE_URL}agents.md`;
const guideBase = `${import.meta.env.BASE_URL}guide/`;

const qaItems = [
  { question: "这个网站会直接给我算命结论吗？", answer: "不会。本站负责用固定代码排盘、校验时间口径、整理八字、紫微与大六壬结构化资料；生成后把结果复制给你喜欢的 AI，例如 ChatGPT、Claude、DeepSeek、Kimi 等，再由你选择的 AI 进行分析。" },
  { question: "我完全不懂八字或紫微，也能用吗？", answer: "可以。普通流程只需要填写出生资料或一个具体占问。专业术语会保留给想深入的人，但不会要求你先学会排盘才能复制给 AI。" },
  { question: "这次排盘为什么比普通 AI 对话稳定？", answer: "四柱、大运、流年、流月、紫微十二宫与六壬课盘由固定代码引擎计算。AI 只负责解释结构化结果，不再凭上下文临时手算。" },
  { question: "标准时、地方平太阳时、真太阳时有什么区别？", answer: "标准时使用钟表时间；地方平太阳时按出生地经度与时区标准经线的差修正；真太阳时在此基础上再加入均时差。不确定时保持默认标准时即可。" },
  { question: "大六壬的起课方式和九宗门是一回事吗？", answer: "不是。正时、报数、指定占时属于“如何得到最终占时”的入口；九宗门属于四课生成后决定初传与三传的取传规则。本站把这两层分开计算。" },
  { question: "出生信息会上传吗？", answer: "当前网页排盘、起课、提示词生成和历史记录都在浏览器本地完成；历史保存在 localStorage。只有当你主动把导出内容交给其他 AI 时，才进入对应产品的数据处理范围。" }
];

const guideItems = [
  { href: "bazi.html", kicker: "BaZi", title: "八字排盘怎么看", text: "四柱、十神、藏干与计算事实应该怎样和 AI 解读分开。" },
  { href: "ziwei.html", kicker: "Zi Wei", title: "紫微斗数排盘怎么看", text: "十二宫、主星、四化与运限如何整理成 AI 能稳定读取的数据。" },
  { href: "liuren.html", kicker: "Da Liu Ren", title: "大六壬怎么起课", text: "正时、报数、指定占时、九宗门、三传与多引擎校验。" },
  { href: "solar-time.html", kicker: "Time", title: "真太阳时到底怎么算", text: "区分标准时、地方平太阳时、经度修正与均时差。" },
  { href: "dayun.html", kicker: "Luck Cycle", title: "大运流年怎么一起看", text: "本命、大运、流年、流月为什么必须放在同一个时间层级里。" },
  { href: "agent.html", kicker: "Agent / MCP", title: "让 AI 直接调用排盘", text: "WebMCP、本地 stdio MCP、Codex 快速安装与工具清单。" }
];

function buildProfile(form: FormState): AstroProfile {
  return createAstroProfile({
    ...form,
    name: form.name.trim() || "未命名",
    birthDateTime: localDateTimeToOffset(form.birthDateTime, form.timezone),
    location: form.trueSolarTime !== "none" ? { name: form.locationName || undefined, longitude: form.longitude ? Number(form.longitude) : undefined } : undefined
  });
}
function loadDraft(): FormState {
  try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? { ...defaultForm, ...JSON.parse(raw) } : defaultForm; } catch { return defaultForm; }
}
function formFromProfile(profile: AstroProfile): FormState {
  return { ...defaultForm, name: profile.input.name, gender: profile.input.gender, birthDateTime: profile.time.standard.isoLocal.slice(0, 16), calendar: profile.input.calendar,
    timezone: profile.input.timezone, locationName: profile.input.location?.name ?? "", longitude: profile.input.location?.longitude?.toString() ?? "",
    trueSolarTime: profile.input.trueSolarTime, sect: profile.input.sect };
}

export function App() {
  const [form, setForm] = useState<FormState>(() => loadDraft());
  const [profile, setProfile] = useState<AstroProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [formError, setFormError] = useState("");
  const [inputExpanded, setInputExpanded] = useState(true);
  const profileRef = useRef<AstroProfile | null>(null);
  const signature = useMemo(() => profile?.bazi.pillars.map((pillar) => pillar.ganZhi).join(" · ") ?? "八字 · 紫微 · 六壬 · AI-ready JSON", [profile]);

  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); }, [form]);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { registerWebMcpTools(() => profileRef.current); }, []);

  function commitProfile(nextForm: FormState) {
    const nextProfile = buildProfile(nextForm);
    setFormError("");
    setProfile(nextProfile);
    setInputExpanded(false);
    setHistory((current) => {
      const historyItem = toHistoryItem(nextProfile);
      const nextHistory = [historyItem, ...current.filter((item) => item.id !== historyItem.id)].slice(0, 12);
      saveHistory(nextHistory);
      return nextHistory;
    });
    window.setTimeout(() => document.getElementById("export")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }

  function generate() {
    if (!form.birthDateTime || !form.birthDateTime.includes(":")) { setFormError("请先选择出生日期和时间。"); return; }
    if (form.trueSolarTime !== "none" && !form.longitude) { setFormError("选择太阳时校正时，请填写出生地经度。"); return; }
    try { commitProfile(form); } catch (error) { setFormError(error instanceof Error ? error.message : "排盘失败，请检查输入。"); }
  }
  function tryExample() {
    try { setForm(exampleForm); commitProfile(exampleForm); } catch (error) { setFormError(error instanceof Error ? error.message : "示例命盘生成失败。"); }
  }
  function selectHistory(item: HistoryItem) { setForm(formFromProfile(item.profile)); setProfile(item.profile); setInputExpanded(false); window.setTimeout(() => document.getElementById("export")?.scrollIntoView({ behavior: "smooth" }), 80); }
  function clearHistory() { setHistory([]); saveHistory([]); }

  return (
    <main className="app-shell workbench-v2 product-v3">
      <div className="texture" />
      <header className="topbar">
        <a className="brand-lockup" href="#top" aria-label="四柱星盘 AI 首页">
          <span className="brand-seal">命</span><span><strong>四柱星盘 AI</strong><small>Deterministic Metaphysics Workbench</small></span>
        </a>
        <nav>
          <a href="#birth">出生命盘</a><a href="#liuren">六壬问事</a><a href="#guides">使用指南</a><a href="#agent-access">Agent 接入</a>
          {profile ? <a className="nav-ai-link" href="#export">交给 AI</a> : null}
          <a aria-label="GitHub" className="nav-icon-link" href="https://github.com/JackMeds/sizhu-astro-ai" target="_blank" rel="noreferrer"><Github size={17} /></a>
          <ThemeToggle />
        </nav>
      </header>

      <section className="hero-workbench hero-v3" id="top">
        <motion.div className="intro-copy intro-copy-v2" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .48, ease: [0.22, 1, 0.36, 1] }}>
          <div>
            <p className="hero-kicker"><Sparkles size={14} /> 不懂复杂排盘，也可以直接用</p>
            <h1>先把盘算准，<br /><em>再交给你喜欢的 AI。</em></h1>
            <p className="hero-description">你不需要先学会八字、紫微斗数或大六壬。选择你现在想做的事，本站负责用固定代码完成计算和资料整理；<strong>我们不在站内做命理解读</strong>，生成后再复制给 ChatGPT、Claude、DeepSeek、Kimi 等你喜欢的 AI。</p>
            <div className="hero-badges"><span><Cpu size={14} />代码排盘</span><span><Braces size={14} />一键交给 AI</span><span><LockKeyhole size={14} />本地优先</span></div>
          </div>
          <aside className="hero-signature"><small>最简单的使用方式</small><strong>{profile ? signature : "选择任务 → 生成 → 复制给 AI"}</strong><span>{profile ? `${profile.input.name} · ${profile.time.effective.label}` : "专业计算留给程序，解释交给你选择的 AI"}</span></aside>
        </motion.div>

        <div className="task-entry-grid" aria-label="选择你想做的事">
          <motion.a className="task-entry-card task-birth" href="#birth" whileHover={{ y: -5 }} whileTap={{ scale: .99 }} transition={{ type: "spring", stiffness: 360, damping: 24 }}>
            <span className="task-icon"><UserRound size={24} /></span>
            <div><p className="eyeline">八字 + 紫微斗数</p><h2>看我的出生命盘</h2><p>适合了解长期结构、感情、事业、财运，以及大运流年的变化。</p></div>
            <strong>开始排命盘 <ArrowRight size={17} /></strong>
          </motion.a>
          <motion.a className="task-entry-card task-liuren" href="#liuren" whileHover={{ y: -5 }} whileTap={{ scale: .99 }} transition={{ type: "spring", stiffness: 360, damping: 24 }}>
            <span className="task-icon"><MessageCircleQuestion size={24} /></span>
            <div><p className="eyeline">大六壬</p><h2>我有一件具体的事想问</h2><p>适合针对眼前的一件事起课，例如关系进展、合作、计划或某个具体选择。</p></div>
            <strong>开始问事 <ArrowRight size={17} /></strong>
          </motion.a>
        </div>
        {!profile ? <motion.button className="example-entry" type="button" onClick={tryExample} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .22 }}><Play size={15} />不想先填资料？用一张虚构示例命盘体验整个流程</motion.button> : null}

        <div className={profile ? "workbench-grid workbench-generated" : "workbench-grid empty-workbench"} id="birth">
          <aside className="side-stack">
            {profile && !inputExpanded ? (
              <motion.section animate={{ opacity: 1, y: 0 }} className="panel input-summary-panel profile-summary-v2" initial={{ opacity: 0, y: 8 }}>
                <div><p className="eyeline">当前命盘</p><h2>{profile.input.name}</h2></div>
                <p>{profile.input.gender === "male" ? "男命 / 乾造" : "女命 / 坤造"}</p>
                <strong>{profile.time.standard.date} · {profile.time.standard.time.slice(0, 5)}</strong>
                <small>{profile.time.effective.label} → {profile.time.effective.shichen}时</small>
                <button onClick={() => setInputExpanded(true)} type="button"><PencilLine size={15} />修改出生信息</button>
              </motion.section>
            ) : <InputPanel error={formError} form={form} onChange={setForm} onSubmit={generate} />}
          </aside>

          {profile ? (
            <div className="center-stack center-stack-v3">
              <motion.div animate={{ opacity: 1, y: 0 }} id="export" initial={{ opacity: 0, y: 12 }} transition={{ duration: .4 }}><ExportPanel profile={profile} /></motion.div>
              <ProfileResults profile={profile} />
            </div>
          ) : (
            <motion.section className="empty-stage empty-stage-v3" initial={{ opacity: 0, scale: .985 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .08 }}>
              <div className="empty-orbit"><i /><i /><i /><span>四柱</span></div>
              <div><p className="eyeline">只需三步</p><h2>填资料、生成、复制。</h2><div className="three-step-list"><span><b>1</b>填写出生日期、时间和性别</span><span><b>2</b>程序自动生成八字与紫微</span><span><b>3</b>一键复制给你喜欢的 AI 解读</span></div><p>如果你不知道真太阳时、Sect 或其他专业概念，全部保持默认即可；这些选项不会挡住第一次体验。</p></div>
            </motion.section>
          )}
        </div>
      </section>

      <motion.div id="liuren" className="section-reveal" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .45 }}><LiurenBetaPanel /></motion.div>

      <motion.section className="guide-hub" id="guides" aria-labelledby="guide-title" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .4 }}>
        <div className="guide-heading">
          <div><p className="eyeline">想深入时再看</p><h2 id="guide-title">专业内容一直都在，但不挡住第一次使用。</h2></div>
          <p>排盘、复制给 AI 完全不要求先读指南；如果你想知道为什么这样排，再从下面进入对应知识页。</p>
        </div>
        <div className="guide-grid">
          {guideItems.map((item) => (
            <a href={`${guideBase}${item.href}`} key={item.href}>
              <span>{item.kicker}</span><h3>{item.title}</h3><p>{item.text}</p><i>阅读全文 <ArrowUpRight size={15} /></i>
            </a>
          ))}
        </div>
      </motion.section>

      <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .4 }}><AgentAccessPanel /></motion.div>

      <motion.div id="support" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }}><SponsorPlaceholder /></motion.div>

      <section className="qa-panel qa-panel-v2" aria-labelledby="qa-title">
        <div className="qa-heading"><p className="eyeline">常见问题</p><h2 id="qa-title">不用先成为专业用户。</h2><span>复杂口径和审计信息都保留，但普通使用路径只围绕“生成 → 复制给 AI”。</span></div>
        <div className="qa-grid">{qaItems.map((item) => <article className="qa-item" key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></article>)}</div>
      </section>

      <HistoryRail items={history} onClear={clearHistory} onSelect={selectHistory} />
      <footer id="mcp" className="footer-strip">
        <div className="footer-copy"><strong>四柱星盘 AI · local-first deterministic chart engine</strong><span>开源仓库：<a href="https://github.com/JackMeds/sizhu-astro-ai" target="_blank" rel="noreferrer">JackMeds/sizhu-astro-ai</a></span><span>Agent 接入：<a href="#agent-access">快速配置</a> · <a href={agentGuideHref} target="_blank" rel="noreferrer">agents.md</a></span><span>搜索索引：<a href={`${import.meta.env.BASE_URL}sitemap.xml`}>sitemap.xml</a></span></div>
        <div className="footer-links"><span>Core:</span><a href="https://github.com/6tail/lunar-javascript" target="_blank" rel="noreferrer">lunar-javascript</a><a href="https://iztro.com/" target="_blank" rel="noreferrer">iztro</a><a href="https://github.com/waterbeside/lunisolar" target="_blank" rel="noreferrer">lunisolar</a></div>
      </footer>

      <nav className="mobile-task-nav" aria-label="快捷导航">
        <a href="#top"><Home size={17} /><span>首页</span></a>
        <a href="#birth"><UserRound size={17} /><span>命盘</span></a>
        <a href="#liuren"><Orbit size={17} /><span>六壬</span></a>
        <a href={profile ? "#export" : "#birth"}><Sparkles size={17} /><span>AI</span></a>
        <a href="#guides"><BookOpen size={17} /><span>指南</span></a>
      </nav>
    </main>
  );
}
