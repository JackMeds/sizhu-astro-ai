import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));

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
