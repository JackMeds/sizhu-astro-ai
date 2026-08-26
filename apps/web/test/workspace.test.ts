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
