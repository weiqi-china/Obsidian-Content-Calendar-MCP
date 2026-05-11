import { describe, expect, it } from "vitest";
import { getCalendarSummary } from "../../src/tools/summary.js";
import { fixtureContext } from "../helpers.js";

describe("getCalendarSummary", () => {
  it("summarizes content in a date range", async () => {
    const context = await fixtureContext();
    const payload = JSON.parse(
      await getCalendarSummary(context, {
        start_date: "2026-05-01",
        end_date: "2026-05-31",
      }),
    );
    expect(payload.summary.total).toBe(4);
    expect(payload.summary.by_status.pending).toBe(2);
    expect(payload.daily["2026-05-12"]).toBe(1);
  });
});
