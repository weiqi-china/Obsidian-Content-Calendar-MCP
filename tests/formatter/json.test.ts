import { describe, expect, it } from "vitest";
import { formatJson } from "../../src/formatter/json.js";

describe("formatJson", () => {
  it("pretty prints json", () => {
    expect(formatJson({ ok: true })).toContain('\n  "ok": true\n');
  });
});
