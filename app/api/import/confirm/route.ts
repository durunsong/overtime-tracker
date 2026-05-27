import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";
import { getDefaultUserId, loadDefaultWorkRuleForUser } from "@/lib/data/attendance-repository";
import { normalizeImportedRecord } from "@/lib/excel/import-records";

const confirmSchema = z.object({
  fileName: z.string().min(1),
  fileSize: z.number().min(0),
  rows: z.array(
    z.object({
      errors: z.array(z.string()),
      record: z
        .object({
          workDate: z.coerce.date(),
          checkInTime: z.coerce.date().nullable(),
          checkOutTime: z.coerce.date().nullable(),
          rawCheckInText: z.string().nullable().optional(),
          rawCheckOutText: z.string().nullable().optional(),
          actualWorkMinutes: z.number(),
          standardWorkMinutes: z.number(),
          overtimeMinutes: z.number(),
          lateMinutes: z.number(),
          earlyLeaveMinutes: z.number(),
          status: z.enum([
            "NORMAL",
            "LATE",
            "EARLY_LEAVE",
            "ABSENT",
            "REST_DAY",
            "HOLIDAY",
            "ABNORMAL",
          ]),
          remark: z.string().nullable().optional(),
        })
        .optional(),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    const parsed = confirmSchema.parse(await request.json());
    const validRows = parsed.rows.filter((row) => row.record && row.errors.length === 0);
    const failedRows = parsed.rows.length - validRows.length;

    if (!isDatabaseConfigured()) {
      return jsonResponse(
        { success: false, error: "未配置 DATABASE_URL，无法写入导入数据" },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const userId = await getDefaultUserId();
    const rule = await loadDefaultWorkRuleForUser(userId);
    const batch = await prisma.importBatch.create({
      data: {
        userId,
        fileName: parsed.fileName,
        fileSize: parsed.fileSize,
        totalRows: parsed.rows.length,
        successRows: validRows.length,
        failedRows,
        status: failedRows > 0 ? "PARTIAL_SUCCESS" : "SUCCESS",
      },
    });

    for (const row of validRows) {
      if (!row.record) continue;
      const record = normalizeImportedRecord(row.record, rule);
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
          remark: record.remark,
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
          remark: record.remark,
        },
      });
    }

    return jsonResponse({ success: true, data: batch });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "确认导入失败" },
      { status: 400 },
    );
  }
}
