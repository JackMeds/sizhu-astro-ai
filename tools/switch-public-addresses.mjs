import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Deliberate second delivery unit. Default is read-only; --write makes a bulk
// mechanical address rewrite for a separately reviewed dependent branch.
const root = fileURLToPath(new URL("../", import.meta.url));
const write = process.argv.includes("--write");
const patchMode = process.argv.includes("--patch");
if (write && patchMode) throw new Error("Choose either --write or --patch.");
const patches = [];
const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
const selected = files.filter((file) =>
  (/^README(?:\.zh-CN)?\.md$/.test(file) || file === "server.json" || file === "project-brand.json" ||
   file === "tools/generate-sitemap.mjs" || file === "packages/agent-tools/src/index.ts" || file === "docs/search-console.md" || file === "docs/technical-overview.md" ||
   file.startsWith("apps/web/")) &&
  !file.startsWith("apps/web/public/migration/") &&
  file !== "docs/brand-proof.md" &&
  !file.includes("/backup") && !file.includes("/assets/") &&
  /\.(?:md|json|html|ts|tsx|txt|xml|mjs)$|\/CNAME$/.test(file));
let changed = 0;
for (const file of selected) {
  const url = new URL(file, new URL("../", import.meta.url));
  const before = await readFile(url, "utf8");
  const after = before
    .replaceAll("https://astrocopy.jackmeds.top/migration/", "__MINGXU_OLD_RECOVERY__")
    .replaceAll("astrocopy.jackmeds.top", "mingxu.jackmeds.top")
    .replaceAll("astrocopy\\.jackmeds\\.top", "mingxu\\.jackmeds\\.top")
    .replaceAll("__MINGXU_OLD_RECOVERY__", "https://astrocopy.jackmeds.top/migration/")
    .replaceAll("github.com/JackMeds/sizhu-astro-ai", "github.com/JackMeds/mingxu")
    .replaceAll("JackMeds/sizhu-astro-ai", "JackMeds/mingxu")
    .replaceAll("/ABSOLUTE/PATH/TO/sizhu-astro-ai", "/ABSOLUTE/PATH/TO/mingxu")
    .replaceAll(".local/share/sizhu-astro-ai", ".local/share/mingxu")
    .replaceAll("LOCALAPPDATA\\\\sizhu-astro-ai", "LOCALAPPDATA\\\\mingxu")
    .replaceAll("cd sizhu-astro-ai", "cd mingxu");
  if (before !== after) {
    changed++;
    console.log(`${write ? "Updated" : "Would update"} ${file}`);
    if (write) await writeFile(url, after);
    if (patchMode) {
      const lines = value => value.replace(/\n$/, "").split("\n");
      const oldLines = lines(before);
      const newLines = lines(after);
      patches.push([
        `diff --git a/${file} b/${file}`,
        `--- a/${file}`, `+++ b/${file}`,
        `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
        ...oldLines.map(line => `-${line}`),
        ...(before.endsWith("\n") ? [] : ["\\ No newline at end of file"]),
        ...newLines.map(line => `+${line}`),
        ...(after.endsWith("\n") ? [] : ["\\ No newline at end of file"]),
        ""
      ].join("\n"));
    }
  }
}
if (patchMode) {
  await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
  await writeFile(new URL("../artifacts/mingxu-address-switch.patch", import.meta.url), patches.join(""));
  console.log("Generated artifacts/mingxu-address-switch.patch; working files unchanged.");
}
console.log(`${changed} address files. No repository rename, DNS, deployment or readiness change performed.`);
