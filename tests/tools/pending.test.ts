import { describe, expect, it } from "vitest";
import { getPendingContent } from "../../src/tools/pending.js";
import { getContentByStatus } from "../../src/tools/status.js";
import { fixtureContext } from "../helpers.js";

describe("pending and status tools", () => {
  it("returns pending content with optional filters", async () => {
    const context = await fixtureContext();
    const allPending = JSON.parse(await getPendingContent(context));
    expect(allPending.items).toHaveLength(2);

    const douyin = JSON.parse(await getPendingContent(context, { platform: "抖音" }));
    expect(douyin.items).toHaveLength(1);
    expect(douyin.items[0].account).toBe("爱拼的未未");
  });

  it("filters by normalized status", async () => {
    const context = await fixtureContext();
    const draft = JSON.parse(await getContentByStatus(context, { status: "draft" }));
    expect(draft.items).toHaveLength(1);
    expect(draft.items[0].platform).toBe("视频号");
  });
});
