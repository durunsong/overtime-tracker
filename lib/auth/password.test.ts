import { describe, expect, it } from "vitest";
import {
  hashPassword,
  hashToken,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth/password";
import { evaluatePasswordStrength, isPasswordPolicySatisfied } from "@/lib/auth/password-policy";

describe("auth password utilities", () => {
  it("normalizes emails before account lookup", () => {
    expect(normalizeEmail("  DurunSongs@Gmail.COM ")).toBe("durunsongs@gmail.com");
  });

  it("hashes passwords without storing plaintext and verifies the correct secret", async () => {
    const hash = await hashPassword("CorrectHorseBattery9");

    expect(hash).not.toContain("CorrectHorseBattery9");
    expect(hash.split(":")).toHaveLength(4);
    await expect(verifyPassword("CorrectHorseBattery9", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("creates deterministic hashes for reset/session tokens", () => {
    const token = "one-time-reset-token";

    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });

  it("requires passwords to contain at least letters and numbers", () => {
    expect(isPasswordPolicySatisfied("onlyletters")).toBe(false);
    expect(isPasswordPolicySatisfied("12345678")).toBe(false);
    expect(isPasswordPolicySatisfied("abc12345")).toBe(true);
  });

  it("reports password strength and missing policy rules", () => {
    const weak = evaluatePasswordStrength("abc");
    const strong = evaluatePasswordStrength("Workday-2026-Strong");

    expect(weak.policyPassed).toBe(false);
    expect(weak.rules.filter((rule) => rule.passed).map((rule) => rule.id)).toEqual(["letter"]);
    expect(strong.policyPassed).toBe(true);
    expect(strong.tone).toBe("strong");
  });
});
