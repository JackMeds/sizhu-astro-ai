import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("apps/web/src/i18n");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) files.push(target);
  }
  return files;
}

function extractKeys(source) {
  const keys = new Set();
  const pattern = /^\s*(?:["']([^"']+)["']|([A-Za-z0-9_.-]+))\s*:/gm;
  for (const match of source.matchAll(pattern)) {
    const key = match[1] ?? match[2];
    if (!key || ["export", "const", "type", "interface"].includes(key)) continue;
    if (key.includes(".") || key.includes("-") || /^[a-z][A-Za-z0-9]+$/.test(key)) keys.add(key);
  }
  return keys;
}

function choose(files, locale) {
  const patterns = locale === "zh"
    ? [/(?:^|[/\\])zh-CN\.(?:ts|tsx)$/i, /(?:^|[/\\])zh\.(?:ts|tsx)$/i, /chinese/i]
    : [/(?:^|[/\\])en-US\.(?:ts|tsx)$/i, /(?:^|[/\\])en\.(?:ts|tsx)$/i, /english/i];
  for (const pattern of patterns) {
    const found = files.find((file) => pattern.test(file));
    if (found) return found;
  }
  return undefined;
}

const files = await walk(root);
const zhFile = choose(files, "zh");
const enFile = choose(files, "en");

if (!zhFile || !enFile) {
  throw new Error(`Unable to locate both locale dictionaries under ${root}. Found: ${files.join(", ")}`);
}

const [zhSource, enSource] = await Promise.all([
  readFile(zhFile, "utf8"),
  readFile(enFile, "utf8")
]);
const zhKeys = extractKeys(zhSource);
const enKeys = extractKeys(enSource);

if (zhKeys.size < 20 || enKeys.size < 20) {
  throw new Error(`Locale dictionaries look unexpectedly small: zh=${zhKeys.size}, en=${enKeys.size}`);
}

const missingEnglish = [...zhKeys].filter((key) => !enKeys.has(key)).sort();
const missingChinese = [...enKeys].filter((key) => !zhKeys.has(key)).sort();

if (missingEnglish.length || missingChinese.length) {
  const messages = [];
  if (missingEnglish.length) messages.push(`Missing in English (${missingEnglish.length}): ${missingEnglish.join(", ")}`);
  if (missingChinese.length) messages.push(`Missing in Chinese (${missingChinese.length}): ${missingChinese.join(", ")}`);
  throw new Error(messages.join("\n"));
}

console.log(`i18n dictionaries aligned: ${zhKeys.size} keys`);
console.log(`Chinese: ${path.relative(process.cwd(), zhFile)}`);
console.log(`English: ${path.relative(process.cwd(), enFile)}`);
