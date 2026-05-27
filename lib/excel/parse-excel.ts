import * as XLSX from "xlsx";
import type { ImportFieldMapping, ImportPreview } from "@/types/import";
import { defaultWorkRule, type WorkRuleInput } from "@/types/attendance";
import { validateAttendanceRow } from "@/lib/attendance/validators";
import { detectFieldMapping } from "./field-mapping";

type SheetRow = Record<string, unknown>;

export function parseExcelBuffer(
  buffer: ArrayBuffer,
  manualMapping?: ImportFieldMapping,
  rule: WorkRuleInput = defaultWorkRule,
): ImportPreview {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) {
    throw new Error("Excel 文件中没有可解析的工作表");
  }

  const rows = XLSX.utils.sheet_to_json<SheetRow>(workbook.Sheets[firstSheet], {
    defval: "",
  });
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const mapping = { ...detectFieldMapping(headers), ...manualMapping };

  const previewRows = rows.map((row, index) => {
    const result = validateAttendanceRow(
      {
        name: readString(row, mapping.name),
        date: readValue(row, mapping.date),
        checkIn: readValue(row, mapping.checkIn),
        checkOut: readValue(row, mapping.checkOut),
        statusText: readString(row, mapping.status),
        remark: readString(row, mapping.remark),
      },
      rule,
    );

    return {
      rowNumber: index + 2,
      raw: row,
      record: result.record ?? undefined,
      errors: result.errors,
    };
  });

  return {
    headers,
    mapping,
    rows: previewRows,
    totalRows: rows.length,
    validRows: previewRows.filter((row) => row.errors.length === 0).length,
    invalidRows: previewRows.filter((row) => row.errors.length > 0).length,
  };
}

function readValue(row: SheetRow, key?: string) {
  return key ? row[key] : undefined;
}

function readString(row: SheetRow, key?: string) {
  const value = readValue(row, key);
  return value == null || value === "" ? undefined : String(value);
}
