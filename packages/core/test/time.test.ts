import assert from "node:assert/strict";
import test from "node:test";
import {
  createTimeProfile,
  getTimeZoneOffsetMinutes,
  zonedLocalDateTimeToOffset,
  type AstroInput
} from "../src/index.js";

const baseInput: AstroInput = {
  name: "timezone-test",
  gender: "male",
  birthDateTime: "2026-01-15T10:30:00",
  calendar: "solar",
  timezone: "Asia/Shanghai",
  trueSolarTime: "none",
  sect: 1
};

test("formats local wall time with the correct IANA offset", () => {
  assert.equal(zonedLocalDateTimeToOffset("1996-06-18T10:30", "Asia/Shanghai"), "1996-06-18T10:30:00+08:00");
  assert.equal(zonedLocalDateTimeToOffset("2026-01-15T10:30", "America/Los_Angeles"), "2026-01-15T10:30:00-08:00");
  assert.equal(zonedLocalDateTimeToOffset("2026-07-15T10:30", "America/Los_Angeles"), "2026-07-15T10:30:00-07:00");
  assert.equal(zonedLocalDateTimeToOffset("2026-07-15T10:30", "Asia/Kolkata"), "2026-07-15T10:30:00+05:30");
  assert.equal(zonedLocalDateTimeToOffset("2026-07-15T10:30", "Europe/London"), "2026-07-15T10:30:00+01:00");
});

test("uses date-specific DST offset when an explicit offset is absent", () => {
  const winter = createTimeProfile({ ...baseInput, timezone: "America/New_York", birthDateTime: "2026-01-15T10:30:00" });
  const summer = createTimeProfile({ ...baseInput, timezone: "America/New_York", birthDateTime: "2026-07-15T10:30:00" });
  assert.equal(winter.timezoneOffsetMinutes, -300);
  assert.equal(winter.standardMeridianLongitude, -75);
  assert.equal(summer.timezoneOffsetMinutes, -240);
  assert.equal(summer.standardMeridianLongitude, -60);
});

test("preserves an explicit numeric offset", () => {
  const profile = createTimeProfile({ ...baseInput, timezone: "America/Los_Angeles", birthDateTime: "2026-07-15T10:30:00+09:00" });
  assert.equal(profile.timezoneOffsetMinutes, 540);
});

test("rejects local wall times that do not exist during a DST jump", () => {
  assert.throws(
    () => zonedLocalDateTimeToOffset("2026-03-08T02:30", "America/Los_Angeles"),
    /不存在|does not exist/i
  );
});

test("supports deterministic disambiguation for repeated DST wall times", () => {
  assert.equal(
    zonedLocalDateTimeToOffset("2026-11-01T01:30", "America/Los_Angeles", "earlier"),
    "2026-11-01T01:30:00-07:00"
  );
  assert.equal(
    zonedLocalDateTimeToOffset("2026-11-01T01:30", "America/Los_Angeles", "later"),
    "2026-11-01T01:30:00-08:00"
  );
});

test("returns offsets for quarter- and half-hour IANA zones", () => {
  assert.equal(getTimeZoneOffsetMinutes("Asia/Kathmandu", "2026-07-15T12:00"), 345);
  assert.equal(getTimeZoneOffsetMinutes("Australia/Eucla", "2026-07-15T12:00"), 525);
});

test("rejects invalid IANA time zones", () => {
  assert.throws(() => zonedLocalDateTimeToOffset("2026-07-15T12:00", "Mars/Olympus_Mons"), /IANA/);
});
