import type { AstroProfile } from "@sizhu/core";

const STORAGE_KEY = "sizhu-ai-history-v1";

export interface HistoryItem {
  id: string;
  name: string;
  generatedAt: string;
  birthDateTime: string;
  dayMaster: string;
  pillars: string;
  profile: AstroProfile;
}

export function toHistoryItem(profile: AstroProfile): HistoryItem {
  return {
    id: `${profile.input.name}-${profile.input.birthDateTime}-${profile.meta.generatedAt}`,
    name: profile.input.name,
    generatedAt: profile.meta.generatedAt,
    birthDateTime: profile.input.birthDateTime,
    dayMaster: profile.bazi.dayMaster,
    pillars: profile.bazi.pillars.map((pillar) => pillar.ganZhi).join(" "),
    profile
  };
}

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // v1.1 adds an auditable time profile. Older cached records are intentionally
    // excluded instead of pretending they were produced by the new calculation chain.
    return parsed.filter((item) => item?.profile?.time?.engine === "sizhu-time-v2").slice(0, 12);
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 12)));
}
