import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseExcelBuffer } from "./parse-excel";
import { createAttendanceImportTemplate } from "./import-template";

describe("createAttendanceImportTemplate", () => {
  it("generates a workbook with recognizable attendance headers and examples", () => {
    const now = new Date("2026-06-15T10:00:00");
    const buffer = createAttendanceImportTemplate(now);
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets["考勤导入模板"];

    expect(sheet).toBeDefined();

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    expect(Object.keys(rows[0])).toEqual([
      "日期",
      "姓名",
      "上班时间",
      "下班时间",
      "考勤状态",
      "备注",
    ]);
    expect(rows[0]).toMatchObject({
      "日期": "2026-06-01",
      "姓名": "张三",
      "上班时间": "09:30",
      "下班时间": "20:30",
      "考勤状态": "正常",
    });
  });

  it("can be parsed by the existing Excel preview pipeline", () => {
    const buffer = createAttendanceImportTemplate();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
    const preview = parseExcelBuffer(arrayBuffer);

    expect(preview.mapping).toMatchObject({
      date: "日期",
      name: "姓名",
      checkIn: "上班时间",
      checkOut: "下班时间",
      status: "考勤状态",
      remark: "备注",
    });
    expect(preview.totalRows).toBe(2);
    expect(preview.validRows).toBe(2);
  });
});
