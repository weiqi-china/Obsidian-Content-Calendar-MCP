import { formatItemsMarkdown, buildSummary } from "../formatter/markdown.js";
import { formatJson } from "../formatter/json.js";
import type { OutputFormat, ToolContext } from "../types.js";
import { sortByDateThenPlatform } from "../utils.js";
import { chooseFormat, todayString } from "./shared.js";

export interface TodayArgs {
  format?: OutputFormat;
  date?: string;
}

export async function getTodaySchedule(context: ToolContext, args: TodayArgs = {}): Promise<string> {
  const date = args.date || todayString(context);
  const result = await context.scan();
  const items = sortByDateThenPlatform(result.items.filter((item) => item.publish_date === date));
  const payload = {
    date,
    items,
    summary: buildSummary(items),
    warnings: result.warnings,
  };
  return chooseFormat(args.format, context) === "markdown" ? formatItemsMarkdown(`今日发布清单 (${date})`, items) : formatJson(payload);
}
