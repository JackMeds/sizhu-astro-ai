import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(root, "apps", "web");
const publicRoot = path.join(webRoot, "public");
const baseUrl = "https://astrocopy.jackmeds.top";

/**
 * Keep this registry intentionally small and hand-curated. Every URL must
 * correspond to a real, useful page rather than a generated keyword variant.
 */
const pages = [
  { url: "/", source: "apps/web/index.html", priority: "1.0", changefreq: "weekly", alternates: true },
  { url: "/en/", source: "apps/web/en/index.html", priority: "0.95", alternates: true },
  { url: "/zh/", source: "apps/web/zh/index.html", priority: "0.95", alternates: true },
  { url: "/bazi/", source: "apps/web/public/bazi/index.html", priority: "0.9" },
  { url: "/ziwei/", source: "apps/web/public/ziwei/index.html", priority: "0.9" },
  { url: "/liuren/", source: "apps/web/public/liuren/index.html", priority: "0.9" },
  { url: "/true-solar-time/", source: "apps/web/public/true-solar-time/index.html", priority: "0.85" },
  { url: "/agent/", source: "apps/web/public/agent/index.html", priority: "0.85" },
  { url: "/about/", source: "apps/web/public/about/index.html", priority: "0.65" },
  { url: "/privacy/", source: "apps/web/public/privacy/index.html", priority: "0.65" },
  { url: "/guide/", source: "apps/web/public/guide/index.html", priority: "0.8" },
  { url: "/guide/bazi.html", source: "apps/web/public/guide/bazi.html", priority: "0.75" },
  { url: "/guide/ziwei.html", source: "apps/web/public/guide/ziwei.html", priority: "0.75" },
  { url: "/guide/liuren.html", source: "apps/web/public/guide/liuren.html", priority: "0.75" },
  { url: "/guide/solar-time.html", source: "apps/web/public/guide/solar-time.html", priority: "0.75" },
  { url: "/guide/dayun.html", source: "apps/web/public/guide/dayun.html", priority: "0.75" },
  { url: "/guide/agent.html", source: "apps/web/public/guide/agent.html", priority: "0.75" },
  { url: "/guide/late-zi-hour.html", source: "apps/web/public/guide/late-zi-hour.html", priority: "0.7" },
  { url: "/guide/shichen-boundary.html", source: "apps/web/public/guide/shichen-boundary.html", priority: "0.7" },
  { url: "/guide/true-solar-time-impact.html", source: "apps/web/public/guide/true-solar-time-impact.html", priority: "0.7" },
  { url: "/guide/ziwei-software-differences.html", source: "apps/web/public/guide/ziwei-software-differences.html", priority: "0.7" },
  { url: "/guide/liuren-transmission-example.html", source: "apps/web/public/guide/liuren-transmission-example.html", priority: "0.7" },
  { url: "/guide/ai-bazi-analysis.html", source: "apps/web/public/guide/ai-bazi-analysis.html", priority: "0.7" }
];

function xmlEscape(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
  })[character]);
}

function gitDate(source) {
  try {
    execFileSync("git", ["diff", "HEAD", "--quiet", "--", source], {
      cwd: root,
      stdio: "ignore"
    });
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", source], {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"]
    }).toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  } catch {
    // Source archives without .git fall through to the filesystem timestamp.
  }
  return null;
}

async function sourceDate(source) {
  const fromGit = gitDate(source);
  if (fromGit) return fromGit;
  const stat = await fs.stat(path.join(root, source));
  return stat.mtime.toISOString().slice(0, 10);
}

function alternates() {
  return [
    `    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/en/" />`,
    `    <xhtml:link rel="alternate" hreflang="zh-Hans" href="${baseUrl}/zh/" />`,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />`
  ];
}

const entries = [];
for (const page of pages) {
  entries.push({ ...page, lastmod: await sourceDate(page.source) });
}

const lines = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:xhtml="http://www.w3.org/1999/xhtml">'
];

for (const page of entries) {
  lines.push("  <url>");
  lines.push(`    <loc>${xmlEscape(`${baseUrl}${page.url}`)}</loc>`);
  lines.push(`    <lastmod>${page.lastmod}</lastmod>`);
  if (page.changefreq) lines.push(`    <changefreq>${page.changefreq}</changefreq>`);
  lines.push(`    <priority>${page.priority}</priority>`);
  if (page.alternates) lines.push(...alternates());
  lines.push("  </url>");
}

lines.push("</urlset>", "");
const outputPath = path.join(publicRoot, "sitemap.xml");
await fs.writeFile(outputPath, lines.join("\n"), "utf8");
console.log(`Generated ${path.relative(root, outputPath)} with ${entries.length} URLs.`);
