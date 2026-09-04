import assert from "node:assert/strict";
import test from "node:test";
import type { ZiweiPalace } from "@mingxu/core";
import {
  getZiweiPalaceFocusIds,
  isZiweiFocusId,
  normalizeZiweiFocusIds
} from "../src/lib/ziweiFocus";

function palace(name: string, options: Partial<ZiweiPalace> = {}) {
  return { name, isBodyPalace: false, ...options } as ZiweiPalace;
}

test("Zi Wei focus IDs identify the Life and Body palaces semantically", () => {
  assert.deepEqual(getZiweiPalaceFocusIds(palace("命宫")), ["ziwei-palace-life"]);
  assert.deepEqual(
    getZiweiPalaceFocusIds(palace("命宫", { isBodyPalace: true })),
    ["ziwei-palace-life", "ziwei-palace-body"]
  );
  assert.deepEqual(
    getZiweiPalaceFocusIds(palace("夫妻", { isBodyPalace: true })),
    ["ziwei-palace-partner", "ziwei-palace-body"]
  );
});

test("the upstream original-palace flag is not mistaken for the Life Palace", () => {
  assert.deepEqual(
    getZiweiPalaceFocusIds(palace("疾厄", { isOriginalPalace: true })),
    ["ziwei-palace-health"]
  );
});

test("focus IDs are validated, deduplicated and capped", () => {
  assert.equal(isZiweiFocusId("ziwei-palace-life"), true);
  assert.equal(isZiweiFocusId("life-palace"), false);
  assert.deepEqual(normalizeZiweiFocusIds([
    "ziwei-palace-life",
    "ziwei-palace-body",
    "ziwei-palace-life"
  ]), ["ziwei-palace-life", "ziwei-palace-body"]);
});
