import { formatJson } from "../formatter/json.js";
import { formatItemsMarkdown, buildSummary } from "../formatter/markdown.js";
import type { OutputFormat, ToolContext } from "../types.js";
import { sortByDateThenPlatform } from "../utils.js";
import { chooseFormat, todayString } from "./shared.js";

export interface NextUpArgs {
  count?: number;
  format?: OutputFormat;
}

export async function getNextUp(context: ToolContext, args: NextUpArgs = {}): Promise<string> {
  const count = args.count && args.count > 0 ? args.count : 5;
  const today = todayString(context);
  const result = await context.scan();
  const items = sortByDateThenPlatform(
    result.items.filter((item) => item.status === "pending" && item.publish_date >= today),
  ).slice(0, count);
  const payload = {
    count,
    items,
    summary: buildSummary(items),
    warnings: result.warnings,
  };
  return chooseFormat(args.format, context) === "markdown" ? formatItemsMarkdown(`Next ${count} Content Items`, items) : formatJson(payload);
}
