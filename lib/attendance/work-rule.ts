import { defaultWorkRule, type WorkRuleInput } from "@/types/attendance";
import type { WorkRuleSnapshot } from "@/types/report";

type WorkRuleLike = Partial<WorkRuleInput> & {
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
  lunchBreakStartTime?: string | null;
  isDefault?: boolean;
};

export function toWorkRuleInput(rule: WorkRuleLike): WorkRuleInput {
  return {
    name: rule.name,
    startTime: rule.startTime,
    endTime: rule.endTime,
    standardWorkMinutes: rule.standardWorkMinutes,
    overtimeStartTime: rule.overtimeStartTime,
    beforeStartNotCount: rule.beforeStartNotCount,
    lunchBreakStartTime: rule.lunchBreakStartTime ?? defaultWorkRule.lunchBreakStartTime,
    lunchBreakEnabled: rule.lunchBreakEnabled,
    lunchBreakMinutes: rule.lunchBreakMinutes,
    weekendEnabled: rule.weekendEnabled,
    holidayEnabled: rule.holidayEnabled,
    isDefault: rule.isDefault,
  };
}

export function applyCurrentWorkRuleDefaults(rule: WorkRuleInput): WorkRuleInput {
  if (!isInitialLegacyDefaultRule(rule)) return rule;

  return {
    ...rule,
    lunchBreakStartTime: rule.lunchBreakStartTime || defaultWorkRule.lunchBreakStartTime,
    lunchBreakEnabled: defaultWorkRule.lunchBreakEnabled,
    lunchBreakMinutes: defaultWorkRule.lunchBreakMinutes,
    weekendEnabled: defaultWorkRule.weekendEnabled,
  };
}

function isInitialLegacyDefaultRule(rule: WorkRuleInput) {
  return (
    rule.startTime === defaultWorkRule.startTime &&
    rule.endTime === defaultWorkRule.endTime &&
    rule.standardWorkMinutes === defaultWorkRule.standardWorkMinutes &&
    rule.overtimeStartTime === defaultWorkRule.overtimeStartTime &&
    rule.beforeStartNotCount === defaultWorkRule.beforeStartNotCount &&
    rule.lunchBreakEnabled === false &&
    rule.lunchBreakMinutes === 0 &&
    rule.weekendEnabled === false
  );
}

export function toWorkRuleSnapshot(rule: WorkRuleInput): WorkRuleSnapshot {
  return {
    name: rule.name,
    startTime: rule.startTime,
    endTime: rule.endTime,
    standardWorkMinutes: rule.standardWorkMinutes,
    overtimeStartTime: rule.overtimeStartTime,
    beforeStartNotCount: rule.beforeStartNotCount,
    lunchBreakStartTime: rule.lunchBreakStartTime,
    lunchBreakEnabled: rule.lunchBreakEnabled,
    lunchBreakMinutes: rule.lunchBreakMinutes,
    weekendEnabled: rule.weekendEnabled,
    holidayEnabled: rule.holidayEnabled,
  };
}

function timeToMinutes(value: string) {
  const [hourText, minuteText] = value.split(":");
  return Number(hourText) * 60 + Number(minuteText);
}

export function validateWorkRuleInput(rule: WorkRuleInput) {
  const errors: string[] = [];
  const start = timeToMinutes(rule.startTime);
  const end = timeToMinutes(rule.endTime);
  const overtimeStart = timeToMinutes(rule.overtimeStartTime);

  if (end <= start) {
    errors.push("下班时间必须晚于上班时间");
  }
  if (overtimeStart < end) {
    errors.push("加班开始时间不应早于下班时间");
  }
  if (rule.lunchBreakEnabled && rule.lunchBreakMinutes <= 0) {
    errors.push("启用午休扣减时，午休分钟必须大于 0");
  }

  return errors;
}

export function formatWorkRuleSummary(rule: WorkRuleInput | WorkRuleSnapshot) {
  const lunchWindow = rule.lunchBreakEnabled
    ? `${rule.lunchBreakStartTime} 起 ${rule.lunchBreakMinutes} 分钟`
    : "不扣减";
  return [
    `规则名称：${rule.name}`,
    `工作日：${rule.startTime}-${rule.endTime}`,
    `标准工时：${rule.standardWorkMinutes} 分钟`,
    `加班起点：${rule.overtimeStartTime}`,
    `早到不多算：${rule.beforeStartNotCount ? "是" : "否"}`,
    `午休：${lunchWindow}`,
    `周末计入加班：${rule.weekendEnabled ? "是" : "否"}`,
    `节假日计入加班：${rule.holidayEnabled ? "是" : "否"}`,
  ].join("\n");
}
