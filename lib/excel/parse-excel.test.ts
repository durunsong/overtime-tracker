import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { toDateKey } from "@/lib/attendance/parser";
import { parseExcelBuffer } from "./parse-excel";

describe("parseExcelBuffer", () => {
  it("keeps all parsed rows available for confirm import", () => {
    const rows = Array.from({ length: 26 }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return {
        date: `2026-05-${day}`,
        name: "Test User",
        checkIn: "09:30",
        checkOut: "20:00",
        status: "normal",
        remark: "",
      };
    });
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "attendance");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;

    const preview = parseExcelBuffer(arrayBuffer);

    expect(preview.totalRows).toBe(26);
    expect(preview.rows).toHaveLength(26);
    expect(toDateKey(preview.rows.at(-1)?.record?.workDate as Date)).toBe("2026-05-26");
  });

  it("treats rest day rows without punch times as importable records", () => {
    const rows = [
      {
        日期: "2026-05-01",
        姓名: "Test User",
        上班时间: "",
        下班时间: "",
        考勤状态: "休息",
        备注: "星期五",
      },
    ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "attendance");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;

    const preview = parseExcelBuffer(arrayBuffer);

    expect(preview.validRows).toBe(1);
    expect(preview.invalidRows).toBe(0);
    expect(preview.rows[0]?.record?.status).toBe("REST_DAY");
    expect(preview.rows[0]?.errors).toEqual([]);
  });
});
