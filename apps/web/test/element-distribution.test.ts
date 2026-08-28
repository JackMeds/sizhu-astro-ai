import assert from "node:assert/strict";
import test from "node:test";
import { buildElementDistribution } from "../src/lib/elementDistribution";

test("five-phase percentages are exact and preserve the existing counts", () => {
  const rows = buildElementDistribution({ 木: 2, 火: 5, 土: 4, 金: 4, 水: 0 });
  assert.deepEqual(rows.map((row) => row.value), [2, 5, 4, 4, 0]);
  assert.deepEqual(rows.map((row) => Number(row.percentage.toFixed(1))), [13.3, 33.3, 26.7, 26.7, 0]);
  assert.equal(rows.reduce((sum, row) => sum + row.percentage, 0), 100);
});

test("zero or missing values render as identifiable empty tracks", () => {
  const rows = buildElementDistribution({ 木: 0, 火: 0 });
  assert.equal(rows.length, 5);
  assert.ok(rows.every((row) => row.value === 0 && row.percentage === 0));
});

test("negative counts are clamped for display without mutating source data", () => {
  const counts = { 木: -1, 火: 3 };
  const rows = buildElementDistribution(counts);
  assert.deepEqual(rows.map((row) => row.value), [0, 3, 0, 0, 0]);
  assert.equal(counts.木, -1);
});
