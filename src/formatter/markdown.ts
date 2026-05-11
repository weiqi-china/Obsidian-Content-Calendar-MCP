import type { ContentItem, StandardStatus, Summary } from "../types.js";
import { countBy } from "../utils.js";

const STATUS_LABELS: Record<StandardStatus, string> = {
  published: "已发布",
  pending: "待发布",
  draft: "草稿",
};

const STATUS_MARKS: Record<StandardStatus, string> = {
  published: "✅",
  pending: "⏳",
  draft: "📝",
};

export function formatItemsMarkdown(title: string, items: ContentItem[]): string {
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
        `- **[${item.account || "unknown"}]** ${item.title} -> ${STATUS_LABELS[item.status]} ${STATUS_MARKS[item.status]} (${item.publish_date})`,
      );
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function formatPendingMarkdown(items: ContentItem[]): string {
  const lines = ["# Pending Content", ""];
  if (items.length === 0) return `${lines.join("\n")}No pending content found.`;
  const byStatus = groupBy(items, (item) => item.status);
  for (const [status, statusItems] of Object.entries(byStatus)) {
    lines.push(`## ${STATUS_LABELS[status as StandardStatus] || status}`);
    for (const item of statusItems) {
      lines.push(`- **${item.publish_date}** [${item.platform || "unknown"} / ${item.account || "unknown"}] ${item.title}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function formatSummaryMarkdown(title: string, summary: Summary, daily: Record<string, number>): string {
  const lines = [`# ${title}`, "", `Total: **${summary.total}**`, "", "## By Status"];
  for (const [status, count] of Object.entries(summary.by_status)) {
    lines.push(`- ${STATUS_LABELS[status as StandardStatus] || status}: ${count}`);
  }
  lines.push("", "## By Platform");
  for (const [platform, count] of Object.entries(summary.by_platform)) lines.push(`- ${platform}: ${count}`);
  lines.push("", "## Daily Distribution");
  for (const [date, count] of Object.entries(daily)) lines.push(`- ${date}: ${count}`);
  return lines.join("\n");
}

export function buildSummary(items: ContentItem[]): Summary {
  return {
    total: items.length,
    by_platform: countBy(items, (item) => item.platform),
    by_account: countBy(items, (item) => item.account),
    by_status: {
      published: items.filter((item) => item.status === "published").length,
      pending: items.filter((item) => item.status === "pending").length,
      draft: items.filter((item) => item.status === "draft").length,
    },
  };
}

function groupBy<T>(items: T[], getter: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = getter(item);
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});
}
