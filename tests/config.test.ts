import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { fixtureConfigPath } from "./helpers.js";

describe("config", () => {
  it("loads yaml config and resolves vault_path relative to the config file", async () => {
    const config = await loadConfig({ configPath: fixtureConfigPath });
    expect(config.vault_path).toMatch(/fixtures\/vault$/);
    expect(config.output.default_format).toBe("json");
    expect(config.status_mapping.pending).toContain("待发布");
  });
});
