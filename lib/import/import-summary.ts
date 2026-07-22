import { toDateKey } from "@/lib/attendance/parser";
import type { ImportPreview } from "@/types/import";

export function getImportedRecordMonths(preview: ImportPreview) {
  const months = preview.rows
    .filter((row) => row.record && row.errors.length === 0)
    .map((row) => toDateKey(row.record!.workDate).slice(0, 7));

  return Array.from(new Set(months)).sort();
}
