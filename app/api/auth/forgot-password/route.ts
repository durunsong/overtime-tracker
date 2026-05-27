import { forgotPasswordSchema } from "@/lib/auth/validators";
import { requestPasswordReset } from "@/lib/auth/service";
import { isDatabaseConfigured } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured()) {
      return jsonResponse(
        { success: false, error: "未配置 DATABASE_URL，无法生成重置链接" },
        { status: 400 },
      );
    }

    const parsed = forgotPasswordSchema.parse(await request.json());
    const result = await requestPasswordReset(parsed.email, new URL(request.url).origin);

    return jsonResponse({
      success: true,
      data: result,
      message: "如果该邮箱存在，系统已生成密码重置链接",
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "生成重置链接失败" },
      { status: 400 },
    );
  }
}
