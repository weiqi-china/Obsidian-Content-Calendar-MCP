# Obsidian Content Calendar MCP Server for Claude Desktop, Cursor, Cline and ChatGPT

An MCP (Model Context Protocol) server that turns your Obsidian vault into an AI-powered content calendar. Let Claude, Cursor, Cline, Claude Code, or ChatGPT tell you what to publish today directly from your Markdown notes.

This Obsidian MCP server is built for solo creator workflow, AI content workflow, content scheduling MCP use cases, and Obsidian content planning. It uses pure local filesystem access: no Obsidian plugin, no Local REST API, and no external service.

## Features

- Read Markdown content notes from an Obsidian vault.
- Parse configurable filenames such as `YYYYMMDD_平台_账号_产品_内容方向.md`.
- Map custom frontmatter fields into standard content calendar fields.
- Normalize custom status values into `published`, `pending`, and `draft`.
- Return both structured JSON and readable Markdown.
- Expose 5 MCP tools over stdio transport.

## Quick Start

```bash
npx obsidian-content-calendar-mcp
```

For local development:

```bash
npm install
npm run build
npm run dev
```

## Configuration

Create `obsidian-content-calendar.config.yaml` in your project directory or Obsidian vault root. You can also set `OBSIDIAN_CONTENT_CALENDAR_CONFIG=/path/to/config.yaml`.

```yaml
vault_path: "/path/to/obsidian/vault"
content_paths:
  - "20_Projects/Content_Production/**/01_作品区/*.md"
filename_pattern: "^(?<date>\\d{8})_(?<platform>[^_]+)_(?<account>[^_]+)_(?<product>[^_]+)_(?<direction>.+)\\.md$"
date_format: "yyyyMMdd"
frontmatter_mapping:
  title: "title"
  status: "status"
  publish_date: "publish_date"
  platform: "platform"
  account: "account"
  product: "product"
  batch: "batch"
  tags: "tags"
status_mapping:
  published: ["已发布", "published", "done"]
  pending: ["待发布", "pending", "scheduled"]
  draft: ["草稿", "draft", "wip", "规划中"]
date_formats:
  publish_date: "yyyy-MM-dd"
output:
  default_format: "json"
  date_format: "yyyy-MM-dd"
  timezone: "Asia/Shanghai"
```

Configuration priority:

1. Filename regex extracts base fields.
2. Frontmatter mapping overrides filename fields.
3. `publish_date` uses frontmatter, then filename date, then file modified time.

## MCP Tools

- `get_today_schedule`: get content scheduled for today or a specific ISO date.
- `get_pending_content`: get pending content, optionally filtered by platform or account.
- `get_content_by_status`: filter by `published`, `pending`, or `draft`.
- `get_next_up`: get the next N pending items by publish date.
- `get_calendar_summary`: summarize content distribution over a date range.

Every tool accepts `format: "json" | "markdown"` where applicable.

## Claude Desktop Integration

Add this server to your Claude Desktop MCP config:

```json
{
  "mcpServers": {
    "obsidian-content-calendar": {
      "command": "npx",
      "args": ["obsidian-content-calendar-mcp"],
      "env": {
        "OBSIDIAN_CONTENT_CALENDAR_CONFIG": "/path/to/obsidian-content-calendar.config.yaml"
      }
    }
  }
}
```

## Cursor, Cline and ChatGPT

Use the same stdio command in any MCP-compatible client:

```bash
npx obsidian-content-calendar-mcp
```

Set `OBSIDIAN_CONTENT_CALENDAR_CONFIG` when your config file is not in the working directory.

## Example Workflow

Ask your AI client:

- "What should I publish today?"
- "Show me all pending Xiaohongshu posts in Markdown."
- "Summarize this month's content calendar by platform."
- "What are the next 5 pieces ready to publish?"

## Architecture

- `src/config.ts`: YAML config loading and defaults.
- `src/parser/*`: filename, frontmatter, and status parsing.
- `src/scanner/vault.ts`: fast-glob based Obsidian vault scanner.
- `src/tools/*`: MCP tool handlers.
- `src/formatter/*`: JSON and Markdown output.

## Development

```bash
npm run typecheck
npm test
npm run build
node dist/index.js
```

Fixtures live in `fixtures/`, and tests live in `tests/`.

## Free vs Pro Features

The MVP is fully local and free: filesystem reading, configurable parsing, content schedule queries, JSON and Markdown output, and MCP stdio compatibility. Future paid ideas may add a web dashboard, cloud sync, AI topic suggestions, and team collaboration.

## License

MIT
