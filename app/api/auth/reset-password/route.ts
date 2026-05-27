import { resetPasswordSchema } from "@/lib/auth/validators";
import { resetPassword } from "@/lib/auth/service";
import { isDatabaseConfigured } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return jsonResponse({ success: false, error: "未配置 DATABASE_URL，无法重置密码" }, { status: 400 });
    }

    const parsed = resetPasswordSchema.parse(await request.json());
    await resetPassword(parsed);

    return jsonResponse({ success: true, message: "密码已重置，请重新登录" });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "重置密码失败" },
      { status: 400 },
    );
  }
}
