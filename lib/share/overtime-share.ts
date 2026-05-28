import { format } from "date-fns";
import { createSecureToken } from "@/lib/auth/password";
import { AuthRequiredError, getCurrentUser } from "@/lib/auth/session";
import { loadAttendanceRecords } from "@/lib/data/attendance-repository";
import { getPrisma } from "@/lib/prisma";
import { generateMonthlyReport } from "@/lib/reports/monthly";
import type { AttendanceRecordView } from "@/types/attendance";
import type { MonthlyReportView } from "@/types/report";

type PublicAttendanceRecord = Omit<
  AttendanceRecordView,
  "id" | "userId" | "workDate" | "checkInTime" | "checkOutTime"
> & {
  workDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
};

type PublicMonthlyReport = Omit<MonthlyReportView, "records"> & {
  records: PublicAttendanceRecord[];
};

export type OvertimeSharePayload = {
  version: 1;
  ownerName: string;
  createdAt: string;
  report: PublicMonthlyReport;
};

export type ParsedOvertimeSharePayload = Omit<OvertimeSharePayload, "createdAt" | "report"> & {
  createdAt: Date;
  report: Omit<MonthlyReportView, "records"> & {
    records: Omit<AttendanceRecordView, "id" | "userId">[];
  };
};

export function sanitizeShareToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,96}$/.test(token)) {
    throw new Error("分享链接无效");
  }
  return token;
}

export function buildOvertimeSharePayload(
  report: MonthlyReportView,
  options: { ownerName: string; createdAt?: Date },
): OvertimeSharePayload {
  return {
    version: 1,
    ownerName: options.ownerName,
    createdAt: (options.createdAt ?? new Date()).toISOString(),
    report: {
      ...report,
      records: report.records.map((record) => ({
        rawCheckInText: record.rawCheckInText,
        rawCheckOutText: record.rawCheckOutText,
        actualWorkMinutes: record.actualWorkMinutes,
        standardWorkMinutes: record.standardWorkMinutes,
        overtimeMinutes: record.overtimeMinutes,
        lateMinutes: record.lateMinutes,
        earlyLeaveMinutes: record.earlyLeaveMinutes,
        status: record.status,
        source: record.source,
        remark: record.remark,
        issues: record.issues,
        workDate: record.workDate.toISOString(),
        checkInTime: record.checkInTime?.toISOString() ?? null,
        checkOutTime: record.checkOutTime?.toISOString() ?? null,
      })),
    },
  };
}

export function parseOvertimeSharePayload(payload: OvertimeSharePayload): ParsedOvertimeSharePayload {
  return {
    ...payload,
    createdAt: new Date(payload.createdAt),
    report: {
      ...payload.report,
      records: payload.report.records.map((record, index) => ({
        ...record,
        id: `shared-${index}`,
        userId: "public-share",
        workDate: new Date(record.workDate),
        checkInTime: record.checkInTime ? new Date(record.checkInTime) : null,
        checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : null,
      })),
    },
  };
}

export async function createCurrentUserOvertimeShare(month = format(new Date(), "yyyy-MM")) {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthRequiredError("请先登录后再分享加班数据");
  }

  const records = await loadAttendanceRecords(month);
  const report = generateMonthlyReport(records, month);
  const payload = buildOvertimeSharePayload(report, { ownerName: user.name });
  const token = createSecureToken(24);

  await getPrisma().overtimeShare.create({
    data: {
      token,
      userId: user.id,
      month,
      ownerName: user.name,
      snapshotJson: payload,
    },
  });

  return { token, payload };
}

export async function loadPublicOvertimeShare(token: string) {
  const safeToken = sanitizeShareToken(token);
  const share = await getPrisma().overtimeShare.findUnique({
    where: { token: safeToken },
  });

  if (!share) return null;

  return {
    id: share.id,
    token: share.token,
    month: share.month,
    createdAt: share.createdAt,
    payload: parseOvertimeSharePayload(share.snapshotJson as OvertimeSharePayload),
  };
}
