import type { AttendanceRecordView } from "./attendance";

export type ImportFieldKey =
  | "date"
  | "name"
  | "checkIn"
  | "checkOut"
  | "actualWork"
  | "status"
  | "remark";

export type ImportFieldMapping = Partial<Record<ImportFieldKey, string>>;

export type ImportPreviewRow = {
  rowNumber: number;
  raw: Record<string, unknown>;
  record?: AttendanceRecordView;
  errors: string[];
};

export type ImportPreview = {
  headers: string[];
  mapping: ImportFieldMapping;
  rows: ImportPreviewRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
};
