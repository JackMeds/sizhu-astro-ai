import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.ASTROCOPY_E2E_URL || "http://127.0.0.1:4173";
const webMcpInjectionDelayMs = Number(process.env.ASTROCOPY_WEBMCP_INJECTION_DELAY_MS ?? 2_500);
if (!Number.isFinite(webMcpInjectionDelayMs) || webMcpInjectionDelayMs < 0) {
  throw new Error(`ASTROCOPY_WEBMCP_INJECTION_DELAY_MS must be a non-negative number, received ${process.env.ASTROCOPY_WEBMCP_INJECTION_DELAY_MS}`);
}
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

await page.addInitScript(({ injectionDelayMs }) => {
  const tools = new Map();
  const telemetry = {
    scheduledAt: performance.now(),
    injectedAt: null,
    registrations: [],
    aborts: []
  };
  const registerTool = (tool, options = {}) => {
    tools.set(tool.name, tool);
    telemetry.registrations.push({ name: tool.name, title: tool.title ?? null });
    const unregister = () => {
      telemetry.aborts.push(tool.name);
      if (tools.get(tool.name) === tool) tools.delete(tool.name);
    };
    options.signal?.addEventListener?.("abort", unregister, { once: true });
    return unregister;
  };

  Object.defineProperty(window, "__astrocopyTools", {
    configurable: true,
    value: tools
  });
  Object.defineProperty(window, "__astrocopyWebMcpTelemetry", {
    configurable: true,
    value: telemetry
  });

  window.setTimeout(() => {
    telemetry.injectedAt = performance.now();
    Object.defineProperty(document, "modelContext", {
      configurable: true,
      value: { registerTool }
    });
    Object.defineProperty(navigator, "modelContext", {
      configurable: true,
      value: { registerTool }
    });
  }, injectionDelayMs);
}, { injectionDelayMs: webMcpInjectionDelayMs });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function toolNames() {
  return page.evaluate(() => [...window.__astrocopyTools.keys()]);
}

async function toolDescriptors() {
  return page.evaluate(() => [...window.__astrocopyTools.values()].map(({ name, title }) => ({ name, title })));
}

async function registrationTelemetry() {
  return page.evaluate(() => window.__astrocopyWebMcpTelemetry);
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

function parseToolJson(result) {
  const textContent = result?.content?.find((item) => item?.type === "text")?.text;
  if (typeof textContent !== "string") throw new Error("Tool result did not include text content");
  return JSON.parse(textContent);
}

try {
  await page.goto(`${baseUrl}/?lang=en`, { waitUntil: "networkidle" });
  await waitForTools(foundationalTools, true);

  const initialNames = await toolNames();
  const injectionElapsedMs = await page.evaluate(() => {
    const telemetry = window.__astrocopyWebMcpTelemetry;
    return telemetry.injectedAt - telemetry.scheduledAt;
  });
  assert(
    injectionElapsedMs >= webMcpInjectionDelayMs - 50,
    `WebMCP was injected too early: expected about ${webMcpInjectionDelayMs}ms, received ${injectionElapsedMs}ms`
  );
  for (const expected of foundationalTools) {
    assert(initialNames.includes(expected), `Missing foundational WebMCP tool ${expected}. Registered: ${initialNames.join(", ")}`);
  }
  for (const descriptor of await toolDescriptors()) {
    assert(descriptor.title, `WebMCP tool ${descriptor.name} lost its human-readable title`);
  }
  const initialTelemetry = await registrationTelemetry();
  for (const expected of foundationalTools) {
    assert(
      initialTelemetry.registrations.filter(({ name }) => name === expected).length === 1,
      `Foundational tool ${expected} registered more than once in the production lifecycle`
    );
  }
  assert(initialTelemetry.aborts.length === 0, "Foundational WebMCP tools aborted before the workspace changed");
  for (const unavailable of chartTools) {
    assert(!initialNames.includes(unavailable), `Chart-only tool registered before a chart existed: ${unavailable}`);
  }

  const htmlLanguage = await page.locator("html").getAttribute("lang");
  assert(htmlLanguage?.toLowerCase().startsWith("en"), `Expected English html lang, received ${htmlLanguage}`);
  assert((await page.title()).toLowerCase().includes("mingxu"), "English page title does not contain MingXu");

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
  for (const descriptor of await toolDescriptors()) {
    assert(descriptor.title, `WebMCP tool ${descriptor.name} lost its human-readable title`);
  }
  const chartTelemetry = await registrationTelemetry();
  for (const expected of [...foundationalTools, ...chartTools]) {
    assert(
      chartTelemetry.registrations.filter(({ name }) => name === expected).length === 1,
      `WebMCP tool ${expected} registered more than once in the production lifecycle`
    );
  }
  assert(chartTelemetry.aborts.length === 0, "WebMCP tools aborted during the empty-to-chart transition");
  const chartText = await page.locator("body").innerText();
  assert(chartText.includes("Alex Demo"), "Created profile is not visible in the page");
  const readyText = await page.locator(".result-ready-card").innerText();
  assert(readyText.includes("The chart has been computed."), "English result-ready title is missing");
  assert(!readyText.includes("命盘已经算好了"), "English result-ready card still contains its hard-coded Chinese title");
  const resultTabsText = await page.locator(".progressive-tab-list").innerText();
  for (const label of ["Overview", "BaZi", "Zi Wei", "Transits", "Audit"]) {
    assert(resultTabsText.includes(label), `English result tab is missing: ${label}`);
  }
  assert(!resultTabsText.includes("概览"), "English result tabs still contain hard-coded Chinese controls");

  const transitResult = await callTool("astrocopy.inspect_transit", { targetDate: "2028-06-15" });
  assert(transitResult?.isError !== true, "Valid inspect_transit call failed");
  await page.locator("#transit-inspector input[type='date']").waitFor({ state: "visible", timeout: 15_000 });
  assert(
    await page.locator("#transit-inspector input[type='date']").inputValue() === "2028-06-15",
    "inspect_transit did not select the requested visible date"
  );
  assert(
    (await page.locator("#transit-inspector").innerText()).includes("Linked target date"),
    "English transit workspace title is missing"
  );

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
  const ziweiText = await page.locator(".ziwei-custom-plate").innerText();
  assert(ziweiText.includes("Zi Wei Dou Shu · Twelve Palaces"), "English Zi Wei title is missing");
  assert(!ziweiText.includes("紫微斗数十二宫\n"), "English Zi Wei panel still uses its hard-coded Chinese heading");

  const legacyCompareResult = await callTool("astrocopy.compare_transits", {
    dates: ["2027-06-15", "2029-06-15", "2032-06-15"]
  });
  assert(legacyCompareResult?.isError === true, "Legacy dates input must not be accepted as the compare contract");

  const compareResult = await callTool("astrocopy.compare_transits", {
    targetDates: ["2027-06-15", "2029-06-15", "2032-06-15"]
  });
  assert(compareResult?.isError !== true, "Canonical targetDates comparison failed");
  await page.waitForFunction(() => document.querySelectorAll(".transit-comparison-card").length === 3);

  const humanDateCard = page.locator(".transit-comparison-card[data-date='2029-06-15']");
  await humanDateCard.locator("[data-action='select-transit']").click();
  await page.locator(".transit-comparison-card[data-date='2029-06-15'][data-selected='true']").waitFor();
  await humanDateCard.locator("[data-action='pin-transit']").click();
  await page.locator(".transit-pinned-summary[data-pinned-transit='2029-06-15']").waitFor();

  const workspace = parseToolJson(await callTool("astrocopy.get_workspace_state"));
  const serialized = JSON.stringify(workspace);
  for (const date of ["2027-06-15", "2029-06-15", "2032-06-15"]) {
    assert(serialized.includes(date), `Workspace state does not include compared date ${date}`);
  }
  for (const focusId of ["ziwei-palace-life", "ziwei-palace-body"]) {
    assert(serialized.includes(focusId), `Workspace state does not include focused ID ${focusId}`);
  }
  assert(workspace.selectedTransitDate === "2029-06-15", "Workspace did not read the human-selected date");
  assert(workspace.pinnedTransitDate === "2029-06-15", "Workspace did not read the human-pinned date");
  assert(workspace.recentActivities?.length <= 6, "Workspace returned more than six recent activities");
  assert(
    workspace.recentActivities?.some((activity) => activity.actor === "user" && activity.type === "pin-transit" && activity.detail === "2029-06-15"),
    "Workspace did not expose the recent human pin activity"
  );

  await page.locator("#transit-inspector").screenshot({
    path: path.join(outputDirectory, "webmcp-human-pin.png")
  });
  await page.screenshot({
    path: path.join(outputDirectory, "webmcp-shared-workspace.png"),
    fullPage: true
  });

  const stateBeforeInvalidCalls = JSON.stringify({
    activeView: workspace.activeView,
    selectedTransitDate: workspace.selectedTransitDate,
    pinnedTransitDate: workspace.pinnedTransitDate,
    comparedTransitDates: workspace.comparedTransitDates,
    focusedIds: workspace.focusedIds,
    recentActivities: workspace.recentActivities
  });
  for (const [name, input] of [
    ["astrocopy.create_birth_chart", { birthDateTime: "" }],
    ["astrocopy.inspect_chart", { view: "unknown" }],
    ["astrocopy.inspect_chart", { view: "ziwei", focusIds: ["unknown-focus"] }],
    ["astrocopy.inspect_transit", { targetDate: "2029/06/15" }],
    ["astrocopy.compare_transits", { targetDates: ["2029-06-15"] }],
    ["astrocopy.compare_transits", { targetDates: ["2029-06-15", "2029-06-15"] }]
  ]) {
    const result = await callTool(name, input);
    assert(result?.isError === true, `${name} did not normalize invalid input to isError: true`);
  }
  const stateAfterInvalidCalls = parseToolJson(await callTool("astrocopy.get_workspace_state"));
  assert(
    JSON.stringify({
      activeView: stateAfterInvalidCalls.activeView,
      selectedTransitDate: stateAfterInvalidCalls.selectedTransitDate,
      pinnedTransitDate: stateAfterInvalidCalls.pinnedTransitDate,
      comparedTransitDates: stateAfterInvalidCalls.comparedTransitDates,
      focusedIds: stateAfterInvalidCalls.focusedIds,
      recentActivities: stateAfterInvalidCalls.recentActivities
    }) === stateBeforeInvalidCalls,
    "Invalid tool inputs changed the shared workspace state"
  );

  const comparisonUndo = page.locator("[data-activity-type='compare-transits'] [data-action='undo-activity']");
  await comparisonUndo.click();
  await page.waitForFunction(() => document.querySelectorAll(".transit-comparison-card").length === 0);
  const stateAfterUndo = parseToolJson(await callTool("astrocopy.get_workspace_state"));
  assert(stateAfterUndo.comparedTransitDates.length === 0, "Undo did not restore the previous comparison set");
  assert(stateAfterUndo.selectedTransitDate === "2029-06-15", "Undo clobbered the newer human selection");
  assert(stateAfterUndo.pinnedTransitDate === "2029-06-15", "Undo clobbered the newer human pin");
  assert(
    stateAfterUndo.recentActivities?.some((activity) => activity.type === "compare-transits" && activity.undone === true),
    "Workspace state did not expose the undone comparison activity"
  );

  const auditResult = await callTool("astrocopy.inspect_chart", { view: "audit" });
  assert(auditResult?.isError !== true, "Valid audit view call failed");
  await page.locator(".engine-audit").waitFor({ state: "visible", timeout: 15_000 });
  assert(
    (await page.locator(".engine-audit").innerText()).includes("Calculation evidence and uncertainty"),
    "English calculation-audit title is missing"
  );

  for (const scenario of [
    {
      name: "New York DST",
      birthDateTime: "1996-07-01T10:30:00",
      timezone: "America/New_York",
      expectedOffsetMinutes: -240
    },
    {
      name: "Kolkata Half Hour",
      birthDateTime: "1996-07-01T10:30:00",
      timezone: "Asia/Kolkata",
      expectedOffsetMinutes: 330
    },
    {
      name: "Kathmandu Quarter Hour",
      birthDateTime: "1996-07-01T10:30:00",
      timezone: "Asia/Kathmandu",
      expectedOffsetMinutes: 345
    }
  ]) {
    const result = await callTool("astrocopy.create_birth_chart", {
      name: scenario.name,
      gender: "female",
      birthDateTime: scenario.birthDateTime,
      calendar: "solar",
      timezone: scenario.timezone,
      trueSolarTime: "none",
      sect: 1
    });
    assert(result?.isError !== true, `International chart failed for ${scenario.timezone}`);
    const payload = parseToolJson(result);
    assert(payload.chart?.timezone === scenario.timezone, `Tool result lost timezone ${scenario.timezone}`);
    assert(
      payload.chart?.timezoneOffsetMinutes === scenario.expectedOffsetMinutes,
      `Expected ${scenario.expectedOffsetMinutes} minutes for ${scenario.timezone}, received ${payload.chart?.timezoneOffsetMinutes}`
    );
    await page.waitForFunction((name) => document.body.innerText.includes(name), scenario.name);
  }

  const dstGapResult = await callTool("astrocopy.create_birth_chart", {
    name: "Invalid DST Gap",
    gender: "female",
    birthDateTime: "2026-03-08T02:30:00",
    calendar: "solar",
    timezone: "America/New_York",
    trueSolarTime: "none",
    sect: 1
  });
  assert(dstGapResult?.isError === true, "Nonexistent New York DST wall time was not rejected");
  const stateAfterDstGap = parseToolJson(await callTool("astrocopy.get_workspace_state"));
  assert(stateAfterDstGap.chart?.name === "Kathmandu Quarter Hour", "Rejected DST gap corrupted the current chart");

  console.log(`WebMCP smoke test passed with ${names.length} registered tools after ${Math.round(injectionElapsedMs)}ms delayed injection.`);
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
