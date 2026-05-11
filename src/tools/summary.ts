import { formatJson } from "../formatter/json.js";
import { formatSummaryMarkdown, buildSummary } from "../formatter/markdown.js";
import type { ContentItem, OutputFormat, ToolContext } from "../types.js";
import { countBy, sortByDateThenPlatform } from "../utils.js";
import { chooseFormat, currentMonthRange } from "./shared.js";

export interface SummaryArgs {
  start_date?: string;
  end_date?: string;
  format?: OutputFormat;
}

export async function getCalendarSummary(context: ToolContext, args: SummaryArgs = {}): Promise<string> {
  const range = currentMonthRange(context);
  const start = args.start_date || range.start;
  const end = args.end_date || range.end;
  const result = await context.scan();
  const items = sortByDateThenPlatform(
    result.items.filter((item) => item.publish_date >= start && item.publish_date <= end),
  );
  const daily = countBy(items, (item: ContentItem) => item.publish_date);
  const payload = {
    start_date: start,
    end_date: end,
    summary: buildSummary(items),
    daily,
    items,
    warnings: result.warnings,
  };
  return chooseFormat(args.format, context) === "markdown"
    ? formatSummaryMarkdown(`Calendar Summary (${start} to ${end})`, payload.summary, daily)
    : formatJson(payload);
}
