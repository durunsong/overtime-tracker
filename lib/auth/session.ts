import { cookies } from "next/headers";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { createSecureToken, hashToken } from "@/lib/auth/password";

export const sessionCookieName = "ot_session";
const sessionDays = 30;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

export class AuthRequiredError extends Error {
  constructor(message = "请先登录后再继续操作") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export function getSessionExpiry(now = new Date()) {
  return new Date(now.getTime() + sessionDays * 24 * 60 * 60 * 1000);
}

export async function createUserSession(userId: string) {
  const prisma = getPrisma();
  const token = createSecureToken();
  const expiresAt = getSessionExpiry();

  await prisma.userSession.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isDatabaseConfigured()) return null;

  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;

  const prisma = getPrisma();
  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.userSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return session.user;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthRequiredError();
  return user;
}

export async function requireCurrentUserId() {
  const user = await requireCurrentUser();
  return user.id;
}

export async function deleteCurrentSession() {
  if (!isDatabaseConfigured()) {
    await clearSessionCookie();
    return;
  }

  const token = (await cookies()).get(sessionCookieName)?.value;
  if (token) {
    await getPrisma().userSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  await clearSessionCookie();
}
