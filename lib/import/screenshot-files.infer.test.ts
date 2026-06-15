import { describe, expect, it } from "vitest";
import { inferScreenshotMimeType } from "./screenshot-files";

describe("inferScreenshotMimeType", () => {
  it("falls back to file extension when browser mime type is empty", () => {
    expect(inferScreenshotMimeType("attendance.PNG", "")).toBe("image/png");
    expect(inferScreenshotMimeType("attendance.jpg", "")).toBe("image/jpeg");
  });
});
