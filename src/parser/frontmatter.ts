import matter from "gray-matter";
import type { CalendarConfig } from "../config.schema.js";
import { getNestedValue, getTitleFromMarkdown, toStringArray, toStringValue } from "../utils.js";

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  content: string;
  mapped: Record<string, unknown>;
  title: string;
  warnings: string[];
}

export function parseFrontmatter(markdown: string, filename: string, config: CalendarConfig): ParsedFrontmatter {
  try {
    const parsed = matter(markdown);
    const mapped: Record<string, unknown> = {};
    for (const [standardKey, frontmatterKey] of Object.entries(config.frontmatter_mapping)) {
      const value = getNestedValue(parsed.data, frontmatterKey);
      if (value !== undefined) mapped[standardKey] = value;
    }

    const mappedTitle = toStringValue(mapped.title);
    const title = mappedTitle || getTitleFromMarkdown(parsed.content, filename);
    if (mapped.tags !== undefined) mapped.tags = toStringArray(mapped.tags);

    return {
      data: parsed.data,
      content: parsed.content,
      mapped,
      title,
      warnings: [],
    };
  } catch (error) {
    return {
      data: {},
      content: markdown,
      mapped: {},
      title: getTitleFromMarkdown(markdown, filename),
      warnings: [`Frontmatter parse failed for ${filename}: ${(error as Error).message}`],
    };
  }
}
