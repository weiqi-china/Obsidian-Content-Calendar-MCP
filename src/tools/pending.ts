import { formatJson } from "../formatter/json.js";
import { formatPendingMarkdown, buildSummary } from "../formatter/markdown.js";
import type { OutputFormat, ToolContext } from "../types.js";
import { sortByDateThenPlatform } from "../utils.js";
import { chooseFormat } from "./shared.js";

export interface PendingArgs {
  format?: OutputFormat;
  platform?: string;
  account?: string;
}

export async function getPendingContent(context: ToolContext, args: PendingArgs = {}): Promise<string> {
  const result = await context.scan();
  const items = sortByDateThenPlatform(
    result.items.filter((item) => {
      if (item.status !== "pending") return false;
      if (args.platform && item.platform !== args.platform) return false;
      if (args.account && item.account !== args.account) return false;
      return true;
    }),
  );
  const payload = {
    items,
    summary: buildSummary(items),
    warnings: result.warnings,
  };
  return chooseFormat(args.format, context) === "markdown" ? formatPendingMarkdown(items) : formatJson(payload);
}
