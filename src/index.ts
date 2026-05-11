import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadConfig } from "./config.js";
import { createVaultScanner } from "./scanner/vault.js";
import type { ToolContext } from "./types.js";
import { getTodaySchedule } from "./tools/today.js";
import { getPendingContent } from "./tools/pending.js";
import { getContentByStatus } from "./tools/status.js";
import { getNextUp } from "./tools/nextup.js";
import { getCalendarSummary } from "./tools/summary.js";

const formatSchema = z.enum(["json", "markdown"]).optional();

export async function createServer(): Promise<McpServer> {
  const config = await loadConfig();
  const scanner = createVaultScanner(config);
  const context: ToolContext = {
    config,
    scan: scanner.scan,
  };

  const server = new McpServer({
    name: "obsidian-content-calendar",
    version: "1.0.0",
  });

  server.registerTool(
    "get_today_schedule",
    {
      title: "Get Today Schedule",
      description: "Get content scheduled for a given date from your Obsidian vault.",
      inputSchema: {
        format: formatSchema,
        date: z.string().optional().describe("ISO date, e.g. 2026-05-12. Defaults to today."),
      },
    },
    async (args) => textResponse(await getTodaySchedule(context, args)),
  );

  server.registerTool(
    "get_pending_content",
    {
      title: "Get Pending Content",
      description: "Get all pending content, optionally filtered by platform or account.",
      inputSchema: {
        format: formatSchema,
        platform: z.string().optional(),
        account: z.string().optional(),
      },
    },
    async (args) => textResponse(await getPendingContent(context, args)),
  );

  server.registerTool(
    "get_content_by_status",
    {
      title: "Get Content By Status",
      description: "Filter content by normalized status: published, pending, or draft.",
      inputSchema: {
        status: z.enum(["published", "pending", "draft"]),
        format: formatSchema,
      },
    },
    async (args) => textResponse(await getContentByStatus(context, args)),
  );

  server.registerTool(
    "get_next_up",
    {
      title: "Get Next Up",
      description: "Get the next N pending content items sorted by publish date.",
      inputSchema: {
        count: z.number().int().positive().optional(),
        format: formatSchema,
      },
    },
    async (args) => textResponse(await getNextUp(context, args)),
  );

  server.registerTool(
    "get_calendar_summary",
    {
      title: "Get Calendar Summary",
      description: "Get content distribution over a date range.",
      inputSchema: {
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        format: formatSchema,
      },
    },
    async (args) => textResponse(await getCalendarSummary(context, args)),
  );

  return server;
}

async function main(): Promise<void> {
  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function textResponse(text: string) {
  return {
    content: [{ type: "text" as const, text }],
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`obsidian-content-calendar MCP server failed: ${(error as Error).message}`);
    process.exit(1);
  });
}
