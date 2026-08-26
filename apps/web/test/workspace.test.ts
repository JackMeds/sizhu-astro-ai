import assert from "node:assert/strict";
import test from "node:test";
import type { AstroProfile } from "@sizhu/core";
import { initialWorkspaceState, workspaceReducer } from "../src/lib/workspace";

const profile = {
  input: { name: "Demo", timezone: "Asia/Shanghai" },
  bazi: { pillars: [{ ganZhi: "甲子" }, { ganZhi: "乙丑" }, { ganZhi: "丙寅" }, { ganZhi: "丁卯" }] }
} as AstroProfile;

test("human and agent actions update one shared workspace state", () => {
  const withProfile = workspaceReducer(initialWorkspaceState, {
    type: "set-profile",
    profile,
    actor: "user"
  });
  assert.equal(withProfile.profile, profile);
  assert.equal(withProfile.activities[0]?.actor, "user");

  const selected = workspaceReducer(withProfile, {
    type: "select-transit",
    date: "2029-06-15",
    actor: "agent"
  });
  assert.equal(selected.activeView, "transit");
  assert.equal(selected.selectedTransitDate, "2029-06-15");
  assert.equal(selected.activities[0]?.actor, "agent");
  assert.equal(selected.activities[0]?.type, "select-transit");
});

test("transit comparisons are unique, validated and capped at five dates", () => {
  const compared = workspaceReducer(initialWorkspaceState, {
    type: "compare-transits",
    dates: [
      "2027-01-01",
      "2029-01-01",
      "2029-01-01",
      "invalid",
      "2030-01-01",
      "2031-01-01",
      "2032-01-01",
      "2033-01-01"
    ],
    actor: "agent"
  });
  assert.deepEqual(compared.comparedTransitDates, [
    "2027-01-01",
    "2029-01-01",
    "2030-01-01",
    "2031-01-01",
    "2032-01-01"
  ]);
});

test("an activity can undo the visible selection it introduced", () => {
  const selected = workspaceReducer(initialWorkspaceState, {
    type: "select-transit",
    date: "2029-06-15",
    actor: "agent"
  });
  const activity = selected.activities[0];
  assert.ok(activity);
  const undone = workspaceReducer(selected, { type: "undo-activity", id: activity.id });
  assert.equal(undone.activeView, "overview");
  assert.equal(undone.selectedTransitDate, null);
  assert.equal(undone.activities[0]?.undone, true);
});

test("a human can pin and unpin the selected transit date", () => {
  const pinned = workspaceReducer(initialWorkspaceState, {
    type: "pin-transit",
    date: "2029-06-15",
    actor: "user"
  });
  assert.equal(pinned.activeView, "transit");
  assert.equal(pinned.selectedTransitDate, "2029-06-15");
  assert.equal(pinned.pinnedTransitDate, "2029-06-15");
  assert.equal(pinned.activities[0]?.type, "pin-transit");

  const unpinned = workspaceReducer(pinned, {
    type: "pin-transit",
    date: null,
    actor: "user"
  });
  assert.equal(unpinned.selectedTransitDate, "2029-06-15");
  assert.equal(unpinned.pinnedTransitDate, null);

  const restored = workspaceReducer(unpinned, {
    type: "undo-activity",
    id: unpinned.activities[0]?.id ?? ""
  });
  assert.equal(restored.pinnedTransitDate, "2029-06-15");
});

test("a comparison preserves a pinned date and selects it when present", () => {
  const pinned = workspaceReducer(initialWorkspaceState, {
    type: "pin-transit",
    date: "2029-06-15",
    actor: "user"
  });
  const compared = workspaceReducer(pinned, {
    type: "compare-transits",
    dates: ["2027-06-15", "2029-06-15", "2032-06-15"],
    actor: "agent"
  });
  assert.equal(compared.pinnedTransitDate, "2029-06-15");
  assert.equal(compared.selectedTransitDate, "2029-06-15");
});

test("undoing an older Agent comparison preserves newer human selection and pin state", () => {
  const compared = workspaceReducer(initialWorkspaceState, {
    type: "compare-transits",
    dates: ["2027-06-15", "2029-06-15", "2032-06-15"],
    actor: "agent"
  });
  const comparisonActivity = compared.activities.find((item) => item.type === "compare-transits");
  assert.ok(comparisonActivity);

  const selected = workspaceReducer(compared, {
    type: "select-transit",
    date: "2029-06-15",
    actor: "user"
  });
  const pinned = workspaceReducer(selected, {
    type: "pin-transit",
    date: "2029-06-15",
    actor: "user"
  });
  const undone = workspaceReducer(pinned, {
    type: "undo-activity",
    id: comparisonActivity.id
  });

  assert.deepEqual(undone.comparedTransitDates, []);
  assert.equal(undone.activeView, "transit");
  assert.equal(undone.selectedTransitDate, "2029-06-15");
  assert.equal(undone.pinnedTransitDate, "2029-06-15");
  assert.equal(undone.activities.find((item) => item.id === comparisonActivity.id)?.undone, true);
});

test("focus changes are reversible and invalid state actions are ignored", () => {
  const focused = workspaceReducer(initialWorkspaceState, {
    type: "focus-items",
    ids: ["ziwei-palace-life", "ziwei-palace-body"],
    actor: "agent"
  });
  const focusActivity = focused.activities[0];
  assert.ok(focusActivity);
  const undone = workspaceReducer(focused, { type: "undo-activity", id: focusActivity.id });
  assert.deepEqual(undone.focusedIds, []);

  const invalidSelection = workspaceReducer(undone, {
    type: "select-transit",
    date: "not-a-date",
    actor: "agent"
  });
  assert.equal(invalidSelection, undone);
  const invalidComparison = workspaceReducer(undone, {
    type: "compare-transits",
    dates: ["2029-06-15", "bad"],
    actor: "agent"
  });
  assert.equal(invalidComparison, undone);
});
