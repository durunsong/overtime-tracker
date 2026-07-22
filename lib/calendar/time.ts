import { combineBusinessDateAndTime } from "@/lib/date/timezone";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateCalendarTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (!timePattern.test(value)) {
    throw new Error("时间格式必须为 HH:mm，且不能超过 23:59");
  }

  return value;
}

export function combineDateAndTime(date: string, time: string | null) {
  if (!time) {
    return null;
  }

  return combineBusinessDateAndTime(date, time);
}
