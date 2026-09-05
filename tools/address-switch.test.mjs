import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, copyFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const oldDomain = "https://astrocopy.jackmeds.top";
const oldRepo = "https://github.com/JackMeds/sizhu-astro-ai";
const oldRecovery = `${oldDomain}/migration/`;
const hostnameRegex = "astrocopy\\.jackmeds\\.top";
const windowsHtml = "LOCALAPPDATA\\sizhu-astro-ai";
const windowsSource = "LOCALAPPDATA\\\\sizhu-astro-ai";
const preserved = ["sizhu-time-v2", "sizhu-astro-ai/core", "sizhu-ai-history-v1", "sizhu-ai-form-draft-v1", "sizhu-theme", "astrocopy-locale-v1", "https://mcp.jackmeds.top/mcp"];
const fixtures = {
  "README.md": [oldDomain, oldRepo, oldRecovery, ...preserved].join("\n") + "\n",
  "apps/web/public/guide/agent.html": `${oldDomain}/guide/agent.html\n${oldRepo}.git\n${windowsHtml}\n`,
  "apps/web/src/components/AgentAccessPanel.tsx": `${windowsSource}\n${oldRepo}\n`,
  "apps/web/test/discovery.test.ts": `${hostnameRegex}\n`,
  "apps/web/public/CNAME": "astrocopy.jackmeds.top\n",
  "packages/agent-tools/src/index.ts": `${oldDomain}\n${oldRepo}\n${preserved.join("\n")}\n`,
  "project-brand.json": JSON.stringify({ repo: "JackMeds/sizhu-astro-ai", links: { demo: oldDomain, source: oldRepo } }) + "\n",
  "server.json": JSON.stringify({ websiteUrl: oldDomain + "/agent/", repository: { url: oldRepo }, endpoint: preserved.at(-1) }) + "\n",
  "apps/web/public/migration/index.html": `${oldDomain}/\n${oldRepo}\n${preserved.join("\n")}\n`,
  "apps/web/backup/index.html": `${oldRecovery}\n${preserved.join("\n")}\n`,
  "packages/core/src/profile.ts": preserved.join("\n") + "\n",
  "docs/brand-proof.md": `Captured 2026-09-05 at ${oldDomain}/.\n`,
  ".gitignore": "artifacts/\n"
};
const excluded = ["apps/web/public/migration/index.html", "apps/web/backup/index.html", "packages/core/src/profile.ts", "docs/brand-proof.md"];

async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "mingxu-address-switch-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  for (const [file, content] of Object.entries(fixtures)) {
    await mkdir(path.dirname(path.join(directory, file)), { recursive: true });
    await writeFile(path.join(directory, file), content);
  }
  await mkdir(path.join(directory, "tools"), { recursive: true });
  await copyFile(new URL("./switch-public-addresses.mjs", import.meta.url), path.join(directory, "tools/switch-public-addresses.mjs"));
  execFileSync("git", ["init", "--quiet"], { cwd: directory });
  execFileSync("git", ["add", "."], { cwd: directory });
  const read = file => readFile(path.join(directory, file), "utf8");
  const run = (...args) => execFileSync(process.execPath, ["tools/switch-public-addresses.mjs", ...args], { cwd: directory, encoding: "utf8" });
  const unchanged = async () => {
    for (const [file, before] of Object.entries(fixtures)) assert.equal(await read(file), before, file);
    assert.equal(execFileSync("git", ["diff", "--name-only"], { cwd: directory, encoding: "utf8" }), "");
  };
  return { directory, read, run, unchanged };
}

test("default address check reports planned changes without writing any source", async t => {
  const { run, unchanged, read } = await fixture(t);
  const output = run();
  assert.match(output, /Would update apps\/web\/public\/guide\/agent\.html/);
  assert.match(output, /Would update apps\/web\/test\/discovery\.test\.ts/);
  for (const file of excluded) assert.ok(!output.includes(`Would update ${file}`), file);
  await unchanged();
  await assert.rejects(read("artifacts/mingxu-address-switch.patch"), { code: "ENOENT" });
});

test("patch mode is read-only and yields a valid migration patch with protected values intact", async t => {
  const { directory, run, read, unchanged } = await fixture(t);
  assert.match(run("--patch"), /working files unchanged/);
  await unchanged();
  const patch = await read("artifacts/mingxu-address-switch.patch");
  execFileSync("git", ["apply", "--check", "artifacts/mingxu-address-switch.patch"], { cwd: directory });
  for (const file of excluded) assert.ok(!patch.includes(`diff --git a/${file}`), file);
  assert.ok(patch.includes("+mingxu\\.jackmeds\\.top"));
  assert.ok(patch.includes("+LOCALAPPDATA\\mingxu"));
  assert.ok(patch.includes("+LOCALAPPDATA\\\\mingxu"));
  assert.ok(patch.includes(`+${oldRecovery}`));
  for (const value of preserved) assert.ok(patch.includes(`+${value}`), value);
});

test("write mode migrates both Windows source forms, URLs and regexes and is idempotent", async t => {
  const { run, read } = await fixture(t);
  assert.match(run("--write"), /Updated apps\/web\/public\/guide\/agent\.html/);
  const main = await read("README.md");
  assert.ok(main.includes("https://mingxu.jackmeds.top"));
  assert.ok(main.includes("https://github.com/JackMeds/mingxu"));
  assert.ok(main.includes(oldRecovery));
  for (const value of preserved) assert.ok(main.includes(value), value);
  assert.equal(await read("apps/web/public/CNAME"), "mingxu.jackmeds.top\n");
  assert.equal(await read("apps/web/test/discovery.test.ts"), "mingxu\\.jackmeds\\.top\n");
  assert.ok((await read("apps/web/public/guide/agent.html")).includes("LOCALAPPDATA\\mingxu"));
  assert.ok((await read("apps/web/src/components/AgentAccessPanel.tsx")).includes("LOCALAPPDATA\\\\mingxu"));
  const manifest = JSON.parse(await read("project-brand.json"));
  assert.equal(manifest.repo, "JackMeds/mingxu");
  assert.equal(manifest.links.demo, "https://mingxu.jackmeds.top");
  const server = JSON.parse(await read("server.json"));
  assert.equal(server.websiteUrl, "https://mingxu.jackmeds.top/agent/");
  assert.equal(server.repository.url, "https://github.com/JackMeds/mingxu");
  assert.equal(server.endpoint, "https://mcp.jackmeds.top/mcp");
  for (const file of excluded) assert.equal(await read(file), fixtures[file], file);
  const after = await Promise.all(Object.keys(fixtures).map(read));
  assert.match(run("--write"), /^0 address files\./);
  assert.deepEqual(await Promise.all(Object.keys(fixtures).map(read)), after);
});
