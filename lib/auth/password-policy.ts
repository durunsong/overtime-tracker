export type PasswordRuleId = "length" | "letter" | "number";

export type PasswordRule = {
  id: PasswordRuleId;
  label: string;
  test: (password: string) => boolean;
};

export type PasswordStrength = {
  score: number;
  label: string;
  tone: "empty" | "weak" | "fair" | "good" | "strong";
  percent: number;
  rules: Array<PasswordRule & { passed: boolean }>;
  policyPassed: boolean;
};

export const passwordRules: PasswordRule[] = [
  {
    id: "length",
    label: "至少 8 位",
    test: (password) => password.length >= 8,
  },
  {
    id: "letter",
    label: "包含字母",
    test: (password) => /[A-Za-z]/.test(password),
  },
  {
    id: "number",
    label: "包含数字",
    test: (password) => /\d/.test(password),
  },
];

export const passwordPolicyDescription = "密码至少 8 位，并且必须同时包含字母和数字";

export function isPasswordPolicySatisfied(password: string) {
  return passwordRules.every((rule) => rule.test(password));
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  const rules = passwordRules.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));

  if (!password) {
    return {
      score: 0,
      label: "等待输入",
      tone: "empty",
      percent: 0,
      rules,
      policyPassed: false,
    };
  }

  let score = rules.filter((rule) => rule.passed).length;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const normalizedScore = Math.min(score, 5);
  const policyPassed = rules.every((rule) => rule.passed);

  if (normalizedScore >= 5) {
    return { score: normalizedScore, label: "很强", tone: "strong", percent: 100, rules, policyPassed };
  }

  if (normalizedScore >= 4) {
    return { score: normalizedScore, label: "良好", tone: "good", percent: 80, rules, policyPassed };
  }

  if (normalizedScore >= 3) {
    return {
      score: normalizedScore,
      label: policyPassed ? "可用" : "待补齐",
      tone: "fair",
      percent: 60,
      rules,
      policyPassed,
    };
  }

  return { score: normalizedScore, label: "较弱", tone: "weak", percent: 30, rules, policyPassed };
}
