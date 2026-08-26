import assert from "node:assert/strict";
import test from "node:test";
import { getTranslationKeys } from "../src/lib/i18n";

test("Chinese and English dictionaries expose the same translation keys", () => {
  assert.deepEqual(getTranslationKeys("zh-CN"), getTranslationKeys("en-US"));
});
