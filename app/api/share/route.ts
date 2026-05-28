import { z } from "zod";
import { AuthRequiredError } from "@/lib/auth/session";
import { createCurrentUserOvertimeShare } from "@/lib/share/overtime-share";
import { jsonResponse } from "@/lib/utils";

const createShareSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "月份格式必须为 yyyy-MM").optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const input = createShareSchema.parse(body);
    const share = await createCurrentUserOvertimeShare(input.month);
    const origin = new URL(request.url).origin;

    return jsonResponse({
      success: true,
      data: {
        token: share.token,
        url: `${origin}/share/${share.token}`,
      },
      message: "分享链接已生成",
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return jsonResponse({ success: false, error: error.message }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return jsonResponse({ success: false, error: error.issues[0]?.message ?? "参数无效" }, { status: 400 });
    }

    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "生成分享链接失败" },
      { status: 400 },
    );
  }
}
