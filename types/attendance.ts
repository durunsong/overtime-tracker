export type AttendanceStatus =
  | "NORMAL"
  | "LATE"
  | "EARLY_LEAVE"
  | "ABSENT"
  | "REST_DAY"
  | "HOLIDAY"
  | "ABNORMAL";

export type AttendanceSource = "MANUAL" | "EXCEL_IMPORT";

export type WorkRuleInput = {
  name: string;
  startTime: string;
  endTime: string;
  standardWorkMinutes: number;
  overtimeStartTime: string;
  beforeStartNotCount: boolean;
  lunchBreakEnabled: boolean;
  lunchBreakMinutes: number;
  weekendEnabled: boolean;
  holidayEnabled: boolean;
  isDefault?: boolean;
};

export type AttendanceInput = {
  workDate: Date;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  rawCheckInText?: string | null;
  rawCheckOutText?: string | null;
  remark?: string | null;
};

export type AttendanceCalculation = {
  actualWorkMinutes: number;
  standardWorkMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  status: AttendanceStatus;
  issues: string[];
};

export type AttendanceRecordView = AttendanceInput &
  AttendanceCalculation & {
    id: string;
    userId?: string;
    source: AttendanceSource;
  };

export type AttendanceRowInput = {
  name?: string;
  date?: unknown;
  checkIn?: unknown;
  checkOut?: unknown;
  statusText?: string;
  remark?: string;
};

export const defaultWorkRule: WorkRuleInput = {
  name: "默认工作日规则",
  startTime: "09:30",
  endTime: "19:00",
  standardWorkMinutes: 480,
  overtimeStartTime: "19:00",
  beforeStartNotCount: true,
  lunchBreakEnabled: false,
  lunchBreakMinutes: 0,
  weekendEnabled: false,
  holidayEnabled: false,
  isDefault: true,
};
