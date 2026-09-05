import type { AstroProfile, TransitSnapshot } from "@mingxu/core";
import {
  buildAnalysisPrompt,
  PROMPT_MODE_META,
  type AnalysisPromptFormat,
  type PromptMode,
  type PromptSystem
} from "@mingxu/prompt";

export type { PromptMode, PromptSystem } from "@mingxu/prompt";
export type PromptFormat = AnalysisPromptFormat;

export interface PromptBuildContext {
  question?: string;
  targetTransit?: TransitSnapshot;
  comparisonTransits?: TransitSnapshot[];
  dataWarnings?: string[];
}

export const promptModes: Array<{ key: PromptMode; label: string; focus: string }> = (
  Object.entries(PROMPT_MODE_META) as Array<[PromptMode, (typeof PROMPT_MODE_META)[PromptMode]]>
).map(([key, item]) => ({ key, label: item.label.zh, focus: item.focus.zh }));

export const promptSystems: Array<{ key: PromptSystem; label: string; hint: string }> = [
  { key: "combined", label: "八字 + 紫微", hint: "默认推荐；分别判断后再交叉验证" },
  { key: "bazi", label: "只看八字", hint: "月令、结构、制化与运限" },
  { key: "ziwei", label: "只看紫微", hint: "宫位、三方四正、四化与限运" }
];

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function wrapText(value: string, size = 56) {
  const normalized = value.replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  for (const line of normalized) {
    if (!line) { lines.push(""); continue; }
    for (let index = 0; index < line.length; index += size) lines.push(line.slice(index, index + size));
  }
  return lines.slice(0, 42);
}

export function renderPromptSvg(title: string, content: string) {
  const lines = wrapText(content);
  const height = Math.max(520, 120 + lines.length * 24);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${height}" viewBox="0 0 1080 ${height}">
  <rect width="1080" height="${height}" fill="#07100e"/>
  <rect x="36" y="36" width="1008" height="${height - 72}" rx="26" fill="#101b18" stroke="#3c6f61"/>
  <text x="68" y="88" fill="#49b39a" font-family="Arial, sans-serif" font-size="18" font-weight="700">AI PROMPT</text>
  <text x="68" y="126" fill="#f4d28a" font-family="serif" font-size="34" font-weight="700">${escapeXml(title)}</text>
  ${lines.map((line, index) => `<text x="68" y="${174 + index * 24}" fill="#e9ddc6" font-family="Arial, sans-serif" font-size="18">${escapeXml(line)}</text>`).join("\n  ")}
</svg>`;
}

export function buildPrompt(
  profile: AstroProfile,
  mode: PromptMode,
  format: PromptFormat,
  system: PromptSystem = "combined",
  context: PromptBuildContext = {}
) {
  return buildAnalysisPrompt(profile, { locale: "zh-CN", format, system, mode, ...context });
}

export function buildEnglishPrompt(
  profile: AstroProfile,
  mode: PromptMode,
  format: PromptFormat,
  system: PromptSystem = "combined",
  context: PromptBuildContext = {}
) {
  return buildAnalysisPrompt(profile, { locale: "en", format, system, mode, ...context });
}
