import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.ASTROCOPY_E2E_URL || "http://127.0.0.1:4173";
const outputDirectory = path.resolve("artifacts/e2e");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

await page.addInitScript(() => {
  const tools = new Map();
  const registerTool = (tool, options = {}) => {
    tools.set(tool.name, tool);
    const unregister = () => tools.delete(tool.name);
    options.signal?.addEventListener?.("abort", unregister, { once: true });
    return unregister;
  };

  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: { registerTool }
  });
  Object.defineProperty(navigator, "modelContext", {
    configurable: true,
    value: { registerTool }
  });
  Object.defineProperty(window, "__astrocopyTools", {
    configurable: true,
    value: tools
  });
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function toolNames() {
  return page.evaluate(() => [...window.__astrocopyTools.keys()]);
}

async function callTool(name, input = {}) {
  return page.evaluate(async ({ name, input }) => {
    const tool = window.__astrocopyTools.get(name);
    if (!tool) throw new Error(`Tool not registered: ${name}`);
    const handler = tool.execute ?? tool.handler ?? tool.run;
    if (typeof handler !== "function") throw new Error(`Tool has no executable handler: ${name}`);
    return handler(input);
  }, { name, input });
}

try {
  await page.goto(`${baseUrl}/?lang=en`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__astrocopyTools?.size >= 5, null, { timeout: 15_000 });

  const names = await toolNames();
  for (const expected of [
    "astrocopy.create_birth_chart",
    "astrocopy.inspect_chart",
    "astrocopy.inspect_transit",
    "astrocopy.compare_transits",
    "astrocopy.get_workspace_state"
  ]) {
    assert(names.includes(expected), `Missing WebMCP tool ${expected}. Registered: ${names.join(", ")}`);
  }

  const htmlLanguage = await page.locator("html").getAttribute("lang");
  assert(htmlLanguage?.toLowerCase().startsWith("en"), `Expected English html lang, received ${htmlLanguage}`);
  assert((await page.title()).toLowerCase().includes("astrocopy"), "English page title does not contain AstroCopy");

  await callTool("astrocopy.create_birth_chart", {
    name: "Alex Demo",
    gender: "female",
    birthDateTime: "1996-06-18T10:30:00+08:00",
    calendar: "solar",
    timezone: "Asia/Shanghai",
    trueSolarTime: "none",
    sect: 1
  });

  await page.locator("#profile-result").waitFor({ state: "visible", timeout: 15_000 });
  const chartText = await page.locator("body").innerText();
  assert(chartText.includes("Alex Demo"), "Created profile is not visible in the page");

  await callTool("astrocopy.inspect_chart", { view: "ziwei", focus: ["life-palace", "body-palace"] });

  await callTool("astrocopy.compare_transits", {
    dates: ["2027-06-15", "2029-06-15", "2032-06-15"]
  });

  const workspace = await callTool("astrocopy.get_workspace_state");
  const serialized = JSON.stringify(workspace);
  for (const date of ["2027-06-15", "2029-06-15", "2032-06-15"]) {
    assert(serialized.includes(date), `Workspace state does not include compared date ${date}`);
  }

  await page.screenshot({
    path: path.join(outputDirectory, "webmcp-shared-workspace.png"),
    fullPage: true
  });

  console.log(`WebMCP smoke test passed with ${names.length} registered tools.`);
  console.log(`Registered: ${names.join(", ")}`);
} finally {
  await browser.close();
}
