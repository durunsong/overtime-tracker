import { defaultWorkRule, type WorkRuleInput } from "@/types/attendance";

export function applyCurrentWorkRuleDefaults(rule: WorkRuleInput): WorkRuleInput {
  if (!isInitialLegacyDefaultRule(rule)) return rule;

  return {
    ...rule,
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
