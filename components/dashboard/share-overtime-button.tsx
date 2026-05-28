"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ApiResponse } from "@/types/api";

type ShareResponse = {
  token: string;
  url: string;
};

export function ShareOvertimeButton() {
  const [loading, setLoading] = useState(false);

  async function shareOvertime() {
    setLoading(true);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as ApiResponse<ShareResponse>;

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error ?? "生成分享链接失败");
      }

      try {
        await navigator.clipboard.writeText(payload.data.url);
        toast.success("分享链接已复制", {
          description: "别人打开链接即可免登录查看这次分享的数据。",
        });
      } catch {
        window.prompt("分享链接已生成，请复制后发送给对方", payload.data.url);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成分享链接失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={shareOvertime} disabled={loading}>
      <Share2 className="h-4 w-4" />
      {loading ? "生成中" : "分享我的加班数据"}
    </Button>
  );
}
