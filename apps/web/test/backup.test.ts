import assert from "node:assert/strict";
import test from "node:test";
import { createAstroProfile } from "@mingxu/core";
import { toHistoryItem } from "../src/lib/history";
import { BACKUP_KEYS, exportBackup, importBackup, type BackupStorage } from "../src/lib/backup";

class MemoryStorage implements BackupStorage {
  values = new Map<string, string>();
  failOnceOn: string | null = null;
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (key === this.failOnceOn) { this.failOnceOn = null; throw new Error("QuotaExceededError"); }
    this.values.set(key, value);
  }
  removeItem(key: string) { this.values.delete(key); }
}
const profile = createAstroProfile({ name: "Example", gender: "female", birthDateTime: "1996-06-18T10:30:00+08:00", timezone: "Asia/Shanghai" });
const item = JSON.parse(JSON.stringify(toHistoryItem(profile)));
const draft = { name: "", gender: "female", birthDateTime: "", calendar: "solar", timezone: "Asia/Shanghai", locationName: "", longitude: "", trueSolarTime: "none", sect: 1 };
const encode = (storage: MemoryStorage) => JSON.stringify(exportBackup(storage, "https://astrocopy.jackmeds.top"));
function source() {
  const storage = new MemoryStorage();
  storage.setItem(BACKUP_KEYS.history, JSON.stringify([item]));
  storage.setItem(BACKUP_KEYS.draft, JSON.stringify(draft));
  storage.setItem(BACKUP_KEYS.theme, "classical");
  storage.setItem(BACKUP_KEYS.locale, "zh-CN");
  return storage;
}

test("backup round trip preserves calculation bytes, old storage keys and incomplete drafts", () => {
  const original = source();
  const target = new MemoryStorage();
  assert.deepEqual(importBackup(target, encode(original)), { imported: 1, duplicates: 0, overflow: 0, unsupported: 0, preferences: 3 });
  assert.deepEqual(target.values, original.values);
  assert.equal(JSON.parse(target.getItem(BACKUP_KEYS.history)!)[0].profile.meta.source, "sizhu-astro-ai/core");
});

test("empty export is valid and changes nothing", () => {
  const target = source();
  const before = new Map(target.values);
  assert.equal(importBackup(target, encode(new MemoryStorage())).imported, 0);
  assert.deepEqual(target.values, before);
});

test("same ID and preferences retain existing new-site data; repeated import is idempotent", () => {
  const original = source();
  const target = source();
  target.setItem(BACKUP_KEYS.history, JSON.stringify([{ ...item, name: "New-site name" }]));
  target.setItem(BACKUP_KEYS.theme, "light");
  target.setItem(BACKUP_KEYS.locale, "en-US");
  const before = new Map(target.values);
  assert.equal(importBackup(target, encode(original)).duplicates, 1);
  importBackup(target, encode(original));
  assert.deepEqual(target.values, before);
});

test("history capacity keeps existing records first and preserves overflow in the file", () => {
  const original = source();
  original.setItem(BACKUP_KEYS.history, JSON.stringify(Array.from({ length: 15 }, (_, i) => ({ ...item, id: `old-${i}` }))));
  const target = source();
  const file = encode(original);
  const result = importBackup(target, file);
  assert.equal(result.imported, 11);
  assert.equal(result.overflow, 4);
  const records = JSON.parse(target.getItem(BACKUP_KEYS.history)!);
  assert.equal(records.length, 12);
  assert.deepEqual(records[0], item);
  assert.equal(JSON.parse(JSON.parse(file).data.history).length, 15);
});

test("corrupt JSON, future version, incomplete profiles and invalid preferences never write", () => {
  const target = source();
  const before = new Map(target.values);
  const brokenProfile = source();
  const damaged = structuredClone(item);
  (damaged.profile as any).ziwei.palaces[0].majorStars = "not an array";
  brokenProfile.setItem(BACKUP_KEYS.history, JSON.stringify([damaged]));
  const invalidPreference = source();
  invalidPreference.setItem(BACKUP_KEYS.theme, "invalid");
  for (const file of ["{", JSON.stringify({ ...exportBackup(source(), "old"), version: 2 }), encode(brokenProfile), encode(invalidPreference)]) {
    assert.throws(() => importBackup(target, file));
    assert.deepEqual(target.values, before);
  }
});

test("old engine records are exported verbatim and reported as unsupported without relabelling", () => {
  const original = source();
  const old = { ...item, profile: { ...item.profile, time: { ...item.profile.time, engine: "sizhu-time-v1" } } };
  original.setItem(BACKUP_KEYS.history, JSON.stringify([old]));
  const file = encode(original);
  const target = new MemoryStorage();
  assert.equal(importBackup(target, file).unsupported, 1);
  assert.equal(target.getItem(BACKUP_KEYS.history), null);
  assert.match(file, /sizhu-time-v1/);
});

test("quota failure rolls back earlier writes", () => {
  const target = new MemoryStorage();
  target.failOnceOn = BACKUP_KEYS.theme;
  assert.throws(() => importBackup(target, encode(source())), /QuotaExceededError/);
  assert.deepEqual([...target.values], []);
});

test("export preserves malformed local storage for manual recovery", () => {
  const storage = new MemoryStorage();
  storage.setItem(BACKUP_KEYS.history, "not JSON");
  assert.equal(exportBackup(storage, "old").data.history, "not JSON");
});

test("invalid known relation and audit fields reject the entire import without writes", () => {
  const relation = { id: "fixture-relation", kind: "fuyin", label: "Fixture", status: "observed", ruleSet: "bazi-relations-v1", participants: [{ scope: "natal", key: "day", label: "Day" }] };
  const cases: Array<[string, (profile: any) => void]> = [
    ["unknown relation kind", profile => { profile.bazi.facts.natal = [{ ...relation, kind: "broken-kind" }]; }],
    ["unknown relation status", profile => { profile.bazi.facts.natal = [{ ...relation, status: "broken-status" }]; }],
    ["unknown participant scope", profile => { profile.bazi.facts.natal = [{ ...relation, participants: [{ scope: "broken-scope", label: "Day" }] }]; }],
    ["unknown participant key", profile => { profile.bazi.facts.natal = [{ ...relation, participants: [{ scope: "natal", key: "broken-key", label: "Day" }] }]; }],
    ["broken hits array", profile => { profile.raw.traditionalRules.hits = "broken-array"; }],
    ["broken audits array", profile => { profile.raw.traditionalRules.audits = "broken-array"; }],
    ["broken audit source title", profile => { profile.raw.traditionalRules.audits[0].source.title = { broken: true }; }],
    ["broken hit text", profile => { profile.raw.traditionalRules.hits = [{ ...profile.raw.traditionalRules.audits[0], status: "matched", text: { broken: true } }]; }],
    ["broken audit conditions", profile => { profile.raw.traditionalRules.audits[0].conditions = "broken-array"; }],
    ["unknown audit status", profile => { profile.raw.traditionalRules.audits[0].status = "broken-status"; }]
  ];
  for (const [label, damage] of cases) {
    const target = source();
    const before = new Map(target.values);
    const damaged = structuredClone(item);
    damaged.id = "damaged-import";
    damage(damaged.profile);
    const incoming = source();
    incoming.setItem(BACKUP_KEYS.history, JSON.stringify([{ ...item, id: "valid-addition" }, damaged]));
    assert.throws(() => importBackup(target, encode(incoming)), undefined, label);
    assert.deepEqual(target.values, before, label);
  }
});

test("unknown extension fields survive while all known audit fields remain validated", () => {
  const extended = structuredClone(item);
  extended.profile.futureExtension = { vendor: ["unrecognized", "but opaque"] };
  extended.profile.raw.vendorExtension = { payload: { future: true } };
  extended.profile.raw.traditionalRules.vendorExtension = ["future"];
  extended.profile.raw.traditionalRules.audits[0].futureEvidence = { opaque: true };
  const incoming = source();
  incoming.setItem(BACKUP_KEYS.history, JSON.stringify([extended]));
  const target = new MemoryStorage();
  assert.equal(importBackup(target, encode(incoming)).imported, 1);
  assert.equal(target.getItem(BACKUP_KEYS.history), incoming.getItem(BACKUP_KEYS.history));
});
