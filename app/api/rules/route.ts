import { defaultWorkRule } from "@/types/attendance";
import { workRuleSchema } from "@/lib/attendance/validators";
import { requireCurrentUserId } from "@/lib/auth/session";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return jsonResponse(
        { success: false, error: "未配置 DATABASE_URL，无法读取工作规则" },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const userId = await requireCurrentUserId();
    const existingRule = await prisma.workRule.findFirst({
      where: { userId, isDefault: true },
      orderBy: { updatedAt: "desc" },
    });
    const rule = existingRule ?? (await prisma.workRule.create({ data: { ...defaultWorkRule, userId } }));
    return jsonResponse({ success: true, data: rule });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "读取工作规则失败" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = workRuleSchema.parse(await request.json());

    if (!isDatabaseConfigured()) {
      return jsonResponse(
        { success: false, error: "未配置 DATABASE_URL，无法保存工作规则" },
        { status: 400 },
      );
    }

    const prisma = getPrisma();
    const userId = await requireCurrentUserId();
    await prisma.workRule.updateMany({ where: { userId }, data: { isDefault: false } });
    const rule = await prisma.workRule.create({
      data: {
        ...parsed,
        userId,
        isDefault: true,
      },
    });

    return jsonResponse({ success: true, data: rule });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "保存工作规则失败" },
      { status: 400 },
    );
  }
}
