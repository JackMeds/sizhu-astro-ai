import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import { ArrowDown, CheckCircle2, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import type { AstroProfile } from "@sizhu/core";
import { useWorkspace, type WorkspaceView } from "@/lib/workspace";
import { BaziFactsPanel } from "./BaziFactsPanel";
import { BaziPlate } from "./BaziPlate";
import { EngineAudit } from "./EngineAudit";
import { TransitInspector } from "./TransitInspector";
import { ZiweiPlate } from "./ZiweiPlate";
import { ZiweiSummaryPanel } from "./ZiweiSummaryPanel";

interface ProfileResultsProps {
  profile: AstroProfile;
}

export function ProfileResults({ profile }: ProfileResultsProps) {
  const { state, dispatch } = useWorkspace();
  const signature = profile.bazi.pillars.map((pillar) => pillar.ganZhi).join(" · ");
  const evidence = profile.ai.evidence.slice(0, 4);

  function selectView(value: string) {
    const view = value as WorkspaceView;
    dispatch({
      type: "set-view",
      view,
      actor: "user",
      label: "You switched the chart view",
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
          <p className="eyeline">Chart ready</p>
          <h2>命盘已经算好了。</h2>
          <p>八字、紫微、时间口径和计算依据已经整理好。普通用户可以直接进入下一步，不必先看懂下面所有术语。</p>
          <div className="result-signature" aria-label="四柱">
            {profile.bazi.pillars.map((pillar) => (
              <span key={pillar.key}><small>{pillar.label}</small><strong>{pillar.ganZhi}</strong></span>
            ))}
          </div>
        </div>
        <a className="result-primary-action" href="#export">
          <Sparkles size={17} />复制给 AI 解读<ArrowDown size={15} />
        </a>
      </div>

      <Tabs.Root className="progressive-results" value={state.activeView} onValueChange={selectView}>
        <Tabs.List className="progressive-tab-list" aria-label="命盘结果分类">
          <Tabs.Trigger value="overview">概览</Tabs.Trigger>
          <Tabs.Trigger value="bazi">八字</Tabs.Trigger>
          <Tabs.Trigger value="ziwei">紫微</Tabs.Trigger>
          <Tabs.Trigger value="transit">运势</Tabs.Trigger>
          <Tabs.Trigger value="audit">计算依据</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content className="progressive-tab-content" value="overview">
          <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}>
            <section className="overview-panel panel">
              <div className="overview-heading">
                <div><p className="eyeline"><Orbit size={14} /> Quick overview</p><h3>{profile.input.name} · {signature}</h3></div>
                <span className="overview-status"><ShieldCheck size={14} /> {profile.warnings.length ? `${profile.warnings.length} 条提醒` : "结构已生成"}</span>
              </div>
              <p className="overview-summary">{profile.ai.summary}</p>
              <div className="overview-facts">
                {evidence.map((item) => (
                  <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong></article>
                ))}
              </div>
              <div className="overview-next-step">
                <strong>第一次使用？</strong>
                <span>不用从这里判断吉凶。点上面的“复制给 AI 解读”，把完整结构交给你喜欢的 AI，再围绕你的问题继续问。</span>
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
