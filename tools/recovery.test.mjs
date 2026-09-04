import assert from "node:assert/strict";
import test from "node:test";
import worker from "../infra/legacy-recovery/worker.mjs";
const env = (ready) => ({ NEW_SITE_READY: ready, NEW_ORIGIN: "https://mingxu.jackmeds.top", ASSETS: { fetch: async (request) => new Response(new URL(request.url).pathname) } });

test("readiness is explicit and fallback serves the retained site", async () => {
  for (const ready of [undefined, "false", "TRUE"]) {
    const response = await worker.fetch(new Request("https://astrocopy.jackmeds.top/en/?x=1"), env(ready));
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "/en/index.html");
  }
});
test("fallback resolves root and extensionless directories while retaining .html guide paths", async () => {
  const settings = { ...env("false"), ASSETS: { fetch: async request => {
    const pathname = new URL(request.url).pathname;
    return new Response(pathname, { status: ["/index.html", "/agent/index.html", "/guide/bazi.html"].includes(pathname) ? 200 : 404 });
  } } };
  for (const [input, expected] of [["/", "/index.html"], ["/agent/", "/agent/index.html"], ["/guide/bazi.html", "/guide/bazi.html"]]) {
    const response = await worker.fetch(new Request(`https://astrocopy.jackmeds.top${input}`), settings);
    assert.equal(response.status, 200);
    assert.equal(await response.text(), expected);
  }
  const response = await worker.fetch(new Request("https://astrocopy.jackmeds.top/agent?lang=en&x=1"), settings);
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("Location"), "https://astrocopy.jackmeds.top/agent/?lang=en&x=1");
  assert.equal(new URL("tools.md", response.headers.get("Location")).href, "https://astrocopy.jackmeds.top/agent/tools.md");
  assert.equal(new URL("tools.json", response.headers.get("Location")).href, "https://astrocopy.jackmeds.top/agent/tools.json");
  const missing = await worker.fetch(new Request("https://astrocopy.jackmeds.top/not-a-directory?x=1"), settings);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get("Location"), null);
});
test("ready redirect preserves paths, encoded segments and query parameters", async () => {
  const response = await worker.fetch(new Request("https://astrocopy.jackmeds.top/guide/a%20b.html?lang=en&x=%E4%B8%AD"), env("true"));
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("Location"), "https://mingxu.jackmeds.top/guide/a%20b.html?lang=en&x=%E4%B8%AD");
});
test("recovery remains on the old origin before and after readiness", async () => {
  for (const ready of ["true", "false"]) for (const path of ["/migration", "/migration/", "/migration/index.html"]) {
    const response = await worker.fetch(new Request(`https://astrocopy.jackmeds.top${path}?x=1`), env(ready));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Location"), null);
    assert.equal(await response.text(), "/migration/index.html");
  }
});
test("POST data is never redirected to a different origin", async () => {
  const response = await worker.fetch(new Request("https://astrocopy.jackmeds.top/", { method: "POST", body: "private" }), env("true"));
  assert.equal(response.status, 405);
});
test("misconfigured destination fails closed", async () => {
  const response = await worker.fetch(new Request("https://astrocopy.jackmeds.top/"), { ...env("true"), NEW_ORIGIN: "https://example.com" });
  assert.equal(response.status, 503);
});
