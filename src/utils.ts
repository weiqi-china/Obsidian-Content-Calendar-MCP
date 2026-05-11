import path from "node:path";
import { format, isValid, parse, parseISO } from "date-fns";

export function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function getNestedValue(source: Record<string, unknown>, keyPath?: string): unknown {
  if (!keyPath) return undefined;
  return keyPath.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
}

export function toStringValue(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Date) return format(value, "yyyy-MM-dd");
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return undefined;
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(toStringValue).filter((item): item is string => Boolean(item));
  const stringValue = toStringValue(value);
  if (!stringValue) return [];
  return stringValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeDate(value: string | undefined, inputFormat: string, outputFormat = "yyyy-MM-dd"): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const parsedByFormat = parse(trimmed, inputFormat, new Date());
  if (isValid(parsedByFormat)) return format(parsedByFormat, outputFormat);
  const parsedIso = parseISO(trimmed);
  if (isValid(parsedIso)) return format(parsedIso, outputFormat);
  return undefined;
}

export function getTitleFromMarkdown(content: string, fallback: string): string {
  const heading = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));
  return heading ? heading.replace(/^#\s+/, "").trim() : fallback.replace(/\.md$/i, "");
}

export function countBy<T>(items: T[], getter: (item: T) => string | undefined): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getter(item) || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function resolveMaybeRelative(base: string, target: string): string {
  return path.isAbsolute(target) ? target : path.resolve(base, target);
}

export function sortByDateThenPlatform<T extends { publish_date: string; platform?: string; account?: string; title?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const dateCompare = a.publish_date.localeCompare(b.publish_date);
    if (dateCompare !== 0) return dateCompare;
    const platformCompare = (a.platform || "").localeCompare(b.platform || "", "zh-Hans-CN");
    if (platformCompare !== 0) return platformCompare;
    const accountCompare = (a.account || "").localeCompare(b.account || "", "zh-Hans-CN");
    if (accountCompare !== 0) return accountCompare;
    return (a.title || "").localeCompare(b.title || "", "zh-Hans-CN");
  });
}
