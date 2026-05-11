import path from "node:path";
import { loadConfig } from "../src/config.js";
import { createVaultScanner } from "../src/scanner/vault.js";
import type { ToolContext } from "../src/types.js";

export const fixtureConfigPath = path.resolve(process.cwd(), "fixtures/obsidian-content-calendar.config.yaml");

export async function fixtureContext(): Promise<ToolContext> {
  const config = await loadConfig({ configPath: fixtureConfigPath });
  const scanner = createVaultScanner(config);
  return {
    config,
    scan: scanner.scan,
  };
}
