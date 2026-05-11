import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config.js";
import { createVaultScanner } from "../../src/scanner/vault.js";
import { fixtureConfigPath } from "../helpers.js";

describe("vault scanner", () => {
  it("scans markdown files and merges filename with frontmatter overrides", async () => {
    const config = await loadConfig({ configPath: fixtureConfigPath });
    const result = await createVaultScanner(config).scan();
    expect(result.items).toHaveLength(4);
    expect(result.warnings.some((warning) => warning.includes("not-a-content-note.md"))).toBe(true);

    const overridden = result.items.find((item) => item.account === "爱拼的未未");
    expect(overridden?.product).toBe("地球·视界");
    expect(overridden?.status).toBe("pending");
    expect(overridden?.publish_date).toBe("2026-05-13");
  });
});
