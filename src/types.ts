import type { CalendarConfig } from "./config.schema.js";

export type OutputFormat = "json" | "markdown";
export type StandardStatus = "published" | "pending" | "draft";

export interface FilenameFields {
  date?: string;
  platform?: string;
  account?: string;
  product?: string;
  direction?: string;
  [key: string]: string | undefined;
}

export interface ContentItem {
  filename: string;
  path: string;
  relative_path: string;
  platform?: string;
  account?: string;
  product?: string;
  direction?: string;
  title: string;
  publish_date: string;
  status: StandardStatus;
  raw_status?: string;
  batch?: string;
  tags: string[];
  date?: string;
  frontmatter: Record<string, unknown>;
  warnings: string[];
  mtime: string;
}

export interface ScanResult {
  items: ContentItem[];
  warnings: string[];
}

export interface ToolContext {
  config: CalendarConfig;
  scan: () => Promise<ScanResult>;
}

export interface Summary {
  total: number;
  by_platform: Record<string, number>;
  by_account: Record<string, number>;
  by_status: Record<StandardStatus, number>;
}
