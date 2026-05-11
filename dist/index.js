#!/usr/bin/env node

// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// src/config.ts
import fs from "fs/promises";
import path2 from "path";
import yaml from "js-yaml";

// src/utils.ts
import path from "path";
import { format, isValid, parse, parseISO } from "date-fns";
function getNestedValue(source, keyPath) {
  if (!keyPath) return void 0;
  return keyPath.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return current[key];
    }
    return void 0;
  }, source);
}
function toStringValue(value) {
  if (value === void 0 || value === null) return void 0;
  if (value instanceof Date) return format(value, "yyyy-MM-dd");
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return void 0;
}
function toStringArray(value) {
  if (Array.isArray(value)) return value.map(toStringValue).filter((item) => Boolean(item));
  const stringValue = toStringValue(value);
  if (!stringValue) return [];
  return stringValue.split(",").map((item) => item.trim()).filter(Boolean);
}
function normalizeDate(value, inputFormat, outputFormat = "yyyy-MM-dd") {
  if (!value) return void 0;
  const trimmed = value.trim();
  const parsedByFormat = parse(trimmed, inputFormat, /* @__PURE__ */ new Date());
  if (isValid(parsedByFormat)) return format(parsedByFormat, outputFormat);
  const parsedIso = parseISO(trimmed);
  if (isValid(parsedIso)) return format(parsedIso, outputFormat);
  return void 0;
}
function getTitleFromMarkdown(content, fallback) {
  const heading = content.split(/\r?\n/).map((line) => line.trim()).find((line) => line.startsWith("# "));
  return heading ? heading.replace(/^#\s+/, "").trim() : fallback.replace(/\.md$/i, "");
}
function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
function resolveMaybeRelative(base, target) {
  return path.isAbsolute(target) ? target : path.resolve(base, target);
}
function sortByDateThenPlatform(items) {
  return [...items].sort((a, b) => {
    const dateCompare = a.publish_date.localeCompare(b.publish_date);
    if (dateCompare !== 0) return dateCompare;
    const platformCompare = (a.platform || "").localeCompare(b.platform || "", "zh-Hans-CN");
    if (platformCompare !== 0) return platformCompare;
    const accountCompare = (a.account || "").localeCompare(b.account || "", "zh-Hans-CN");
    if (accountCompare !== 0) return accountCompare;
    return (a.title || "").localeCompare(b.title || "", "zh-Hans-CN");
  });
}

// src/config.ts
var DEFAULT_VAULT_PATH = process.env.OBSIDIAN_VAULT || process.cwd();
var DEFAULT_CONFIG = {
  vault_path: DEFAULT_VAULT_PATH,
  content_paths: ["20_Projects/Content_Production/**/01_\u4F5C\u54C1\u533A/*.md"],
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
    tags: "tags"
  },
  status_mapping: {
    published: ["\u5DF2\u53D1\u5E03", "published", "done"],
    pending: ["\u5F85\u53D1\u5E03", "pending", "scheduled"],
    draft: ["\u8349\u7A3F", "draft", "wip", "\u89C4\u5212\u4E2D"]
  },
  date_formats: {
    publish_date: "yyyy-MM-dd"
  },
  output: {
    default_format: "json",
    date_format: "yyyy-MM-dd",
    timezone: "Asia/Shanghai"
  }
};
async function loadConfig(options = {}) {
  const cwd = options.cwd || process.cwd();
  const explicitConfigPath = options.configPath || process.env.OBSIDIAN_CONTENT_CALENDAR_CONFIG;
  const candidatePaths = explicitConfigPath ? [resolveMaybeRelative(cwd, explicitConfigPath)] : [
    path2.resolve(cwd, "obsidian-content-calendar.config.yaml"),
    path2.resolve(DEFAULT_VAULT_PATH, "obsidian-content-calendar.config.yaml")
  ];
  for (const candidatePath of candidatePaths) {
    const exists = await fileExists(candidatePath);
    if (!exists) continue;
    const raw = await fs.readFile(candidatePath, "utf8");
    const parsed = yaml.load(raw) || {};
    return normalizeConfig(mergeConfig(DEFAULT_CONFIG, parsed), path2.dirname(candidatePath));
  }
  return normalizeConfig(DEFAULT_CONFIG, cwd);
}
function mergeConfig(base, override) {
  return {
    ...base,
    ...override,
    content_paths: override.content_paths || base.content_paths,
    frontmatter_mapping: {
      ...base.frontmatter_mapping,
      ...override.frontmatter_mapping || {}
    },
    status_mapping: {
      published: override.status_mapping?.published || base.status_mapping.published,
      pending: override.status_mapping?.pending || base.status_mapping.pending,
      draft: override.status_mapping?.draft || base.status_mapping.draft
    },
    date_formats: {
      ...base.date_formats,
      ...override.date_formats || {}
    },
    output: {
      ...base.output,
      ...override.output || {}
    },
    filters: override.filters
  };
}
function normalizeConfig(config, configDir = process.cwd()) {
  const vaultPath = resolveMaybeRelative(configDir, config.vault_path || DEFAULT_VAULT_PATH);
  return {
    ...config,
    vault_path: vaultPath,
    content_paths: config.content_paths?.length ? config.content_paths : DEFAULT_CONFIG.content_paths,
    output: {
      ...DEFAULT_CONFIG.output,
      ...config.output,
      default_format: config.output?.default_format === "markdown" ? "markdown" : "json"
    }
  };
}
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// src/scanner/vault.ts
import fs2 from "fs/promises";
import path4 from "path";
import fg from "fast-glob";
import { format as format2 } from "date-fns";

// src/parser/filename.ts
import path3 from "path";
function parseFilename(filePath, config) {
  const filename = path3.basename(filePath);
  const pattern = new RegExp(config.filename_pattern);
  const match = filename.match(pattern);
  if (!match?.groups) {
    return {
      fields: {},
      warnings: [`Filename did not match pattern: ${filename}`]
    };
  }
  const fields = { ...match.groups };
  fields.date = normalizeDate(fields.date, config.date_format, config.output.date_format) || fields.date;
  return { fields, warnings: [] };
}

// src/parser/frontmatter.ts
import matter from "gray-matter";
function parseFrontmatter(markdown, filename, config) {
  try {
    const parsed = matter(markdown);
    const mapped = {};
    for (const [standardKey, frontmatterKey] of Object.entries(config.frontmatter_mapping)) {
      const value = getNestedValue(parsed.data, frontmatterKey);
      if (value !== void 0) mapped[standardKey] = value;
    }
    const mappedTitle = toStringValue(mapped.title);
    const title = mappedTitle || getTitleFromMarkdown(parsed.content, filename);
    if (mapped.tags !== void 0) mapped.tags = toStringArray(mapped.tags);
    return {
      data: parsed.data,
      content: parsed.content,
      mapped,
      title,
      warnings: []
    };
  } catch (error) {
    return {
      data: {},
      content: markdown,
      mapped: {},
      title: getTitleFromMarkdown(markdown, filename),
      warnings: [`Frontmatter parse failed for ${filename}: ${error.message}`]
    };
  }
}

// src/parser/status.ts
function inferStatus(rawValue, mapping) {
  const rawStatus = toStringValue(rawValue);
  if (!rawStatus) return "draft";
  const normalized = rawStatus.toLowerCase();
  for (const status of ["published", "pending", "draft"]) {
    const aliases = mapping[status].map((item) => item.toLowerCase());
    if (aliases.includes(normalized)) return status;
  }
  return "draft";
}

// src/scanner/vault.ts
function createVaultScanner(config) {
  return {
    scan: () => scanVault(config)
  };
}
async function scanVault(config) {
  const warnings = [];
  const vaultExists = await pathExists(config.vault_path);
  if (!vaultExists) {
    throw new Error(`vault_path does not exist: ${config.vault_path}`);
  }
  const files = await fg(config.content_paths, {
    cwd: config.vault_path,
    absolute: true,
    onlyFiles: true,
    unique: true
  });
  const items = [];
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
async function parseContentFile(filePath, config) {
  const filename = path4.basename(filePath);
  const relativePath = path4.relative(config.vault_path, filePath);
  const [raw, stat] = await Promise.all([fs2.readFile(filePath, "utf8"), fs2.stat(filePath)]);
  const filenameResult = parseFilename(filePath, config);
  const frontmatterResult = parseFrontmatter(raw, filename, config);
  const mapped = frontmatterResult.mapped;
  const publishDateFromFrontmatter = normalizeDate(
    toStringValue(mapped.publish_date),
    config.date_formats.publish_date || config.output.date_format,
    config.output.date_format
  );
  const publishDate = publishDateFromFrontmatter || filenameResult.fields.date || format2(stat.mtime, config.output.date_format);
  const rawStatus = getNestedValue(frontmatterResult.data, config.frontmatter_mapping.status);
  const tags = Array.isArray(mapped.tags) ? mapped.tags : toStringArray(mapped.tags);
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
    mtime: stat.mtime.toISOString()
  };
}
async function pathExists(targetPath) {
  try {
    await fs2.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

// src/formatter/markdown.ts
var STATUS_LABELS = {
  published: "\u5DF2\u53D1\u5E03",
  pending: "\u5F85\u53D1\u5E03",
  draft: "\u8349\u7A3F"
};
var STATUS_MARKS = {
  published: "\u2705",
  pending: "\u23F3",
  draft: "\u{1F4DD}"
};
function formatItemsMarkdown(title, items) {
  const lines = [`# ${title}`, ""];
  if (items.length === 0) {
    lines.push("No content found.");
    return lines.join("\n");
  }
  const byPlatform = groupBy(items, (item) => item.platform || "unknown");
  for (const [platform, platformItems] of Object.entries(byPlatform)) {
    lines.push(`## ${platform}`);
    for (const item of platformItems) {
      lines.push(
        `- **[${item.account || "unknown"}]** ${item.title} -> ${STATUS_LABELS[item.status]} ${STATUS_MARKS[item.status]} (${item.publish_date})`
      );
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
function formatPendingMarkdown(items) {
  const lines = ["# Pending Content", ""];
  if (items.length === 0) return `${lines.join("\n")}No pending content found.`;
  const byStatus = groupBy(items, (item) => item.status);
  for (const [status, statusItems] of Object.entries(byStatus)) {
    lines.push(`## ${STATUS_LABELS[status] || status}`);
    for (const item of statusItems) {
      lines.push(`- **${item.publish_date}** [${item.platform || "unknown"} / ${item.account || "unknown"}] ${item.title}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
function formatSummaryMarkdown(title, summary, daily) {
  const lines = [`# ${title}`, "", `Total: **${summary.total}**`, "", "## By Status"];
  for (const [status, count] of Object.entries(summary.by_status)) {
    lines.push(`- ${STATUS_LABELS[status] || status}: ${count}`);
  }
  lines.push("", "## By Platform");
  for (const [platform, count] of Object.entries(summary.by_platform)) lines.push(`- ${platform}: ${count}`);
  lines.push("", "## Daily Distribution");
  for (const [date, count] of Object.entries(daily)) lines.push(`- ${date}: ${count}`);
  return lines.join("\n");
}
function buildSummary(items) {
  return {
    total: items.length,
    by_platform: countBy(items, (item) => item.platform),
    by_account: countBy(items, (item) => item.account),
    by_status: {
      published: items.filter((item) => item.status === "published").length,
      pending: items.filter((item) => item.status === "pending").length,
      draft: items.filter((item) => item.status === "draft").length
    }
  };
}
function groupBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});
}

// src/formatter/json.ts
function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

// src/tools/shared.ts
import { format as format3, lastDayOfMonth, startOfMonth } from "date-fns";
function chooseFormat(formatArg, context) {
  return formatArg || context.config.output.default_format;
}
function todayString(context) {
  return format3(/* @__PURE__ */ new Date(), context.config.output.date_format);
}
function currentMonthRange(context) {
  const now = /* @__PURE__ */ new Date();
  return {
    start: format3(startOfMonth(now), context.config.output.date_format),
    end: format3(lastDayOfMonth(now), context.config.output.date_format)
  };
}

// src/tools/today.ts
async function getTodaySchedule(context, args = {}) {
  const date = args.date || todayString(context);
  const result = await context.scan();
  const items = sortByDateThenPlatform(result.items.filter((item) => item.publish_date === date));
  const payload = {
    date,
    items,
    summary: buildSummary(items),
    warnings: result.warnings
  };
  return chooseFormat(args.format, context) === "markdown" ? formatItemsMarkdown(`\u4ECA\u65E5\u53D1\u5E03\u6E05\u5355 (${date})`, items) : formatJson(payload);
}

// src/tools/pending.ts
async function getPendingContent(context, args = {}) {
  const result = await context.scan();
  const items = sortByDateThenPlatform(
    result.items.filter((item) => {
      if (item.status !== "pending") return false;
      if (args.platform && item.platform !== args.platform) return false;
      if (args.account && item.account !== args.account) return false;
      return true;
    })
  );
  const payload = {
    items,
    summary: buildSummary(items),
    warnings: result.warnings
  };
  return chooseFormat(args.format, context) === "markdown" ? formatPendingMarkdown(items) : formatJson(payload);
}

// src/tools/status.ts
async function getContentByStatus(context, args) {
  const result = await context.scan();
  const items = sortByDateThenPlatform(result.items.filter((item) => item.status === args.status));
  const payload = {
    status: args.status,
    items,
    summary: buildSummary(items),
    warnings: result.warnings
  };
  return chooseFormat(args.format, context) === "markdown" ? formatItemsMarkdown(`Content by Status: ${args.status}`, items) : formatJson(payload);
}

// src/tools/nextup.ts
async function getNextUp(context, args = {}) {
  const count = args.count && args.count > 0 ? args.count : 5;
  const today = todayString(context);
  const result = await context.scan();
  const items = sortByDateThenPlatform(
    result.items.filter((item) => item.status === "pending" && item.publish_date >= today)
  ).slice(0, count);
  const payload = {
    count,
    items,
    summary: buildSummary(items),
    warnings: result.warnings
  };
  return chooseFormat(args.format, context) === "markdown" ? formatItemsMarkdown(`Next ${count} Content Items`, items) : formatJson(payload);
}

// src/tools/summary.ts
async function getCalendarSummary(context, args = {}) {
  const range = currentMonthRange(context);
  const start = args.start_date || range.start;
  const end = args.end_date || range.end;
  const result = await context.scan();
  const items = sortByDateThenPlatform(
    result.items.filter((item) => item.publish_date >= start && item.publish_date <= end)
  );
  const daily = countBy(items, (item) => item.publish_date);
  const payload = {
    start_date: start,
    end_date: end,
    summary: buildSummary(items),
    daily,
    items,
    warnings: result.warnings
  };
  return chooseFormat(args.format, context) === "markdown" ? formatSummaryMarkdown(`Calendar Summary (${start} to ${end})`, payload.summary, daily) : formatJson(payload);
}

// src/index.ts
var formatSchema = z.enum(["json", "markdown"]).optional();
async function createServer() {
  const config = await loadConfig();
  const scanner = createVaultScanner(config);
  const context = {
    config,
    scan: scanner.scan
  };
  const server = new McpServer({
    name: "obsidian-content-calendar",
    version: "1.0.0"
  });
  server.registerTool(
    "get_today_schedule",
    {
      title: "Get Today Schedule",
      description: "Get content scheduled for a given date from your Obsidian vault.",
      inputSchema: {
        format: formatSchema,
        date: z.string().optional().describe("ISO date, e.g. 2026-05-12. Defaults to today.")
      }
    },
    async (args) => textResponse(await getTodaySchedule(context, args))
  );
  server.registerTool(
    "get_pending_content",
    {
      title: "Get Pending Content",
      description: "Get all pending content, optionally filtered by platform or account.",
      inputSchema: {
        format: formatSchema,
        platform: z.string().optional(),
        account: z.string().optional()
      }
    },
    async (args) => textResponse(await getPendingContent(context, args))
  );
  server.registerTool(
    "get_content_by_status",
    {
      title: "Get Content By Status",
      description: "Filter content by normalized status: published, pending, or draft.",
      inputSchema: {
        status: z.enum(["published", "pending", "draft"]),
        format: formatSchema
      }
    },
    async (args) => textResponse(await getContentByStatus(context, args))
  );
  server.registerTool(
    "get_next_up",
    {
      title: "Get Next Up",
      description: "Get the next N pending content items sorted by publish date.",
      inputSchema: {
        count: z.number().int().positive().optional(),
        format: formatSchema
      }
    },
    async (args) => textResponse(await getNextUp(context, args))
  );
  server.registerTool(
    "get_calendar_summary",
    {
      title: "Get Calendar Summary",
      description: "Get content distribution over a date range.",
      inputSchema: {
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        format: formatSchema
      }
    },
    async (args) => textResponse(await getCalendarSummary(context, args))
  );
  return server;
}
async function main() {
  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
function textResponse(text) {
  return {
    content: [{ type: "text", text }]
  };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(`obsidian-content-calendar MCP server failed: ${error.message}`);
    process.exit(1);
  });
}
export {
  createServer
};
//# sourceMappingURL=index.js.map