import { z } from "zod";
import { loadAttendanceRecords } from "@/lib/data/attendance-repository";
import { generateMonthlyReport } from "@/lib/reports/monthly";
import { exportMonthlyReportExcel } from "@/lib/reports/export-excel";
import { buildPrintableReportHtml } from "@/lib/reports/export-pdf";

const schema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  type: z.enum(["excel", "html"]),
});

export async function POST(request: Request) {
  const { month, type } = schema.parse(await request.json());
  const report = generateMonthlyReport(await loadAttendanceRecords(month), month);

  if (type === "html") {
    return new Response(buildPrintableReportHtml(report), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const buffer = exportMonthlyReportExcel(report);
  const body = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${month}-overtime-report.xlsx"`,
    },
  });
}
