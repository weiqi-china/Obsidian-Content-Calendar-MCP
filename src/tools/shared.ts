import { format, lastDayOfMonth, startOfMonth } from "date-fns";
import type { OutputFormat, ToolContext } from "../types.js";
import { buildSummary } from "../formatter/markdown.js";

export function chooseFormat(formatArg: OutputFormat | undefined, context: ToolContext): OutputFormat {
  return formatArg || context.config.output.default_format;
}

export function todayString(context: ToolContext): string {
  return format(new Date(), context.config.output.date_format);
}

export function currentMonthRange(context: ToolContext): { start: string; end: string } {
  const now = new Date();
  return {
    start: format(startOfMonth(now), context.config.output.date_format),
    end: format(lastDayOfMonth(now), context.config.output.date_format),
  };
}

export { buildSummary };
