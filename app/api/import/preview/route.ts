import { parseExcelBuffer } from "@/lib/excel/parse-excel";
import { jsonResponse } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return jsonResponse({ success: false, error: "缺少 Excel 文件" }, { status: 400 });
    }

    const preview = parseExcelBuffer(await file.arrayBuffer());
    return jsonResponse({ success: true, data: preview });
  } catch (error) {
    return jsonResponse(
      { success: false, error: error instanceof Error ? error.message : "Excel 解析失败" },
      { status: 400 },
    );
  }
}
