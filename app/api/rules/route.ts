import { applyCurrentWorkRuleDefaults, validateWorkRuleInput } from "@/lib/attendance/work-rule";
import { workRuleSchema } from "@/lib/attendance/validators";
import { requireCurrentUserId } from "@/lib/auth/session";
import {
  ensureDefaultWorkRuleForUser,
  saveDefaultWorkRuleForUser,
} from "@/lib/data/work-rule-repository";
import { isDatabaseConfigured } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";

export async function GET() {
  try {
    if (!isDatabaseConfigured()) {
      return jsonResponse(
        { success: false, error: "未配置 DATABASE_URL，无法读取工作规则" },
        { status: 400 },
      );
    }

    const userId = await requireCurrentUserId();
    const rule = await ensureDefaultWorkRuleForUser(userId);
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
    const normalized = applyCurrentWorkRuleDefaults(parsed);
    const validationErrors = validateWorkRuleInput(normalized);
    if (validationErrors.length > 0) {
      return jsonResponse({ success: false, error: validationErrors.join("；") }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return jsonResponse(
        { success: false, error: "未配置 DATABASE_URL，无法保存工作规则" },
        { status: 400 },
      );
    }

    const userId = await requireCurrentUserId();
    const rule = await saveDefaultWorkRuleForUser(userId, normalized);

    return jsonResponse({
      success: true,
      data: rule,
      message: "规则已保存，历史打卡记录已按新规则重新计算",
    });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "保存工作规则失败" },
      { status: 400 },
    );
  }
}
