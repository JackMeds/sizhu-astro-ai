import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitemapPath = path.join(root, "apps", "web", "public", "sitemap.xml");
const endpoint = process.env.INDEXNOW_ENDPOINT || "https://api.indexnow.org/indexnow";
const key = process.env.INDEXNOW_KEY || "0c4adfe23233e4c22abff0434d0781f4";
const baseUrl = "https://astrocopy.jackmeds.top";
const retryableStatuses = new Set([403, 422, 429, 500, 502, 503, 504]);

const sitemap = await fs.readFile(sitemapPath, "utf8");
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!urlList.length) throw new Error("No URLs found in sitemap.xml");

const payload = {
  host: new URL(baseUrl).host,
  key,
  keyLocation: `${baseUrl}/${key}.txt`,
  urlList
};

for (let attempt = 1; attempt <= 3; attempt += 1) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  });

  if ([200, 202].includes(response.status)) {
    console.log(`Submitted ${urlList.length} URLs to IndexNow (${response.status}).`);
    process.exit(0);
  }

  const body = await response.text().catch(() => "");
  if (attempt < 3 && retryableStatuses.has(response.status)) {
    const delayMs = attempt * 5000;
    console.warn(`IndexNow returned ${response.status}; retrying in ${delayMs / 1000}s.`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    continue;
  }

  throw new Error(`IndexNow returned ${response.status}${body ? `: ${body.slice(0, 300)}` : ""}`);
}
