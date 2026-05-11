import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "../../src/config.js";
import { inferStatus } from "../../src/parser/status.js";

describe("inferStatus", () => {
  it("normalizes configured status aliases", () => {
    expect(inferStatus("已发布", DEFAULT_CONFIG.status_mapping)).toBe("published");
    expect(inferStatus("scheduled", DEFAULT_CONFIG.status_mapping)).toBe("pending");
    expect(inferStatus("wip", DEFAULT_CONFIG.status_mapping)).toBe("draft");
    expect(inferStatus(undefined, DEFAULT_CONFIG.status_mapping)).toBe("draft");
  });
});
