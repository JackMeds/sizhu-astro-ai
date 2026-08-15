import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { createAstroProfile, type AstroProfile } from "@sizhu/core";
import { ArrowUpRight, Braces, Cpu, LockKeyhole, PencilLine, Sparkles } from "lucide-react";
import { BaziFactsPanel } from "./components/BaziFactsPanel";
import { BaziPlate } from "./components/BaziPlate";
import { EngineAudit } from "./components/EngineAudit";
import { ExportPanel } from "./components/ExportPanel";
import { HistoryRail } from "./components/HistoryRail";
import { InputPanel, type FormState } from "./components/InputPanel";
import { ThemeToggle } from "./components/ThemeToggle";
import { TransitInspector } from "./components/TransitInspector";
import { ZiweiPlate } from "./components/ZiweiPlate";
import { ZiweiSummaryPanel } from "./components/ZiweiSummaryPanel";
import { loadHistory, saveHistory, toHistoryItem, type HistoryItem } from "./lib/history";
import { localDateTimeToOffset } from "./lib/utils";
import { registerWebMcpTools } from "./lib/webmcp";

const DRAFT_KEY = "sizhu-ai-form-draft-v1";
const defaultForm: FormState = {
  name: "", gender: "male", birthDateTime: "", calendar: "solar", timezone: "Asia/Shanghai",
  locationName: "", longitude: "", trueSolarTime: "none", sect: 1
};
const agentGuideHref = `${import.meta.env.BASE_URL}agents.md`;
const guideBase = `${import.meta.env.BASE_URL}guide/`;

const qaItems = [
  { question: "这次排盘为什么比普通 AI 对话稳定？", answer: "四柱、大运、流年、流月与紫微十二宫由固定代码引擎计算。AI 只负责解释结构化结果，不再凭上下文临时手算。" },
  { question: "标准时、地方平太阳时、真太阳时有什么区别？", answer: "标准时使用钟表时间；地方平太阳时按出生地经度与时区标准经线的差修正；真太阳时在此基础上再加入均时差。三套时间都会保存在导出资料中，正式命盘使用你选择的口径。" },
  { question: "关系事实和命理解读有什么区别？", answer: "冲、合、刑、害、破、伏吟等可以先由程序识别；是否合化、力量大小、吉凶和事件含义属于规则与解释层，不能在计算阶段偷换成结论。" },
  { question: "出生信息会上传吗？", answer: "当前网页排盘、提示词生成和历史记录都在浏览器本地完成；历史保存在 localStorage。只有当你主动把导出内容交给其他 AI 时，才进入对应产品的数据处理范围。" }
];

const guideItems = [
  { href: "bazi.html", kicker: "BaZi", title: "八字排盘怎么看", text: "四柱、十神、藏干与计算事实应该怎样和 AI 解读分开。" },
  { href: "ziwei.html", kicker: "Zi Wei", title: "紫微斗数排盘怎么看", text: "十二宫、主星、四化与运限如何整理成 AI 能稳定读取的数据。" },
  { href: "solar-time.html", kicker: "Time", title: "真太阳时到底怎么算", text: "区分标准时、地方平太阳时、经度修正与均时差。" },
  { href: "dayun.html", kicker: "Luck Cycle", title: "大运流年怎么一起看", text: "本命、大运、流年、流月为什么必须放在同一个时间层级里。" }
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
  const signature = useMemo(() => profile?.bazi.pillars.map((pillar) => pillar.ganZhi).join(" · ") ?? "八字 · 紫微 · 运限 · AI-ready JSON", [profile]);

  useEffect(() => { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); }, [form]);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { registerWebMcpTools(() => profileRef.current); }, []);

  function generate() {
    if (!form.birthDateTime || !form.birthDateTime.includes(":")) { setFormError("请先选择出生日期和时间。"); return; }
    if (form.trueSolarTime !== "none" && !form.longitude) { setFormError("选择太阳时校正时，请填写出生地经度。"); return; }
    try {
      const nextProfile = buildProfile(form);
      setFormError(""); setProfile(nextProfile); setInputExpanded(false);
      const historyItem = toHistoryItem(nextProfile);
      const nextHistory = [historyItem, ...history.filter((item) => item.id !== historyItem.id)].slice(0, 12);
      setHistory(nextHistory); saveHistory(nextHistory);
    } catch (error) { setFormError(error instanceof Error ? error.message : "排盘失败，请检查输入。"); }
  }
  function selectHistory(item: HistoryItem) { setForm(formFromProfile(item.profile)); setProfile(item.profile); setInputExpanded(false); }
  function clearHistory() { setHistory([]); saveHistory([]); }

  return (
    <main className="app-shell workbench-v2">
      <div className="texture" />
      <header className="topbar">
        <a className="brand-lockup" href="#top" aria-label="四柱星盘 AI 首页">
          <span className="brand-seal">命</span><span><strong>四柱星盘 AI</strong><small>Deterministic Metaphysics Workbench</small></span>
        </a>
        <nav><a href="#chart">命盘</a><a href="#guides">指南</a><a href="#export">AI 导出</a><a href="#mcp">Agent</a><ThemeToggle /></nav>
      </header>

      <section className="hero-workbench" id="top">
        <motion.div className="intro-copy intro-copy-v2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <p className="hero-kicker"><Sparkles size={14} /> 可复现的传统术数计算底座</p>
            <h1>先把盘算准，<br /><em>再让 AI 真正去解。</em></h1>
            <p className="hero-description">免费、本地优先的八字与紫微斗数排盘工具。同一份出生数据由固定引擎生成四柱、大运流年流月与紫微资料；关系事实、时间口径、修正量、引擎和警告全部留痕。</p>
            <div className="hero-badges"><span><Cpu size={14} />代码排盘</span><span><Braces size={14} />事实与解释分层</span><span><LockKeyhole size={14} />本地优先</span></div>
          </div>
          <aside className="hero-signature"><small>当前命盘</small><strong>{signature}</strong><span>{profile ? `${profile.input.name} · ${profile.time.effective.label}` : "输入出生信息后开始"}</span></aside>
        </motion.div>

        <div className={profile ? "workbench-grid" : "workbench-grid empty-workbench"}>
          <aside className="side-stack">
            {profile && !inputExpanded ? (
              <motion.section animate={{ opacity: 1, y: 0 }} className="panel input-summary-panel profile-summary-v2" initial={{ opacity: 0, y: 8 }}>
                <div><p className="eyeline">Active Profile</p><h2>{profile.input.name}</h2></div>
                <p>{profile.input.gender === "male" ? "男命 / 乾造" : "女命 / 坤造"}</p>
                <strong>{profile.time.standard.date} · {profile.time.standard.time.slice(0, 5)}</strong>
                <small>{profile.time.effective.label} → {profile.time.effective.shichen}时</small>
                <button onClick={() => setInputExpanded(true)} type="button"><PencilLine size={15} />修改出生信息</button>
              </motion.section>
            ) : <InputPanel error={formError} form={form} onChange={setForm} onSubmit={generate} />}
            {profile ? <motion.div animate={{ opacity: 1, y: 0 }} id="export" initial={{ opacity: 0, y: 10 }}><ExportPanel profile={profile} /></motion.div> : null}
          </aside>

          {profile ? (
            <motion.div animate={{ opacity: 1, y: 0 }} className="center-stack" id="chart" initial={{ opacity: 0, y: 14 }}>
              <EngineAudit profile={profile} />
              <BaziPlate profile={profile} />
              <BaziFactsPanel profile={profile} />
              <TransitInspector profile={profile} />
              <ZiweiSummaryPanel profile={profile} />
              <ZiweiPlate profile={profile} />
            </motion.div>
          ) : (
            <section className="empty-stage">
              <div className="empty-orbit"><i /><i /><i /><span>四柱</span></div>
              <div><p className="eyeline">Ready</p><h2>这里不是“AI 猜命盘”。</h2><p>左侧输入出生资料后，先由计算内核生成可追溯命盘，再输出关系事实与结构化紫微数据给 AI 做分析。尤其接近子时、节气或时辰边界时，时间口径会明确展示。</p></div>
            </section>
          )}
        </div>
      </section>

      <section className="guide-hub" id="guides" aria-labelledby="guide-title">
        <div className="guide-heading">
          <div><p className="eyeline">Searchable Guides</p><h2 id="guide-title">把“会排盘”变成“看得懂为什么这样排”。</h2></div>
          <p>这些页面既给第一次接触术数的人看，也让搜索引擎和 AI 搜索更准确地理解这个项目真正做什么。</p>
        </div>
        <div className="guide-grid">
          {guideItems.map((item) => (
            <a href={`${guideBase}${item.href}`} key={item.href}>
              <span>{item.kicker}</span><h3>{item.title}</h3><p>{item.text}</p><i>阅读全文 <ArrowUpRight size={15} /></i>
            </a>
          ))}
        </div>
      </section>

      <section className="qa-panel qa-panel-v2" aria-labelledby="qa-title">
        <div className="qa-heading"><p className="eyeline">Methodology</p><h2 id="qa-title">为什么这样排盘</h2><span>把“计算事实”和“术数解释”分开，是这个项目最重要的原则。</span></div>
        <div className="qa-grid">{qaItems.map((item) => <article className="qa-item" key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></article>)}</div>
      </section>

      <HistoryRail items={history} onClear={clearHistory} onSelect={selectHistory} />
      <footer id="mcp" className="footer-strip">
        <div className="footer-copy"><strong>四柱星盘 AI · local-first deterministic chart engine</strong><span>开源仓库：<a href="https://github.com/JackMeds/sizhu-astro-ai" target="_blank" rel="noreferrer">JackMeds/sizhu-astro-ai</a></span><span>AI/Agent：<a href={agentGuideHref} target="_blank" rel="noreferrer">agents.md</a></span><span>搜索索引：<a href={`${import.meta.env.BASE_URL}sitemap.xml`}>sitemap.xml</a></span></div>
        <div className="footer-links"><span>Core:</span><a href="https://github.com/6tail/lunar-javascript" target="_blank" rel="noreferrer">lunar-javascript</a><a href="https://iztro.com/" target="_blank" rel="noreferrer">iztro</a><a href="https://github.com/waterbeside/lunisolar" target="_blank" rel="noreferrer">lunisolar</a></div>
      </footer>
    </main>
  );
}
