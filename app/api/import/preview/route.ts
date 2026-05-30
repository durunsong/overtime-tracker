import { parseExcelBuffer } from "@/lib/excel/parse-excel";
import { getImportFileValidationError } from "@/lib/excel/import-file";
import { requireCurrentUserId } from "@/lib/auth/session";
import { applyCurrentWorkRuleDefaults } from "@/lib/attendance/work-rule";
import { getPrisma, isDatabaseConfigured } from "@/lib/prisma";
import { jsonResponse } from "@/lib/utils";
import { defaultWorkRule } from "@/types/attendance";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonResponse({ success: false, error: "缺少 Excel 文件" }, { status: 400 });
    }
    const fileError = getImportFileValidationError(file);
    if (fileError) {
      return jsonResponse({ success: false, error: fileError }, { status: 400 });
    }

    const preview = parseExcelBuffer(await file.arrayBuffer(), undefined, await loadDefaultWorkRule());
    return jsonResponse({ success: true, data: preview });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Excel 解析失败" },
      { status: 400 },
    );
  }
}

async function loadDefaultWorkRule() {
  if (!isDatabaseConfigured()) {
    return defaultWorkRule;
  }

  const prisma = getPrisma();
  const userId = await requireCurrentUserId();
  const rule = await prisma.workRule.findFirst({
    where: { userId, isDefault: true },
    orderBy: { updatedAt: "desc" },
  });

  return rule ? applyCurrentWorkRuleDefaults(rule) : defaultWorkRule;
}
