import type { StatusMapping } from "../config.schema.js";
import type { StandardStatus } from "../types.js";
import { toStringValue } from "../utils.js";

export function inferStatus(rawValue: unknown, mapping: StatusMapping): StandardStatus {
  const rawStatus = toStringValue(rawValue);
  if (!rawStatus) return "draft";

  const normalized = rawStatus.toLowerCase();
  for (const status of ["published", "pending", "draft"] as StandardStatus[]) {
    const aliases = mapping[status].map((item) => item.toLowerCase());
    if (aliases.includes(normalized)) return status;
  }

  return "draft";
}
