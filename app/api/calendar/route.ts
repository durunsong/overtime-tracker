import { z } from "zod";
import { jsonResponse } from "@/lib/utils";
import { loadAttendanceRecords, upsertAttendanceRecordByDate } from "@/lib/data/attendance-repository";
import { requireCurrentUserId } from "@/lib/auth/session";
import {
  clearWorkDayOverride,
  listWorkDayOverrides,
  loadWorkDayOverrideMapForUser,
  upsertWorkDayOverride,
} from "@/lib/data/work-day-override-repository";
import { recalculateAllAttendanceForUser } from "@/lib/data/work-rule-repository";
import { loadDefaultWorkRuleForUser } from "@/lib/data/work-rule-repository";
import { buildCalendarMonth } from "@/lib/calendar/china-calendar";
import { combineDateAndTime, validateCalendarTime } from "@/lib/calendar/time";

const querySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

const saveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkInTime: z.string().nullable().optional(),
  checkOutTime: z.string().nullable().optional(),
  remark: z.string().max(500).nullable().optional(),
});

const overrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(["FORCE_WORKDAY", "FORCE_REST", "FORCE_HOLIDAY"]).nullable(),
  remark: z.string().max(200).nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const query = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const userId = await requireCurrentUserId();
    const [records, overrideMap] = await Promise.all([
      loadAttendanceRecords(query.month),
      loadWorkDayOverrideMapForUser(userId, query.month),
    ]);
    return jsonResponse({
      success: true,
      data: {
        calendar: buildCalendarMonth(query.month, records, overrideMap),
        overrides: await listWorkDayOverrides(userId, query.month),
      },
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "读取日历失败" },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = saveSchema.parse(await request.json());
    const checkInText = validateCalendarTime(body.checkInTime);
    const checkOutText = validateCalendarTime(body.checkOutTime);
    const record = await upsertAttendanceRecordByDate({
      workDate: combineDateAndTime(body.date, "00:00") as Date,
      checkInTime: combineDateAndTime(body.date, checkInText),
      checkOutTime: combineDateAndTime(body.date, checkOutText),
      rawCheckInText: checkInText,
      rawCheckOutText: checkOutText,
      remark: body.remark,
    });

    return jsonResponse({ success: true, data: record });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "保存日历记录失败" },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = overrideSchema.parse(await request.json());
    const userId = await requireCurrentUserId();

    if (!body.kind) {
      await clearWorkDayOverride(userId, body.date);
    } else {
      await upsertWorkDayOverride(userId, {
        workDate: new Date(`${body.date}T00:00:00`),
        kind: body.kind,
        remark: body.remark,
      });
    }

    const rule = await loadDefaultWorkRuleForUser(userId);
    const overrideMap = await loadWorkDayOverrideMapForUser(userId);
    await recalculateAllAttendanceForUser(userId, rule, overrideMap);

    const month = body.date.slice(0, 7);
    const records = await loadAttendanceRecords(month);
    const calendar = buildCalendarMonth(month, records, overrideMap);

    return jsonResponse({
      success: true,
      data: calendar,
      message: body.kind ? "日期口径已更新" : "已恢复系统默认日历口径",
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "更新日期口径失败" },
      { status: 400 },
    );
  }
}
