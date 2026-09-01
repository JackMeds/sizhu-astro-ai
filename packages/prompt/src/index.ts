import type { AstroProfile } from "@sizhu/core";
import {
  buildAnalysisPrompt,
  type AnalysisPromptOptions,
  type PromptMode,
  type PromptSystem
} from "./analysis.js";

export {
  buildAnalysisPrompt,
  PROMPT_METHOD_ID,
  PROMPT_MODE_META,
  PROMPT_SYSTEM_META
} from "./analysis.js";
export type {
  AnalysisPromptFormat,
  AnalysisPromptOptions,
  PromptLocale,
  PromptMode,
  PromptSystem
} from "./analysis.js";
export { buildLiurenAnalysisPrompt } from "./liuren.js";
export type { LiurenPromptOptions } from "./liuren.js";

export type ExportFormat = "json" | "markdown" | "txt";

export interface PromptOptions {
  audience?: "general-ai" | "bazi-specialist" | "research";
  includeZiwei?: boolean;
  includeWarnings?: boolean;
  locale?: AnalysisPromptOptions["locale"];
  mode?: PromptMode;
  system?: PromptSystem;
  question?: string;
  targetTransit?: AnalysisPromptOptions["targetTransit"];
  comparisonTransits?: AnalysisPromptOptions["comparisonTransits"];
  dataWarnings?: string[];
}

/** Backward-compatible general analysis prompt entrypoint. */
export function buildAiPrompt(profile: AstroProfile, options: PromptOptions = {}): string {
  const system = options.system ?? (options.includeZiwei === false ? "bazi" : "combined");
  const nextProfile = options.includeWarnings === false ? { ...profile, warnings: [] } : profile;
  return buildAnalysisPrompt(nextProfile, {
    locale: options.locale ?? "zh-CN",
    format: "markdown",
    system,
    mode: options.mode ?? "general",
    ...(options.question ? { question: options.question } : {}),
    ...(options.targetTransit ? { targetTransit: options.targetTransit } : {}),
    ...(options.comparisonTransits ? { comparisonTransits: options.comparisonTransits } : {}),
    ...(options.dataWarnings ? { dataWarnings: options.dataWarnings } : {})
  });
}

export function exportProfile(profile: AstroProfile, format: ExportFormat, options: PromptOptions = {}): string {
  if (format === "json") return JSON.stringify(profile, null, 2);
  const nextProfile = options.includeWarnings === false ? { ...profile, warnings: [] } : profile;
  return buildAnalysisPrompt(nextProfile, {
    locale: options.locale ?? "zh-CN",
    format,
    system: options.system ?? (options.includeZiwei === false ? "bazi" : "combined"),
    mode: options.mode ?? "general",
    ...(options.question ? { question: options.question } : {}),
    ...(options.targetTransit ? { targetTransit: options.targetTransit } : {}),
    ...(options.comparisonTransits ? { comparisonTransits: options.comparisonTransits } : {}),
    ...(options.dataWarnings ? { dataWarnings: options.dataWarnings } : {})
  });
}
