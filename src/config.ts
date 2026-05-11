import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import type { CalendarConfig } from "./config.schema.js";
import { resolveMaybeRelative } from "./utils.js";

const DEFAULT_VAULT_PATH = process.env.OBSIDIAN_VAULT || process.cwd();

export const DEFAULT_CONFIG: CalendarConfig = {
  vault_path: DEFAULT_VAULT_PATH,
  content_paths: ["20_Projects/Content_Production/**/01_作品区/*.md"],
  filename_pattern: "^(?<date>\\d{8})_(?<platform>[^_]+)_(?<account>[^_]+)_(?<product>[^_]+)_(?<direction>.+)\\.md$",
  date_format: "yyyyMMdd",
  frontmatter_mapping: {
    title: "title",
    status: "status",
    publish_date: "publish_date",
    platform: "platform",
    account: "account",
    product: "product",
    batch: "batch",
    tags: "tags",
  },
  status_mapping: {
    published: ["已发布", "published", "done"],
    pending: ["待发布", "pending", "scheduled"],
    draft: ["草稿", "draft", "wip", "规划中"],
  },
  date_formats: {
    publish_date: "yyyy-MM-dd",
  },
  output: {
    default_format: "json",
    date_format: "yyyy-MM-dd",
    timezone: "Asia/Shanghai",
  },
};

export interface LoadConfigOptions {
  configPath?: string;
  cwd?: string;
}

export async function loadConfig(options: LoadConfigOptions = {}): Promise<CalendarConfig> {
  const cwd = options.cwd || process.cwd();
  const explicitConfigPath = options.configPath || process.env.OBSIDIAN_CONTENT_CALENDAR_CONFIG;
  const candidatePaths = explicitConfigPath
    ? [resolveMaybeRelative(cwd, explicitConfigPath)]
    : [
        path.resolve(cwd, "obsidian-content-calendar.config.yaml"),
        path.resolve(DEFAULT_VAULT_PATH, "obsidian-content-calendar.config.yaml"),
      ];

  for (const candidatePath of candidatePaths) {
    const exists = await fileExists(candidatePath);
    if (!exists) continue;
    const raw = await fs.readFile(candidatePath, "utf8");
    const parsed = (yaml.load(raw) || {}) as Partial<CalendarConfig>;
    return normalizeConfig(mergeConfig(DEFAULT_CONFIG, parsed), path.dirname(candidatePath));
  }

  return normalizeConfig(DEFAULT_CONFIG, cwd);
}

export function mergeConfig(base: CalendarConfig, override: Partial<CalendarConfig>): CalendarConfig {
  return {
    ...base,
    ...override,
    content_paths: override.content_paths || base.content_paths,
    frontmatter_mapping: {
      ...base.frontmatter_mapping,
      ...(override.frontmatter_mapping || {}),
    },
    status_mapping: {
      published: override.status_mapping?.published || base.status_mapping.published,
      pending: override.status_mapping?.pending || base.status_mapping.pending,
      draft: override.status_mapping?.draft || base.status_mapping.draft,
    },
    date_formats: {
      ...base.date_formats,
      ...(override.date_formats || {}),
    },
    output: {
      ...base.output,
      ...(override.output || {}),
    },
    filters: override.filters,
  };
}

export function normalizeConfig(config: CalendarConfig, configDir = process.cwd()): CalendarConfig {
  const vaultPath = resolveMaybeRelative(configDir, config.vault_path || DEFAULT_VAULT_PATH);
  return {
    ...config,
    vault_path: vaultPath,
    content_paths: config.content_paths?.length ? config.content_paths : DEFAULT_CONFIG.content_paths,
    output: {
      ...DEFAULT_CONFIG.output,
      ...config.output,
      default_format: config.output?.default_format === "markdown" ? "markdown" : "json",
    },
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
