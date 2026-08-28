import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { BRAND_MARK_ASSETS, getBrandMarkSource } from "../src/lib/brand";

const publicRoot = fileURLToPath(new URL("../public/", import.meta.url));
const appEntry = fileURLToPath(new URL("../index.html", import.meta.url));

function htmlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

test("brand assets map the classical and modern themes to the supplied seals", () => {
  assert.equal(getBrandMarkSource("dark"), "/brand/mark-dark.png");
  assert.equal(getBrandMarkSource("light"), "/brand/mark-light.png");
  assert.deepEqual(BRAND_MARK_ASSETS, {
    dark: "/brand/mark-dark.png",
    light: "/brand/mark-light.png"
  });
});

test("all static HTML pages expose both theme-aware favicon assets and the new brand", () => {
  const pages = htmlFiles(publicRoot);
  assert.ok(pages.length > 0);

  for (const page of pages) {
    const source = readFileSync(page, "utf8");
    assert.match(source, /mark-dark\.png/, page);
    assert.match(source, /mark-light\.png/, page);
    assert.doesNotMatch(source, /四柱星盘 AI/, page);
    assert.doesNotMatch(source, /<title>AstroCopy\b/i, page);
  }
});

test("the React entry keeps the localized SEO title and dynamic favicon hook", () => {
  const source = readFileSync(appEntry, "utf8");
  assert.match(source, /<title>命序｜AI 八字排盘、五行分析与命盘可视化<\/title>/);
  assert.match(source, /data-brand-favicon/);
  assert.match(source, /"name": "命序"/);
  assert.match(source, /"alternateName": \["MingXu", "AstroCopy"\]/);
});

test("the supplied seal files are present as non-empty PNG assets", () => {
  for (const relativePath of ["brand/mark-dark.png", "brand/mark-light.png"]) {
    const assetPath = `${publicRoot}/${relativePath}`;
    assert.ok(statSync(assetPath).size > 100, assetPath);
    assert.equal(readFileSync(assetPath).subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  }
});
