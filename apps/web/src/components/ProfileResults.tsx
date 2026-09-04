import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import { ArrowDown, CheckCircle2, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import type { AstroProfile } from "@mingxu/core";
import { useI18n } from "@/lib/i18n";
import { useWorkspace, type WorkspaceView } from "@/lib/workspace";
import { BaziFactsPanel } from "./BaziFactsPanel";
import { BaziPlate } from "./BaziPlate";
import { EngineAudit } from "./EngineAudit";
import { TransitInspector } from "./TransitInspector";
import { ZiweiPlate } from "./ZiweiPlate";
import { ZiweiSummaryPanel } from "./ZiweiSummaryPanel";

interface ProfileResultsProps {
  profile: AstroProfile;
  hideTabList?: boolean;
}

const evidenceTranslationKeyByLabel: Record<string, string> = {
  输入时间: "inputTime",
  排盘口径: "timeMode",
  阳历: "solar",
  阴历: "lunar",
  生肖: "zodiac",
  日主: "dayMaster",
  八字关系事实: "relations",
  传统规则命中: "rules",
  紫微摘要: "ziwei",
  紫微生年四化: "mutagens"
};

export function ProfileResults({ profile, hideTabList = false }: ProfileResultsProps) {
  const { state, dispatch } = useWorkspace();
  const { t } = useI18n();
  const signature = profile.bazi.pillars.map((pillar) => pillar.ganZhi).join(" · ");
  const evidence = profile.ai.evidence.slice(0, 4);

  function selectView(value: string) {
    const view = value as WorkspaceView;
    dispatch({
      type: "set-view",
      view,
      actor: "user",
      label: t("activity.view.user"),
      detail: view
    });
  }

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="profile-results-v3"
      id="chart"
      initial={{ opacity: 0, y: 18 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="result-ready-card" id="profile-result">
        <div className="result-ready-icon"><CheckCircle2 size={24} /></div>
        <div className="result-ready-copy">
          <p className="eyeline">{t("result.ready.kicker")}</p>
          <h2>{t("result.ready.title")}</h2>
          <p>{t("result.ready.text")}</p>
          <div className="result-signature" aria-label={t("result.pillars.label")}>
            {profile.bazi.pillars.map((pillar) => (
              <span key={pillar.key}><small>{t(`bazi.pillar.${pillar.key}`)}</small><strong>{pillar.ganZhi}</strong></span>
            ))}
          </div>
        </div>
        <a className="result-primary-action" href="#export">
          <Sparkles size={17} />{t("result.ready.action")}<ArrowDown size={15} />
        </a>
      </div>

      <Tabs.Root className="progressive-results" value={state.activeView} onValueChange={selectView}>
        <Tabs.List className={`progressive-tab-list${hideTabList ? " is-external" : ""}`} aria-label={t("result.tabs.label")}>
          <Tabs.Trigger value="overview">{t("result.tab.overview")}</Tabs.Trigger>
          <Tabs.Trigger value="bazi">{t("result.tab.bazi")}</Tabs.Trigger>
          <Tabs.Trigger value="ziwei">{t("result.tab.ziwei")}</Tabs.Trigger>
          <Tabs.Trigger value="transit">{t("result.tab.transit")}</Tabs.Trigger>
          <Tabs.Trigger value="audit">{t("result.tab.audit")}</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="progressive-tab-content" value="overview">
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}>
            <section className="overview-panel panel">
              <div className="overview-heading">
                <div><p className="eyeline"><Orbit size={14} /> {t("result.overview.kicker")}</p><h3>{profile.input.name} · {signature}</h3></div>
                <span className="overview-status"><ShieldCheck size={14} /> {profile.warnings.length ? t("result.warning.count", { count: profile.warnings.length }) : t("result.generated")}</span>
              </div>
              <p className="overview-summary">{t("result.overview.summary")}</p>
              <div className="overview-facts">
                {evidence.map((item) => (
                  <article key={item.label}><span>{t(`evidence.${evidenceTranslationKeyByLabel[item.label] ?? "other"}`)}</span><strong>{item.value}</strong></article>
                ))}
              </div>
              <div className="overview-next-step">
                <strong>{t("result.beginner")}</strong>
                <span>{t("result.beginner.text")}</span>
              </div>
            </section>
          </motion.div>
        </Tabs.Content>

        <Tabs.Content className="progressive-tab-content" value="bazi">
          <motion.div className="result-section-stack" animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}>
            <BaziPlate profile={profile} />
            <BaziFactsPanel profile={profile} />
          </motion.div>
        </Tabs.Content>

        <Tabs.Content className="progressive-tab-content" value="ziwei">
          <motion.div className="result-section-stack" animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}>
            <ZiweiSummaryPanel profile={profile} />
            <ZiweiPlate profile={profile} focusedIds={state.focusedIds} />
          </motion.div>
        </Tabs.Content>

        <Tabs.Content className="progressive-tab-content" value="transit">
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}>
            <TransitInspector profile={profile} />
          </motion.div>
        </Tabs.Content>

        <Tabs.Content className="progressive-tab-content" value="audit">
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}>
            <EngineAudit profile={profile} />
          </motion.div>
        </Tabs.Content>
      </Tabs.Root>
    </motion.section>
  );
}
