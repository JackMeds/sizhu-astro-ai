import { useEffect, useMemo, useState } from "react";
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
import { LanguageToggle } from "./components/LanguageToggle";
import { AgentActivityRail } from "./components/AgentActivityRail";
import { ExportPanel } from "./components/ExportPanel";
import { HistoryRail } from "./components/HistoryRail";
import { InputPanel, type FormState } from "./components/InputPanel";
import { LiurenBetaPanel } from "./components/LiurenBetaPanel";
import { ProfileResults } from "./components/ProfileResults";
import { ThemeToggle } from "./components/ThemeToggle";
import { WebMcpBridge } from "./components/WebMcpBridge";
import { loadHistory, saveHistory, toHistoryItem, type HistoryItem } from "./lib/history";
import { useI18n } from "./lib/i18n";
import { getBrowserTimeZone } from "./lib/timezone";
import { localDateTimeToOffset } from "./lib/utils";
import { useWorkspace, type WorkspaceActor } from "./lib/workspace";

const DRAFT_KEY = "sizhu-ai-form-draft-v1";
const defaultForm: FormState = {
  name: "",
  gender: "male",
  birthDateTime: "",
  calendar: "solar",
  timezone: getBrowserTimeZone(),
  locationName: "",
  longitude: "",
  trueSolarTime: "none",
  sect: 1
};
const exampleForm: FormState = {
  ...defaultForm,
  name: "示例命盘",
  gender: "female",
  birthDateTime: "1996-06-18T10:30",
  timezone: "Asia/Shanghai"
};
const agentGuideHref = `${import.meta.env.BASE_URL}agents.md`;
const guideBase = `${import.meta.env.BASE_URL}guide/`;

const faqDefinitions = [
  ["faq.interpret.q", "faq.interpret.a"],
  ["faq.beginner.q", "faq.beginner.a"],
  ["faq.stable.q", "faq.stable.a"],
  ["faq.time.q", "faq.time.a"],
  ["faq.liuren.q", "faq.liuren.a"],
  ["faq.privacy.q", "faq.privacy.a"]
] as const;

const guideDefinitions = [
  { href: "bazi.html", kicker: "BaZi", title: "guide.bazi.title", text: "guide.bazi.text" },
  { href: "ziwei.html", kicker: "Zi Wei", title: "guide.ziwei.title", text: "guide.ziwei.text" },
  { href: "liuren.html", kicker: "Da Liu Ren", title: "guide.liuren.title", text: "guide.liuren.text" },
  { href: "solar-time.html", kicker: "Time", title: "guide.time.title", text: "guide.time.text" },
  { href: "dayun.html", kicker: "Luck Cycle", title: "guide.transit.title", text: "guide.transit.text" },
  { href: "agent.html", kicker: "Agent / MCP", title: "guide.agent.title", text: "guide.agent.text" }
] as const;

function buildProfile(form: FormState, fallbackName: string): AstroProfile {
  return createAstroProfile({
    ...form,
    name: form.name.trim() || fallbackName,
    birthDateTime: localDateTimeToOffset(form.birthDateTime, form.timezone),
    location: form.trueSolarTime !== "none"
      ? { name: form.locationName || undefined, longitude: form.longitude ? Number(form.longitude) : undefined }
      : undefined
  });
}

function loadDraft(): FormState {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...defaultForm, ...JSON.parse(raw) } : defaultForm;
  } catch {
    return defaultForm;
  }
}

function formFromProfile(profile: AstroProfile): FormState {
  return {
    ...defaultForm,
    name: profile.input.name,
    gender: profile.input.gender,
    birthDateTime: profile.time.standard.isoLocal.slice(0, 16),
    calendar: profile.input.calendar,
    timezone: profile.input.timezone,
    locationName: profile.input.location?.name ?? "",
    longitude: profile.input.location?.longitude?.toString() ?? "",
    trueSolarTime: profile.input.trueSolarTime,
    sect: profile.input.sect
  };
}

export function App() {
  const { state, dispatch } = useWorkspace();
  const { t, isEnglish } = useI18n();
  const profile = state.profile;
  const [form, setForm] = useState<FormState>(() => loadDraft());
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [formError, setFormError] = useState("");
  const [inputExpanded, setInputExpanded] = useState(true);
  const signature = useMemo(
    () => profile?.bazi.pillars.map((pillar) => pillar.ganZhi).join(" · ") ?? "八字 · 紫微 · 六壬 · AI-ready JSON",
    [profile]
  );

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

  function acceptProfile(nextProfile: AstroProfile, actor: WorkspaceActor, label?: string) {
    setFormError("");
    setInputExpanded(false);
    dispatch({
      type: "set-profile",
      profile: nextProfile,
      actor,
      label: label ?? (actor === "agent" ? t("activity.chart.agent") : t("activity.chart.user"))
    });
    setHistory((current) => {
      const historyItem = toHistoryItem(nextProfile);
      const nextHistory = [historyItem, ...current.filter((item) => item.id !== historyItem.id)].slice(0, 12);
      saveHistory(nextHistory);
      return nextHistory;
    });
    window.setTimeout(() => document.getElementById("profile-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }

  function commitProfile(nextForm: FormState) {
    acceptProfile(buildProfile(nextForm, isEnglish ? "Untitled chart" : "未命名"), "user");
  }

  function generate() {
    if (!form.birthDateTime || !form.birthDateTime.includes(":")) {
      setFormError(t("form.error.datetime"));
      return;
    }
    if (form.trueSolarTime !== "none" && !form.longitude) {
      setFormError(t("form.error.longitude"));
      return;
    }
    try {
      commitProfile(form);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("form.error.generic"));
    }
  }

  function tryExample() {
    try {
      const localizedExample = { ...exampleForm, name: isEnglish ? "Fictional example" : "示例命盘" };
      setForm(localizedExample);
      commitProfile(localizedExample);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("form.error.example"));
    }
  }

  function handleAgentProfileCreated(nextProfile: AstroProfile) {
    setForm(formFromProfile(nextProfile));
    acceptProfile(nextProfile, "agent");
  }

  function selectHistory(item: HistoryItem) {
    setForm(formFromProfile(item.profile));
    acceptProfile(item.profile, "user", t("activity.chart.restored"));
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
  }

  return (
    <>
      <WebMcpBridge onProfileCreated={handleAgentProfileCreated} />
      <main className="app-shell workbench-v2 product-v3">
        <div className="texture" />
        <header className="topbar">
          <a className="brand-lockup" href="#top" aria-label={t("brand.name")}>
            <span className="brand-seal">命</span><span><strong>{t("brand.name")}</strong><small>{t("brand.subtitle")}</small></span>
          </a>
          <nav>
            <a href="#birth">{t("nav.birth")}</a><a href="#liuren">{t("nav.liuren")}</a><a href="#guides">{t("nav.guides")}</a><a href="#agent-access">{t("nav.agent")}</a>
            {profile ? <a className="nav-ai-link" href="#export">{t("nav.ai")}</a> : null}
            <a aria-label="GitHub" className="nav-icon-link" href="https://github.com/JackMeds/sizhu-astro-ai" target="_blank" rel="noreferrer"><Github size={17} /></a>
            <LanguageToggle />
            <ThemeToggle />
          </nav>
        </header>

        <section className="hero-workbench hero-v3" id="top">
          <motion.div className="intro-copy intro-copy-v2" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .48, ease: [0.22, 1, 0.36, 1] }}>
            <div>
              <p className="hero-kicker"><Sparkles size={14} /> {t("hero.kicker")}</p>
              <h1>{t("hero.title1")}<br /><em>{t("hero.title2")}</em></h1>
              <p className="hero-description">{t("hero.description")}</p>
              <div className="hero-badges"><span><Cpu size={14} />{t("hero.badge.compute")}</span><span><Braces size={14} />{t("hero.badge.shared")}</span><span><LockKeyhole size={14} />{t("hero.badge.local")}</span></div>
            </div>
            <aside className="hero-signature"><small>{t("hero.simple")}</small><strong>{profile ? signature : t("hero.signature.empty")}</strong><span>{profile ? `${profile.input.name} · ${t(`time.mode.${profile.time.effective.mode}`)}` : t("hero.signature.note")}</span></aside>
          </motion.div>

          <div className="task-entry-grid" aria-label={t("task.aria")}>
            <motion.a className="task-entry-card task-birth" href="#birth" whileHover={{ y: -5 }} whileTap={{ scale: .99 }} transition={{ type: "spring", stiffness: 360, damping: 24 }}>
              <span className="task-icon"><UserRound size={24} /></span>
              <div><p className="eyeline">{t("task.birth.kicker")}</p><h2>{t("task.birth.title")}</h2><p>{t("task.birth.text")}</p></div>
              <strong>{t("task.birth.action")} <ArrowRight size={17} /></strong>
            </motion.a>
            <motion.a className="task-entry-card task-liuren" href="#liuren" whileHover={{ y: -5 }} whileTap={{ scale: .99 }} transition={{ type: "spring", stiffness: 360, damping: 24 }}>
              <span className="task-icon"><MessageCircleQuestion size={24} /></span>
              <div><p className="eyeline">{t("task.liuren.kicker")}</p><h2>{t("task.liuren.title")}</h2><p>{t("task.liuren.text")}</p></div>
              <strong>{t("task.liuren.action")} <ArrowRight size={17} /></strong>
            </motion.a>
          </div>
          {!profile ? <motion.button className="example-entry" type="button" onClick={tryExample} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .22 }}><Play size={15} />{t("task.example")}</motion.button> : null}

          <div className={profile ? "workbench-grid workbench-generated" : "workbench-grid empty-workbench"} id="birth">
            <aside className="side-stack">
              {profile && !inputExpanded ? (
                <motion.section animate={{ opacity: 1, y: 0 }} className="panel input-summary-panel profile-summary-v2" initial={{ opacity: 0, y: 8 }}>
                  <div><p className="eyeline">{t("current.title")}</p><h2>{profile.input.name}</h2></div>
                  <p>{profile.input.gender === "male" ? t("current.male") : t("current.female")}</p>
                  <strong>{profile.time.standard.date} · {profile.time.standard.time.slice(0, 5)}</strong>
                  <small>{profile.input.timezone} · {t(`time.mode.${profile.time.effective.mode}`)} → {profile.time.effective.shichen}</small>
                  <button onClick={() => setInputExpanded(true)} type="button"><PencilLine size={15} />{t("current.edit")}</button>
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
                <div className="empty-orbit"><i /><i /><i /><span>{isEnglish ? "BaZi" : "四柱"}</span></div>
                <div><p className="eyeline">{t("empty.kicker")}</p><h2>{t("empty.title")}</h2><div className="three-step-list"><span><b>1</b>{t("empty.step1")}</span><span><b>2</b>{t("empty.step2")}</span><span><b>3</b>{t("empty.step3")}</span></div><p>{t("empty.note")}</p></div>
              </motion.section>
            )}
          </div>
        </section>

        <motion.div id="liuren" className="section-reveal" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .45 }}><LiurenBetaPanel /></motion.div>

        <motion.section className="guide-hub" id="guides" aria-labelledby="guide-title" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .4 }}>
          <div className="guide-heading">
            <div><p className="eyeline">{t("guide.kicker")}</p><h2 id="guide-title">{t("guide.title")}</h2></div>
            <p>{t("guide.description")}</p>
          </div>
          <div className="guide-grid">
            {guideDefinitions.map((item) => (
              <a href={`${guideBase}${item.href}`} key={item.href}>
                <span>{item.kicker}</span><h3>{t(item.title)}</h3><p>{t(item.text)}</p><i>{t("guide.read")} <ArrowUpRight size={15} /></i>
              </a>
            ))}
          </div>
        </motion.section>

        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .4 }}><AgentAccessPanel /></motion.div>

        <section className="qa-panel qa-panel-v2" aria-labelledby="qa-title">
          <div className="qa-heading"><p className="eyeline">{t("faq.kicker")}</p><h2 id="qa-title">{t("faq.title")}</h2><span>{t("faq.subtitle")}</span></div>
          <div className="qa-grid">{faqDefinitions.map(([question, answer]) => <article className="qa-item" key={question}><h3>{t(question)}</h3><p>{t(answer)}</p></article>)}</div>
        </section>

        <HistoryRail items={history} onClear={clearHistory} onSelect={selectHistory} />
        <footer id="mcp" className="footer-strip">
          <div className="footer-copy"><strong>{t("footer.engine")}</strong><span>{t("footer.repo")}：<a href="https://github.com/JackMeds/sizhu-astro-ai" target="_blank" rel="noreferrer">JackMeds/sizhu-astro-ai</a></span><span>{t("footer.agent")}：<a href="#agent-access">{t("footer.quick")}</a> · <a href={agentGuideHref} target="_blank" rel="noreferrer">agents.md</a></span><span>{t("footer.privacy")}</span></div>
          <div className="footer-links"><span>Core:</span><a href="https://github.com/6tail/lunar-javascript" target="_blank" rel="noreferrer">lunar-javascript</a><a href="https://iztro.com/" target="_blank" rel="noreferrer">iztro</a><a href="https://github.com/waterbeside/lunisolar" target="_blank" rel="noreferrer">lunisolar</a></div>
        </footer>

        <nav className="mobile-task-nav" aria-label={t("nav.quickAria")}>
          <a href="#top"><Home size={17} /><span>{t("nav.home")}</span></a>
          <a href="#birth"><UserRound size={17} /><span>{t("nav.chart")}</span></a>
          <a href="#liuren"><Orbit size={17} /><span>{t("nav.liuren")}</span></a>
          <a href={profile ? "#export" : "#birth"}><Sparkles size={17} /><span>{t("nav.aiShort")}</span></a>
          <a href="#guides"><BookOpen size={17} /><span>{t("nav.guideShort")}</span></a>
        </nav>
        <AgentActivityRail />
      </main>
    </>
  );
}
