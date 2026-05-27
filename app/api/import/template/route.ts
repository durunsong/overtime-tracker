import { createAttendanceImportTemplate } from "@/lib/excel/import-template";

export function GET() {
  const buffer = createAttendanceImportTemplate();
  const body = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;
  const filename = "考勤导入模板.xlsx";

  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="attendance-import-template.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
