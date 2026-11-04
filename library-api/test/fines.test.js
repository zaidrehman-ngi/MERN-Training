import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateFine } from "../src/services/fines.ts";

const rules = { ratePerDay: 20, maxDays: 30, timeZone: "Asia/Karachi" };
const dueDate = "2026-11-14";
const at = (iso) => new Date(iso);

const cases = [
  ["returned early", { returnedAt: at("2026-11-10T11:00:00+05:00") }, 0],
  ["returned on the due day", { returnedAt: at("2026-11-14T12:00:00+05:00") }, 0],
  ["returned at 23:59 on the due day", { returnedAt: at("2026-11-14T23:59:00+05:00") }, 0],
  ["returned at one minute past midnight", { returnedAt: at("2026-11-15T00:01:00+05:00") }, 20],
  ["returned two hours late", { returnedAt: at("2026-11-15T02:00:00+05:00") }, 20],
  ["00:01 Karachi is still the 14th in UTC", { returnedAt: at("2026-11-14T19:01:00Z") }, 20],
  ["weekend counts: due Saturday, back Monday", { returnedAt: at("2026-11-16T10:00:00+05:00") }, 40],
  ["nine days late", { returnedAt: at("2026-11-23T10:00:00+05:00") }, 180],
  ["capped at 30 days", { returnedAt: at("2027-02-01T10:00:00+05:00") }, 600],
  ["never returned, asked 6 days later", { returnedAt: null, asOf: at("2026-11-20T09:00:00+05:00") }, 120],
  ["never returned, not due yet", { returnedAt: null, asOf: at("2026-11-12T09:00:00+05:00") }, 0],
  ["never returned, a year later", { returnedAt: null, asOf: at("2027-11-14T09:00:00+05:00") }, 600],
];

for (const [name, input, expected] of cases) {
  test(`fine: ${name}`, () => {
    const fine = calculateFine(
      { dueDate, asOf: at("2026-12-31T00:00:00+05:00"), ...input },
      rules,
    );
    assert.equal(fine, expected);
  });
}
