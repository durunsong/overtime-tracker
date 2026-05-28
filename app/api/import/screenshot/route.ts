import { AttendanceStatus } from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { isAiConfigured } from "@/lib/ai/client";
import { parseAttendanceScreenshots, type ScreenshotImportFile } from "@/lib/ai/screenshot-import";
import { getDefaultUserId } from "@/lib/data/attendance-repository";
import { getScreenshotImportFileValidationError } from "@/lib/import/screenshot-files";
import { jsonResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (!isAiConfigured()) {
      return jsonResponse(
        { success: false, error: "AI 服务未配置，请设置 AI_BASE_URL、AI_API_KEY 和 AI_MODEL" },
        { status: 400 },
      );
    }

    if (!isDatabaseConfigured()) {
      return jsonResponse(
        { success: false, error: "未配置 DATABASE_URL，无法自动导入截图识别结果" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);
    const validationError = getScreenshotImportFileValidationError(files);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (validationError) {
      return jsonResponse({ success: false, error: validationError }, { status: 400 });
    }

    const imageFiles: ScreenshotImportFile[] = await Promise.all(
      files.map(async (file) => ({
        fileName: file.name,
        mimeType: file.type,
        buffer: await file.arrayBuffer(),
      })),
    );
    const preview = await parseAttendanceScreenshots(imageFiles);
    const validRows = preview.rows.filter((row) => row.record && row.errors.length === 0);
    const failedRows = preview.rows.length - validRows.length;
    const prisma = getPrisma();
    const userId = await getDefaultUserId();
    const batch = await prisma.importBatch.create({
      data: {
        userId,
        fileName: files.map((file) => file.name).join(", "),
        fileSize: totalSize,
        totalRows: preview.totalRows,
        successRows: validRows.length,
        failedRows,
        status:
          validRows.length === 0
            ? "FAILED"
            : failedRows > 0
              ? "PARTIAL_SUCCESS"
              : "SUCCESS",
        errorMessage: validRows.length === 0 ? "AI 未识别到可导入的有效打卡记录" : null,
      },
    });

    for (const row of validRows) {
      const record = row.record;
      if (!record) continue;

      await prisma.attendanceRecord.upsert({
        where: { userId_workDate: { userId, workDate: record.workDate } },
        update: {
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          rawCheckInText: record.rawCheckInText,
          rawCheckOutText: record.rawCheckOutText,
          actualWorkMinutes: record.actualWorkMinutes,
          standardWorkMinutes: record.standardWorkMinutes,
          overtimeMinutes: record.overtimeMinutes,
          lateMinutes: record.lateMinutes,
          earlyLeaveMinutes: record.earlyLeaveMinutes,
          status: record.status as AttendanceStatus,
          source: "EXCEL_IMPORT",
          importBatchId: batch.id,
          remark: appendScreenshotRemark(record.remark),
        },
        create: {
          userId,
          workDate: record.workDate,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          rawCheckInText: record.rawCheckInText,
          rawCheckOutText: record.rawCheckOutText,
          actualWorkMinutes: record.actualWorkMinutes,
          standardWorkMinutes: record.standardWorkMinutes,
          overtimeMinutes: record.overtimeMinutes,
          lateMinutes: record.lateMinutes,
          earlyLeaveMinutes: record.earlyLeaveMinutes,
          status: record.status as AttendanceStatus,
          source: "EXCEL_IMPORT",
          importBatchId: batch.id,
          remark: appendScreenshotRemark(record.remark),
        },
      });
    }

    return jsonResponse({ success: true, data: { preview, batch } });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "截图识别导入失败" },
      { status: 400 },
    );
  }
}

function appendScreenshotRemark(remark?: string | null) {
  return remark ? `AI 截图导入：${remark}` : "AI 截图导入";
}
