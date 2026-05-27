import { requireCurrentUser } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/auth/validators";
import { changePassword } from "@/lib/auth/service";
import { jsonResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const parsed = changePasswordSchema.parse(await request.json());
    await changePassword({
      userId: user.id,
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
    });

    return jsonResponse({ success: true, message: "密码已更新" });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "修改密码失败" },
      { status: 400 },
    );
  }
}
