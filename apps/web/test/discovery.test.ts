import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));
const webRoot = fileURLToPath(new URL("../", import.meta.url));

test("SEO discovery infrastructure exposes the Agent page and canonical links", () => {
  const home = readFileSync(`${publicRoot}/../index.html`, "utf8");
  const agent = readFileSync(`${publicRoot}/agent/index.html`, "utf8");
  const robots = readFileSync(`${publicRoot}/robots.txt`, "utf8");
  const sitemap = readFileSync(`${publicRoot}/sitemap.xml`, "utf8");

  for (const path of ["/bazi/", "/ziwei/", "/liuren/", "/true-solar-time/"]) assert.match(home, new RegExp(`href=\\"${path.replaceAll("/", "\\/")}\\"`));
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
    assert.match(source, new RegExp(`<link rel="canonical" href="${canonical.replaceAll("/", "\\/")}"`));
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
    assert.match(root, new RegExp(hreflang.replaceAll("/", "\\/")));
    assert.match(zh, new RegExp(hreflang.replaceAll("/", "\\/")));
    assert.match(en, new RegExp(hreflang.replaceAll("/", "\\/")));
  }
});

test("sitemap URLs map to indexable source pages with matching canonicals", () => {
  const sitemap = readFileSync(`${publicRoot}/sitemap.xml`, "utf8");
  const pages = new Map([
    ["/", `${webRoot}/index.html`],
    ["/en/", `${webRoot}/en/index.html`],
    ["/zh/", `${webRoot}/zh/index.html`],
    ...["bazi", "ziwei", "liuren", "true-solar-time"].map((name) => [`/${name}/`, `${publicRoot}/${name}/index.html`]),
    ["/agent/", `${publicRoot}/agent/index.html`],
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

test("legacy lang query links remain compatible without becoming SEO URLs", () => {
  const source = readFileSync(`${webRoot}/src/lib/i18n/index.tsx`, "utf8");
  assert.match(source, /localeFromQuery/);
  assert.match(source, /url\.searchParams\.delete\("lang"\)/);
  assert.match(source, /localizedPath\(locale\)/);
});
