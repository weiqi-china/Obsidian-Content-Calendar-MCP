import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config.js";
import { parseFilename } from "../../src/parser/filename.js";
import { fixtureConfigPath } from "../helpers.js";

describe("parseFilename", () => {
  it("extracts content factory fields from a filename", async () => {
    const config = await loadConfig({ configPath: fixtureConfigPath });
    const filePath = path.join(config.vault_path, "20260512_抖音_爱拼的未未_地球视界_过程记录.md");
    const result = parseFilename(filePath, config);
    expect(result.warnings).toEqual([]);
    expect(result.fields).toMatchObject({
      date: "2026-05-12",
      platform: "抖音",
      account: "爱拼的未未",
      product: "地球视界",
      direction: "过程记录",
    });
  });

  it("warns when filename does not match", async () => {
    const config = await loadConfig({ configPath: fixtureConfigPath });
    const result = parseFilename("plain-note.md", config);
    expect(result.warnings[0]).toContain("Filename did not match pattern");
  });
});
