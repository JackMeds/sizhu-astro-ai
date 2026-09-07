import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitemapPath = path.join(root, "apps", "web", "public", "sitemap.xml");
const sitemapUrl = process.env.INDEXNOW_SITEMAP_URL;
const endpoint = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";
const key = process.env.INDEXNOW_KEY || "0c4adfe23233e4c22abff0434d0781f4";
const baseUrl = "https://astrocopy.jackmeds.top";
const retryableStatuses = new Set([403, 422, 429, 500, 502, 503, 504]);

const timeoutMs = Number(process.env.INDEXNOW_TIMEOUT_MS || 10000);
const sitemap = sitemapUrl
  ? await fetch(sitemapUrl, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error(`Deployed sitemap returned ${response.status}`);
      return response.text();
    })
  : await fs.readFile(sitemapPath, "utf8");
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!urlList.length) throw new Error("No URLs found in sitemap.xml");
if (urlList.some((url) => new URL(url).host !== new URL(baseUrl).host)) {
  throw new Error("Sitemap contains URLs for a different host");
}

const payload = {
  host: new URL(baseUrl).host,
  key,
  keyLocation: `${baseUrl}/${key}.txt`,
  urlList
};

async function writeSummary(message) {
  if (process.env.GITHUB_STEP_SUMMARY) {
    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${message}\n`, "utf8");
  }
}

let acceptedStatus = null;
for (let attempt = 1; attempt <= 3; attempt += 1) {
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (error) {
    if (attempt < 3) {
      const delayMs = attempt * 3000;
      console.warn(`IndexNow request failed; retrying in ${delayMs / 1000}s.`, error instanceof Error ? error.message : error);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }
    await writeSummary(`- ❌ IndexNow failed after ${attempt} attempts: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }

  if ([200, 202].includes(response.status)) {
    acceptedStatus = response.status;
    break;
  }

  const body = await response.text().catch(() => "");
  if (attempt < 3 && retryableStatuses.has(response.status)) {
    const delayMs = attempt * 3000;
    console.warn(`IndexNow returned ${response.status}; retrying in ${delayMs / 1000}s.`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    continue;
  }

  const message = `IndexNow returned ${response.status}${body ? `: ${body.slice(0, 300)}` : ""}`;
  await writeSummary(`- ❌ ${message}`);
  throw new Error(message);
}

console.log(`Submitted ${urlList.length} deployed URLs to IndexNow (${acceptedStatus}).`);
await writeSummary(`- ✅ IndexNow accepted ${urlList.length} deployed URLs with HTTP ${acceptedStatus}. This is a discovery notification, not proof of indexing.`);
