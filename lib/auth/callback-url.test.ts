import { describe, expect, it } from "vitest";
import { buildLoginUrl, getSafeCallbackUrl } from "@/lib/auth/callback-url";

describe("auth callback url", () => {
  it("keeps an internal dashboard path with its query string", () => {
    expect(getSafeCallbackUrl("/dashboard/import?month=2026-05")).toBe("/dashboard/import?month=2026-05");
  });

  it("falls back to dashboard for external or auth callback targets", () => {
    expect(getSafeCallbackUrl("https://example.com/dashboard")).toBe("/dashboard");
    expect(getSafeCallbackUrl("//example.com/dashboard")).toBe("/dashboard");
    expect(getSafeCallbackUrl("/auth/login?callbackUrl=/dashboard")).toBe("/dashboard");
  });

  it("builds the login url with an encoded callbackUrl", () => {
    expect(buildLoginUrl("/dashboard/reports?month=2026-05")).toBe(
      "/auth/login?callbackUrl=%2Fdashboard%2Freports%3Fmonth%3D2026-05",
    );
  });
});
