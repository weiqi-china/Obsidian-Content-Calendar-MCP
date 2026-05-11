import { describe, expect, it } from "vitest";
import { getNextUp } from "../../src/tools/nextup.js";
import { fixtureContext } from "../helpers.js";

describe("getNextUp", () => {
  it("returns future pending content by date", async () => {
    const context = await fixtureContext();
    const payload = JSON.parse(await getNextUp(context, { count: 10 }));
    expect(payload.items.map((item: { publish_date: string }) => item.publish_date)).toEqual(["2026-05-12", "2026-05-13"]);
  });
});
