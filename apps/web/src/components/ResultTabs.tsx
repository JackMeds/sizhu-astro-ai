import * as Tabs from "@radix-ui/react-tabs";
import type { AstroProfile } from "@sizhu/core";

interface ResultTabsProps {
  profile: AstroProfile;
}

export function ResultTabs({ profile }: ResultTabsProps) {
  return (
    <Tabs.Root className="panel result-tabs" defaultValue="overview">
      <Tabs.List className="tab-list" aria-label="analysis sections">
        <Tabs.Trigger value="overview">总览</Tabs.Trigger>
        <Tabs.Trigger value="bazi">八字</Tabs.Trigger>
        <Tabs.Trigger value="ziwei">紫微</Tabs.Trigger>
        <Tabs.Trigger value="ai">AI 证据</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="overview" className="tab-content">
        <div className="summary-line">{profile.ai.summary}</div>
        <div className="fact-grid">
          {profile.ai.evidence.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
        {profile.warnings.length > 0 ? (
          <div className="warning-list">
            {profile.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </Tabs.Content>

      <Tabs.Content value="bazi" className="tab-content">
        <div className="pillar-table">
          {profile.bazi.pillars.map((pillar) => (
            <div className="pillar-row" key={pillar.key}>
              <span>{pillar.label}</span>
              <strong>{pillar.ganZhi}</strong>
              <em>{pillar.tenGod}</em>
              <small>藏干 {pillar.hiddenStems.join("、") || "-"}</small>
              <small>纳音 {pillar.nayin || "-"}</small>
            </div>
          ))}
        </div>
        <div className="luck-strip">
          {profile.bazi.luck.dayun.slice(0, 8).map((item, index) => (
            <div key={`${item.ganZhi}-${index}`}>
              <span>{item.startAge ?? "-"}岁</span>
              <strong>{item.ganZhi}</strong>
              <em>{item.startYear ?? "-"}</em>
            </div>
          ))}
        </div>
      </Tabs.Content>

      <Tabs.Content value="ziwei" className="tab-content">
        {profile.ziwei.available ? (
          <div className="palace-grid">
            {profile.ziwei.palaces.slice(0, 12).map((palace, index) => (
              <div key={`${palace.name}-${index}`}>
                <span>{palace.name || "-"}</span>
                <strong>{palace.heavenlyStem}{palace.earthlyBranch}</strong>
                <small>{palace.majorStars.join("、") || "主星待校验"}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">紫微盘暂不可用：{profile.ziwei.error || "等待引擎适配"}</div>
        )}
      </Tabs.Content>

      <Tabs.Content value="ai" className="tab-content">
        <div className="prompt-sections">
          {profile.ai.recommendedPromptSections.map((section) => (
            <span key={section}>{section}</span>
          ))}
        </div>
        <pre className="json-preview">{JSON.stringify(profile, null, 2).slice(0, 2600)}</pre>
      </Tabs.Content>
    </Tabs.Root>
  );
}
