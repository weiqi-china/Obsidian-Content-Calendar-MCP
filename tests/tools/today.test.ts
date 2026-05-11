import { describe, expect, it } from "vitest";
import { getTodaySchedule } from "../../src/tools/today.js";
import { fixtureContext } from "../helpers.js";

describe("getTodaySchedule", () => {
  it("returns items for the requested date as json and markdown", async () => {
    const context = await fixtureContext();
    const json = JSON.parse(await getTodaySchedule(context, { date: "2026-05-12" }));
    expect(json.items).toHaveLength(1);
    expect(json.items[0].platform).toBe("小红书");

    const markdown = await getTodaySchedule(context, { date: "2026-05-12", format: "markdown" });
    expect(markdown).toContain("# 今日发布清单");
    expect(markdown).toContain("贝妙乐活社");
  });
});
