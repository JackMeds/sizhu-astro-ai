import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.ASTROCOPY_E2E_URL || "http://127.0.0.1:4173";
const outputDirectory = path.resolve("artifacts/e2e");
const foundationalTools = [
  "astrocopy.about",
  "astrocopy.create_birth_chart",
  "astrocopy.get_workspace_state"
];
const chartTools = [
  "astrocopy.inspect_chart",
  "astrocopy.inspect_transit",
  "astrocopy.compare_transits"
];
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

async function waitForTools(expected, exact = false) {
  await page.waitForFunction(({ names, exactMatch }) => {
    const registered = window.__astrocopyTools;
    if (!registered || !names.every((name) => registered.has(name))) return false;
    return !exactMatch || registered.size === names.length;
  }, { names: expected, exactMatch: exact }, { timeout: 15_000 });
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
  await waitForTools(foundationalTools, true);

  const initialNames = await toolNames();
  for (const expected of foundationalTools) {
    assert(initialNames.includes(expected), `Missing foundational WebMCP tool ${expected}. Registered: ${initialNames.join(", ")}`);
  }
  for (const unavailable of chartTools) {
    assert(!initialNames.includes(unavailable), `Chart-only tool registered before a chart existed: ${unavailable}`);
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
  await waitForTools([...foundationalTools, ...chartTools], true);
  const names = await toolNames();
  for (const expected of [...foundationalTools, ...chartTools]) {
    assert(names.includes(expected), `Missing WebMCP tool ${expected} after chart creation. Registered: ${names.join(", ")}`);
  }
  const chartText = await page.locator("body").innerText();
  assert(chartText.includes("Alex Demo"), "Created profile is not visible in the page");

  const inspectResult = await callTool("astrocopy.inspect_chart", {
    view: "ziwei",
    focusIds: ["ziwei-palace-life", "ziwei-palace-body"]
  });
  const serializedInspectResult = JSON.stringify(inspectResult);
  assert(serializedInspectResult.includes("ziwei-palace-life"), "Inspect result omitted the Life Palace focus ID");
  assert(serializedInspectResult.includes("ziwei-palace-body"), "Inspect result omitted the Body Palace focus ID");
  const lifePalace = page.locator("[data-focus-ids~='ziwei-palace-life'][data-agent-focused='true']");
  const bodyPalace = page.locator("[data-focus-ids~='ziwei-palace-body'][data-agent-focused='true']");
  await lifePalace.waitFor({ state: "visible", timeout: 15_000 });
  await bodyPalace.waitFor({ state: "visible", timeout: 15_000 });
  assert(
    (await lifePalace.innerText()).includes("命宫"),
    "The semantic Life Palace focus target does not point to 命宫"
  );
  assert(
    await bodyPalace.getAttribute("data-body-palace") === "true",
    "The semantic Body Palace focus target does not point to the body palace"
  );
  await page.locator(".ziwei-custom-plate").screenshot({
    path: path.join(outputDirectory, "webmcp-ziwei-focus.png")
  });

  const legacyCompareResult = await callTool("astrocopy.compare_transits", {
    dates: ["2027-06-15", "2029-06-15", "2032-06-15"]
  });
  assert(legacyCompareResult?.isError === true, "Legacy dates input must not be accepted as the compare contract");

  await callTool("astrocopy.compare_transits", {
    targetDates: ["2027-06-15", "2029-06-15", "2032-06-15"]
  });

  const workspace = await callTool("astrocopy.get_workspace_state");
  const serialized = JSON.stringify(workspace);
  for (const date of ["2027-06-15", "2029-06-15", "2032-06-15"]) {
    assert(serialized.includes(date), `Workspace state does not include compared date ${date}`);
  }
  for (const focusId of ["ziwei-palace-life", "ziwei-palace-body"]) {
    assert(serialized.includes(focusId), `Workspace state does not include focused ID ${focusId}`);
  }

  await page.screenshot({
    path: path.join(outputDirectory, "webmcp-shared-workspace.png"),
    fullPage: true
  });

  console.log(`WebMCP smoke test passed with ${names.length} registered tools.`);
  console.log(`Registered: ${names.join(", ")}`);
} catch (error) {
  await page.screenshot({
    path: path.join(outputDirectory, "webmcp-failure.png"),
    fullPage: true
  }).catch(() => undefined);
  const registered = await toolNames().catch(() => []);
  console.error(`Registered at failure: ${registered.join(", ") || "none"}`);
  throw error;
} finally {
  await browser.close();
}
