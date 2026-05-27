import { z } from "zod";
import { normalizeEmail } from "@/lib/auth/password";
import { isPasswordPolicySatisfied, passwordPolicyDescription } from "@/lib/auth/password-policy";

const passwordSchema = z
  .string()
  .min(8, "密码至少需要 8 位")
  .max(72, "密码不能超过 72 位")
  .refine(isPasswordPolicySatisfied, passwordPolicyDescription);

export const loginSchema = z.object({
  email: z.string().email("请输入有效邮箱").transform(normalizeEmail),
  password: z.string().min(1, "请输入密码"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "请输入姓名").max(40, "姓名不能超过 40 个字符"),
  email: z.string().email("请输入有效邮箱").transform(normalizeEmail),
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("请输入有效邮箱").transform(normalizeEmail),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(16, "重置令牌无效"),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: passwordSchema,
});
