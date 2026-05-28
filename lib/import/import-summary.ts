import { format } from "date-fns";
import type { ImportPreview } from "@/types/import";

export function getImportedRecordMonths(preview: ImportPreview) {
  const months = preview.rows
    .filter((row) => row.record && row.errors.length === 0)
    .map((row) => format(row.record!.workDate, "yyyy-MM"));

  return Array.from(new Set(months)).sort();
}
