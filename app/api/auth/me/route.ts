import { getCurrentUser } from "@/lib/auth/session";
import { jsonResponse } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  return jsonResponse({ success: true, data: user });
}
