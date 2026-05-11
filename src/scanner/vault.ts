import fs from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import { format } from "date-fns";
import type { CalendarConfig } from "../config.schema.js";
import { parseFilename } from "../parser/filename.js";
import { parseFrontmatter } from "../parser/frontmatter.js";
import { inferStatus } from "../parser/status.js";
import type { ContentItem, ScanResult } from "../types.js";
import { getNestedValue, normalizeDate, toStringArray, toStringValue } from "../utils.js";

export interface VaultScanner {
  scan: () => Promise<ScanResult>;
}

export function createVaultScanner(config: CalendarConfig): VaultScanner {
  return {
    scan: () => scanVault(config),
  };
}

export async function scanVault(config: CalendarConfig): Promise<ScanResult> {
  const warnings: string[] = [];
  const vaultExists = await pathExists(config.vault_path);
  if (!vaultExists) {
    throw new Error(`vault_path does not exist: ${config.vault_path}`);
  }

  const files = await fg(config.content_paths, {
    cwd: config.vault_path,
    absolute: true,
    onlyFiles: true,
    unique: true,
  });

  const items: ContentItem[] = [];
  for (const filePath of files) {
    const item = await parseContentFile(filePath, config);
    if (item.warnings.length > 0) warnings.push(...item.warnings);
    if (item.warnings.some((warning) => warning.startsWith("Filename did not match pattern"))) {
      continue;
    }
    if (config.filters?.platforms?.length && item.platform && !config.filters.platforms.includes(item.platform)) continue;
    if (config.filters?.accounts?.length && item.account && !config.filters.accounts.includes(item.account)) continue;
    items.push(item);
  }

  return { items, warnings };
}

async function parseContentFile(filePath: string, config: CalendarConfig): Promise<ContentItem> {
  const filename = path.basename(filePath);
  const relativePath = path.relative(config.vault_path, filePath);
  const [raw, stat] = await Promise.all([fs.readFile(filePath, "utf8"), fs.stat(filePath)]);
  const filenameResult = parseFilename(filePath, config);
  const frontmatterResult = parseFrontmatter(raw, filename, config);
  const mapped = frontmatterResult.mapped;

  const publishDateFromFrontmatter = normalizeDate(
    toStringValue(mapped.publish_date),
    config.date_formats.publish_date || config.output.date_format,
    config.output.date_format,
  );
  const publishDate = publishDateFromFrontmatter || filenameResult.fields.date || format(stat.mtime, config.output.date_format);
  const rawStatus = getNestedValue(frontmatterResult.data, config.frontmatter_mapping.status);
  const tags = Array.isArray(mapped.tags) ? (mapped.tags as string[]) : toStringArray(mapped.tags);

  return {
    filename,
    path: filePath,
    relative_path: relativePath,
    platform: toStringValue(mapped.platform) || filenameResult.fields.platform,
    account: toStringValue(mapped.account) || filenameResult.fields.account,
    product: toStringValue(mapped.product) || filenameResult.fields.product,
    direction: filenameResult.fields.direction,
    title: frontmatterResult.title,
    publish_date: publishDate,
    date: filenameResult.fields.date,
    status: inferStatus(rawStatus, config.status_mapping),
    raw_status: toStringValue(rawStatus),
    batch: toStringValue(mapped.batch),
    tags,
    frontmatter: frontmatterResult.data,
    warnings: [...filenameResult.warnings, ...frontmatterResult.warnings],
    mtime: stat.mtime.toISOString(),
  };
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
