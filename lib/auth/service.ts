import { getPrisma } from "@/lib/prisma";
import {
  createSecureToken,
  hashPassword,
  hashToken,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth/password";
import { createUserSession } from "@/lib/auth/session";
import { ensureDefaultWorkRuleForUser } from "@/lib/data/work-rule-repository";

const resetTokenMinutes = 30;

export type AuthResult = {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  session: {
    token: string;
    expiresAt: Date;
  };
};

export async function registerUser(input: { name: string; email: string; password: string }) {
  const prisma = getPrisma();
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser?.passwordHash) {
    throw new Error("该邮箱已注册，请直接登录");
  }

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: input.name.trim() || existingUser.name,
          passwordHash,
        },
        select: { id: true, name: true, email: true, avatar: true },
      })
    : await prisma.user.create({
        data: {
          name: input.name.trim(),
          email,
          passwordHash,
        },
        select: { id: true, name: true, email: true, avatar: true },
      });

  await ensureDefaultWorkRuleForUser(user.id);

  return withSession(user);
}

export async function loginUser(input: { email: string; password: string }) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(input.email) },
    select: { id: true, name: true, email: true, avatar: true, passwordHash: true },
  });

  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new Error("邮箱或密码不正确");
  }

  await ensureDefaultWorkRuleForUser(user.id);

  return withSession({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  });
}

export async function requestPasswordReset(emailInput: string, origin: string) {
  const email = normalizeEmail(emailInput);
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) return null;

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = createSecureToken();
  const expiresAt = new Date(Date.now() + resetTokenMinutes * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
    resetUrl: `${origin}/auth/reset-password?token=${encodeURIComponent(token)}`,
  };
}

export async function resetPassword(input: { token: string; password: string }) {
  const prisma = getPrisma();
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(input.token) },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    throw new Error("重置链接无效或已过期");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await hashPassword(input.password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.userSession.deleteMany({ where: { userId: resetToken.userId } }),
  ]);
}

export async function changePassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { passwordHash: true },
  });

  if (!user || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new Error("当前密码不正确");
  }

  await prisma.user.update({
    where: { id: input.userId },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });
}

async function withSession(user: AuthResult["user"]): Promise<AuthResult> {
  const session = await createUserSession(user.id);
  return { user, session };
}
