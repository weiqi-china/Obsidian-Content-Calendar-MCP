import path from "node:path";
import type { CalendarConfig } from "../config.schema.js";
import type { FilenameFields } from "../types.js";
import { normalizeDate } from "../utils.js";

export interface FilenameParseResult {
  fields: FilenameFields;
  warnings: string[];
}

export function parseFilename(filePath: string, config: CalendarConfig): FilenameParseResult {
  const filename = path.basename(filePath);
  const pattern = new RegExp(config.filename_pattern);
  const match = filename.match(pattern);
  if (!match?.groups) {
    return {
      fields: {},
      warnings: [`Filename did not match pattern: ${filename}`],
    };
  }

  const fields: FilenameFields = { ...match.groups };
  fields.date = normalizeDate(fields.date, config.date_format, config.output.date_format) || fields.date;
  return { fields, warnings: [] };
}
