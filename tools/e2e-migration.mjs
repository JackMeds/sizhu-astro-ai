import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { createAstroProfile } from "@mingxu/core";

const oldOrigin = process.env.MINGXU_RECOVERY_TEST_URL || "http://127.0.0.1:4173";
const newOrigin = process.env.MINGXU_BACKUP_TEST_URL || "http://localhost:4173";
assert.notEqual(new URL(oldOrigin).origin, new URL(newOrigin).origin, "Use two origins to exercise browser isolation.");
const profile = createAstroProfile({ name: "Migration demo", gender: "female", birthDateTime: "1996-06-18T10:30:00+08:00", timezone: "Asia/Shanghai" });
const history = [{ id: "migration-demo", name: profile.input.name, generatedAt: profile.meta.generatedAt, birthDateTime: profile.input.birthDateTime, dayMaster: profile.bazi.dayMaster, pillars: profile.bazi.pillars.map(p => p.ganZhi).join(" "), profile }];
const data = {
  "sizhu-ai-history-v1": JSON.stringify(history),
  "sizhu-ai-form-draft-v1": JSON.stringify({ name: "Draft demo", gender: "female", birthDateTime: "", calendar: "solar", timezone: "Asia/Shanghai", locationName: "", longitude: "", trueSolarTime: "none", sect: 1 }),
  "sizhu-theme": "dark",
  "astrocopy-locale-v1": "en-US"
};
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
try {
  const oldPage = await context.newPage();
  await oldPage.goto(`${oldOrigin}/migration/`);
  await oldPage.evaluate(values => { localStorage.clear(); Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, value)); }, data);
  const downloadEvent = oldPage.waitForEvent("download");
  await oldPage.locator("#export").click();
  const download = await downloadEvent;
  const file = await readFile(await download.path());
  const backup = JSON.parse(file.toString());
  assert.equal(backup.origin, new URL(oldOrigin).origin);
  assert.equal(backup.data.history, data["sizhu-ai-history-v1"]);
  assert.deepEqual(await oldPage.evaluate(() => ({ ...localStorage })), data, "Recovery export must never mutate source data.");

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const requests = [];
  page.on("request", request => requests.push(request.url()));
  await page.goto(`${newOrigin}/backup/`);
  assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), {}, "Backup page must not create app defaults.");
  const upload = async (buffer) => {
    await page.locator("#backup-file").setInputFiles({ name: "demo.json", mimeType: "application/json", buffer });
    await page.locator("#import").click();
    await page.waitForFunction(() => !document.querySelector("#import").disabled);
  };
  await upload(file);
  assert.match(await page.locator("#status").innerText(), /Imported 1 records and 3 preferences/);
  assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), data);
  await upload(file);
  assert.match(await page.locator("#status").innerText(), /1 duplicates/);
  await page.evaluate(() => localStorage.setItem("sizhu-theme", "light"));
  await upload(file);
  assert.equal(await page.evaluate(() => localStorage.getItem("sizhu-theme")), "light");
  const before = await page.evaluate(() => ({ ...localStorage }));
  await upload(Buffer.from('{"broken":true}'));
  assert.match(await page.locator("#status").innerText(), /Failed/);
  assert.deepEqual(await page.evaluate(() => ({ ...localStorage })), before);
  assert.ok(requests.every(url => new URL(url).origin === new URL(newOrigin).origin), "Backup page must not upload or contact third parties.");
  await mkdir("artifacts/e2e", { recursive: true });
  for (const [width, theme] of [[1280, "light"], [390, "dark"]]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Backup page must fit mobile width.");
    await page.screenshot({ path: `artifacts/e2e/migration-${width}-${theme}.png`, fullPage: true });
  }
  await page.goto(`${newOrigin}/`);
  await page.waitForSelector("#birth");
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("sizhu-ai-history-v1")).length), 1);
  assert.equal(await page.evaluate(() => document.documentElement.lang), "en-US");
  assert.deepEqual(errors, []);
  console.log("Cross-origin recovery → import, existing preferences, duplicate/invalid import, privacy, desktop/mobile and app reload passed.");
} finally {
  await context.close();
  await browser.close();
}
