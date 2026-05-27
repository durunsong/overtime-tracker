import { jsonResponse } from "@/lib/utils";
import { isDatabaseConfigured } from "@/lib/prisma";
import { registerSchema } from "@/lib/auth/validators";
import { registerUser } from "@/lib/auth/service";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return jsonResponse({ success: false, error: "未配置 DATABASE_URL，无法注册账号" }, { status: 400 });
    }

    const parsed = registerSchema.parse(await request.json());
    const result = await registerUser(parsed);
    await setSessionCookie(result.session.token, result.session.expiresAt);

    return jsonResponse({ success: true, data: result.user });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "注册失败" },
      { status: 400 },
    );
  }
}
