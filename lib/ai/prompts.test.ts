import { describe, expect, it } from "vitest";
import { buildScreenshotImportPrompt } from "./prompts";

describe("buildScreenshotImportPrompt", () => {
  it("injects today and forbids using the today outline as punch date", () => {
    const prompt = buildScreenshotImportPrompt(["calendar.png"], "2026-07-22");

    expect(prompt).toContain("今天（系统当前日期）是 2026-07-22");
    expect(prompt).toContain("records.date 禁止使用 2026-07-22");
    expect(prompt).toContain("优先使用 2026");
    expect(prompt).toContain("实心高亮 17");
    expect(prompt).toContain("2026-07-17");
    expect(prompt).toContain("绝不能写成 2026-07-22。");
  });
});
