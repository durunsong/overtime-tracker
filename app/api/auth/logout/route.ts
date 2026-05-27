import { deleteCurrentSession } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/utils";

export async function POST() {
  await deleteCurrentSession();
  return jsonResponse({ success: true, message: "已退出登录" });
}
