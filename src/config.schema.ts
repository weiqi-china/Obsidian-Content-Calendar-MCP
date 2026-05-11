export interface CalendarConfig {
  vault_path: string;
  content_paths: string[];
  filename_pattern: string;
  date_format: string;
  frontmatter_mapping: FrontmatterMapping;
  status_mapping: StatusMapping;
  date_formats: Record<string, string>;
  output: OutputOptions;
  filters?: FilterOptions;
}

export interface FrontmatterMapping {
  title?: string;
  status?: string;
  publish_date?: string;
  platform?: string;
  account?: string;
  product?: string;
  batch?: string;
  tags?: string;
  [key: string]: string | undefined;
}

export interface StatusMapping {
  published: string[];
  pending: string[];
  draft: string[];
}

export interface OutputOptions {
  default_format: "json" | "markdown";
  date_format: string;
  timezone: string;
}

export interface FilterOptions {
  platforms?: string[];
  accounts?: string[];
}
