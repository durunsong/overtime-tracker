import type { ChinaDayKind } from "@/types/calendar";

export type WorkDayOverrideKind = "FORCE_WORKDAY" | "FORCE_REST" | "FORCE_HOLIDAY";

export function resolveEffectiveDayKind(
  baseKind: ChinaDayKind,
  override?: WorkDayOverrideKind | null,
): ChinaDayKind | "FORCED_REST" {
  if (!override) return baseKind;

  switch (override) {
    case "FORCE_WORKDAY":
      return "WORKDAY";
    case "FORCE_HOLIDAY":
      return "HOLIDAY";
    case "FORCE_REST":
      return "FORCED_REST";
    default:
      return baseKind;
  }
}

export function isCountedNonWorkdayKind(
  kind: ChinaDayKind | "FORCED_REST",
  rule: { weekendEnabled: boolean; holidayEnabled: boolean },
) {
  if (kind === "FORCED_REST") return false;
  return (
    (kind === "WEEKEND" && rule.weekendEnabled) ||
    (kind === "HOLIDAY" && rule.holidayEnabled)
  );
}

export function isWeekendLikeKind(kind: ChinaDayKind | "FORCED_REST") {
  return kind === "WEEKEND";
}
