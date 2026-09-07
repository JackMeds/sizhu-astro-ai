import type { Locale } from "./i18n";

export const SITE_ORIGIN = "https://astrocopy.jackmeds.top";

export interface SeoProfile {
  canonicalPath: "/" | "/zh/" | "/en/";
  language: Locale;
  ogLocale: "zh_CN" | "en_US";
  title: string;
  description: string;
  socialDescription: string;
  image: string;
  imageAlt: string;
  siteName: string;
}

export const SEO_PROFILES: Record<"root" | "zh" | "en", SeoProfile> = {
  root: {
    canonicalPath: "/", language: "zh-CN", ogLocale: "zh_CN",
    title: "命序｜AI 八字排盘、五行分析与命盘可视化",
    description: "命序是本地优先的 AI 八字排盘、五行分析与命盘可视化工作台，用固定代码生成四柱、紫微、运限和大六壬结构，再交给你选择的 AI 解读。",
    socialDescription: "看见命盘的结构与时间：八字、紫微、运限和大六壬由固定代码计算，再交给你选择的 AI 解读。",
    image: `${SITE_ORIGIN}/brand/og-workspace.png`, imageAlt: "命序双语结构化命盘工作台", siteName: "命序 · MingXu"
  },
  zh: {
    canonicalPath: "/zh/", language: "zh-CN", ogLocale: "zh_CN",
    title: "命序｜确定性八字、紫微与大六壬工作台",
    description: "命序是本地优先、中英双语的八字、紫微斗数、大六壬、运限与真太阳时计算工作台，用固定代码生成结构化命盘，再交给你选择的 AI 解读。",
    socialDescription: "先用固定代码排出结构，再把可复核资料交给你选择的 AI 解读。",
    image: `${SITE_ORIGIN}/brand/og-workspace.png`, imageAlt: "命序双语结构化命盘工作台", siteName: "命序 · MingXu"
  },
  en: {
    canonicalPath: "/en/", language: "en-US", ogLocale: "en_US",
    title: "MingXu | Deterministic BaZi, Zi Wei and Da Liu Ren Workspace",
    description: "MingXu is a bilingual, local-first workspace for deterministic BaZi, Zi Wei Dou Shu, Da Liu Ren, transit and true-solar-time calculations, with structured results ready for the AI you choose.",
    socialDescription: "Compute chart structure with fixed code, then give the evidence to the AI you choose for interpretation.",
    image: `${SITE_ORIGIN}/brand/og-workspace.png`, imageAlt: "MingXu bilingual structured chart workspace", siteName: "MingXu · 命序"
  }
};

export function seoProfileFor(locale: Locale, pathname: string): SeoProfile {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/en") return SEO_PROFILES.en;
  if (normalized === "/zh") return SEO_PROFILES.zh;
  return normalized === "/" && locale === "en-US"
    ? { ...SEO_PROFILES.en, canonicalPath: "/" }
    : SEO_PROFILES.root;
}

function setMeta(selector: string, value: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", value);
}

export function applySeoProfile(profile: SeoProfile) {
  const canonical = `${SITE_ORIGIN}${profile.canonicalPath}`;
  document.documentElement.lang = profile.language;
  document.title = profile.title;
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", canonical);
  setMeta('meta[name="description"]', profile.description);
  setMeta('meta[property="og:locale"]', profile.ogLocale);
  setMeta('meta[property="og:url"]', canonical);
  setMeta('meta[property="og:site_name"]', profile.siteName);
  setMeta('meta[property="og:title"]', profile.title);
  setMeta('meta[property="og:description"]', profile.socialDescription);
  setMeta('meta[property="og:image"]', profile.image);
  setMeta('meta[property="og:image:alt"]', profile.imageAlt);
  setMeta('meta[name="twitter:title"]', profile.title);
  setMeta('meta[name="twitter:description"]', profile.socialDescription);
  setMeta('meta[name="twitter:image"]', profile.image);

  const script = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"][data-app-structured-data]');
  if (!script) return;
  try {
    const value = JSON.parse(script.textContent || "{}") as { "@graph"?: Array<Record<string, unknown>> };
    for (const item of value["@graph"] ?? []) {
      if (item["@type"] === "WebSite" || item["@type"] === "WebApplication") {
        item.url = canonical;
        item.inLanguage = profile.language;
      }
    }
    script.textContent = JSON.stringify(value);
  } catch {
    // The valid static metadata remains available if another script altered this block.
  }
}
