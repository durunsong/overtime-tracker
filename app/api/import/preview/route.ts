import { parseExcelBuffer } from "@/lib/excel/parse-excel";
import { getImportFileValidationError } from "@/lib/excel/import-file";
import { requireCurrentUserId } from "@/lib/auth/session";
import { ensureDefaultWorkRuleForUser } from "@/lib/data/work-rule-repository";
import { isDatabaseConfigured } from "@/lib/prisma";
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

    const rule = await loadDefaultWorkRule();
    const preview = parseExcelBuffer(await file.arrayBuffer(), undefined, rule);
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

  const userId = await requireCurrentUserId();
  return ensureDefaultWorkRuleForUser(userId);
}
