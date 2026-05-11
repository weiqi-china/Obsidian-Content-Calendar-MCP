import { formatJson } from "../formatter/json.js";
import { formatItemsMarkdown, buildSummary } from "../formatter/markdown.js";
import type { OutputFormat, StandardStatus, ToolContext } from "../types.js";
import { sortByDateThenPlatform } from "../utils.js";
import { chooseFormat } from "./shared.js";

export interface StatusArgs {
  status: StandardStatus;
  format?: OutputFormat;
}

export async function getContentByStatus(context: ToolContext, args: StatusArgs): Promise<string> {
  const result = await context.scan();
  const items = sortByDateThenPlatform(result.items.filter((item) => item.status === args.status));
  const payload = {
    status: args.status,
    items,
    summary: buildSummary(items),
    warnings: result.warnings,
  };
  return chooseFormat(args.format, context) === "markdown" ? formatItemsMarkdown(`Content by Status: ${args.status}`, items) : formatJson(payload);
}
