import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { SEO_PROFILES } from "../src/lib/seo";

const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));
const webRoot = fileURLToPath(new URL("../", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

test("SEO discovery infrastructure exposes the Agent page and canonical links", () => {
  const home = readFileSync(`${publicRoot}/../index.html`, "utf8");
  const agent = readFileSync(`${publicRoot}/agent/index.html`, "utf8");
  const robots = readFileSync(`${publicRoot}/robots.txt`, "utf8");
  const sitemap = readFileSync(`${publicRoot}/sitemap.xml`, "utf8");

  for (const path of ["/bazi/", "/ziwei/", "/liuren/", "/true-solar-time/", "/benchmark/", "/open-source/"]) {
    assert.ok(home.includes(`href="${path}"`), path);
  }
  assert.match(agent, /<link rel="canonical" href="https:\/\/astrocopy\.jackmeds\.top\/agent\/"/);
  assert.match(agent, /"@type": \["WebApplication", "SoftwareApplication"\]/);
  assert.match(agent, /landing-agent\.js/);
  assert.match(robots, /User-agent: OAI-SearchBot\s+Allow: \//);
  assert.match(sitemap, /<loc>https:\/\/astrocopy\.jackmeds\.top\/agent\/<\/loc>/);
  assert.doesNotMatch(agent, /noindex/i);
});

test("static tool landing pages include the lightweight Agent bootstrap", () => {
  for (const page of ["bazi", "ziwei", "liuren", "true-solar-time"]) {
    const source = readFileSync(`${publicRoot}/${page}/index.html`, "utf8");
    assert.match(source, /<script type="module" src="\/landing-agent\.js"><\/script>/, page);
  }
});

test("localized application entries are direct, indexable Vite pages", () => {
  const root = readFileSync(`${webRoot}/index.html`, "utf8");
  const zh = readFileSync(`${webRoot}/zh/index.html`, "utf8");
  const en = readFileSync(`${webRoot}/en/index.html`, "utf8");

  for (const [source, canonical, language] of [
    [root, "https://astrocopy.jackmeds.top/", "zh-CN"],
    [zh, "https://astrocopy.jackmeds.top/zh/", "zh-CN"],
    [en, "https://astrocopy.jackmeds.top/en/", "en-US"]
  ] as const) {
    assert.match(source, new RegExp(`<html lang="${language}">`));
    assert.ok(source.includes(`<link rel="canonical" href="${canonical}"`), canonical);
    assert.match(source, /<meta name="robots" content="index,follow/);
    assert.match(source, /<h1>[^<]+<\/h1>/);
    assert.match(source, /<meta name="description" content="[^"]+"/);
    assert.match(source, /<script type="module" src="\/src\/main\.tsx"><\/script>/);
    assert.doesNotMatch(source, /meta http-equiv="refresh"|location\.replace/);
  }

  for (const hreflang of [
    'hreflang="en" href="https://astrocopy.jackmeds.top/en/"',
    'hreflang="zh-Hans" href="https://astrocopy.jackmeds.top/zh/"',
    'hreflang="x-default" href="https://astrocopy.jackmeds.top/"'
  ]) {
    assert.ok(root.includes(hreflang));
    assert.ok(zh.includes(hreflang));
    assert.ok(en.includes(hreflang));
  }
});

test("static localized entries match the shared runtime SEO contract", () => {
  for (const [file, profile] of [
    [`${webRoot}/index.html`, SEO_PROFILES.root],
    [`${webRoot}/zh/index.html`, SEO_PROFILES.zh],
    [`${webRoot}/en/index.html`, SEO_PROFILES.en]
  ] as const) {
    const source = readFileSync(file, "utf8");
    assert.ok(source.includes(`<title>${profile.title}</title>`), file);
    assert.ok(source.includes(`content="${profile.description}"`), file);
    assert.ok(source.includes(`href="https://astrocopy.jackmeds.top${profile.canonicalPath}"`), file);
    assert.ok(source.includes(`content="${profile.image}"`), file);
    assert.match(source, /data-app-structured-data/);
    for (const href of ["/benchmark/", "/open-source/", "/agent/", "/about/"]) {
      assert.ok(source.includes(`href="${href}"`), `${file}: ${href}`);
    }
  }
});

test("SEO clusters use dedicated non-empty social preview images", () => {
  for (const name of ["workspace", "bazi", "ziwei", "liuren", "solar-time", "trust"]) {
    const image = readFileSync(`${publicRoot}/brand/og-${name}.png`);
    assert.ok(image.byteLength > 100_000, name);
  }
  const expectations = new Map([
    [`${publicRoot}/bazi/index.html`, "og-bazi.png"],
    [`${publicRoot}/ziwei/index.html`, "og-ziwei.png"],
    [`${publicRoot}/liuren/index.html`, "og-liuren.png"],
    [`${publicRoot}/true-solar-time/index.html`, "og-solar-time.png"],
    [`${publicRoot}/benchmark/index.html`, "og-trust.png"]
  ]);
  for (const [file, image] of expectations) assert.ok(readFileSync(file, "utf8").includes(image), file);
});

test("sitemap URLs map to indexable source pages with matching canonicals", () => {
  const sitemap = readFileSync(`${publicRoot}/sitemap.xml`, "utf8");
  const pages = new Map([
    ["/", `${webRoot}/index.html`],
    ["/en/", `${webRoot}/en/index.html`],
    ["/zh/", `${webRoot}/zh/index.html`],
    ...["bazi", "ziwei", "liuren", "true-solar-time"].map((name) => [`/${name}/`, `${publicRoot}/${name}/index.html`]),
    ["/agent/", `${publicRoot}/agent/index.html`],
    ["/benchmark/", `${publicRoot}/benchmark/index.html`],
    ["/open-source/", `${publicRoot}/open-source/index.html`],
    ["/about/", `${publicRoot}/about/index.html`],
    ["/privacy/", `${publicRoot}/privacy/index.html`],
    ["/guide/", `${publicRoot}/guide/index.html`],
    ...[
      "bazi", "ziwei", "liuren", "solar-time", "dayun", "agent",
      "late-zi-hour", "shichen-boundary", "true-solar-time-impact",
      "ziwei-software-differences", "liuren-transmission-example", "ai-bazi-analysis"
    ].map((name) => [`/guide/${name}.html`, `${publicRoot}/guide/${name}.html`])
  ]);
  const urls = [...sitemap.matchAll(/<loc>https:\/\/astrocopy\.jackmeds\.top([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.equal(urls.length, pages.size);

  for (const [url, sourcePath] of pages) {
    assert.ok(sitemap.includes(`<loc>https://astrocopy.jackmeds.top${url}</loc>`), url);
    const source = readFileSync(sourcePath, "utf8");
    const canonicalLink = source.match(/<link\b[^>]*\brel="canonical"[^>]*>/s)?.[0] ?? "";
    assert.ok(canonicalLink.includes(`href="https://astrocopy.jackmeds.top${url}"`), url);
    assert.match(source, /<meta[^>]+name="robots"[^>]+content="index,follow/i, url);
    assert.match(source, /<meta[^>]+property="og:image"[^>]+content="https:\/\/astrocopy\.jackmeds\.top\//, url);
  }
});

test("IndexNow discovery hook is public and runs only after Pages deployment", () => {
  const key = "0c4adfe23233e4c22abff0434d0781f4";
  assert.equal(readFileSync(`${publicRoot}/${key}.txt`, "utf8").trim(), key);
  const script = readFileSync(`${repoRoot}/tools/submit-indexnow.mjs`, "utf8");
  const workflow = readFileSync(`${repoRoot}/.github/workflows/deploy-web.yml`, "utf8");
  assert.match(script, /api\.indexnow\.org\/indexnow/);
  assert.match(script, /INDEXNOW_SITEMAP_URL/);
  assert.match(script, /AbortSignal\.timeout/);
  assert.match(workflow, /Deploy to GitHub Pages[\s\S]+Notify IndexNow of current public URLs/);
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /INDEXNOW_SITEMAP_URL: https:\/\/astrocopy\.jackmeds\.top\/sitemap\.xml/);
  assert.doesNotMatch(workflow, /Generate fresh sitemap for discovery notification/);
});

test("legacy lang query links remain compatible without becoming SEO URLs", () => {
  const source = readFileSync(`${webRoot}/src/lib/i18n/index.tsx`, "utf8");
  assert.match(source, /localeFromQuery/);
  assert.match(source, /url\.searchParams\.delete\("lang"\)/);
  assert.match(source, /localizedPath\(locale\)/);
  assert.match(source, /applySeoProfile\(seoProfileFor\(locale, url\.pathname\)\)/);
  assert.match(source, /window\.history\.pushState/);
  assert.match(source, /popstate/);
});
