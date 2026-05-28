import { describe, expect, it } from "vitest";
import { getScreenshotImportFileValidationError } from "./screenshot-files";

describe("getScreenshotImportFileValidationError", () => {
  it("rejects more than ten screenshots", () => {
    const files = Array.from({ length: 11 }, (_, index) => imageFile(`shot-${index + 1}.png`, 1024));

    expect(getScreenshotImportFileValidationError(files)).toBe("一次最多导入 10 张截图，请分批上传");
  });

  it("allows ten screenshots when each file and total size are within limits", () => {
    const files = Array.from({ length: 10 }, (_, index) => imageFile(`shot-${index + 1}.png`, 1024));

    expect(getScreenshotImportFileValidationError(files)).toBeNull();
  });

  it("rejects total size above fifty megabytes", () => {
    const files = Array.from({ length: 10 }, (_, index) => imageFile(`shot-${index + 1}.png`, 6 * 1024 * 1024));

    expect(getScreenshotImportFileValidationError(files)).toBe("截图总大小不能超过 50MB");
  });
});

function imageFile(name: string, size: number) {
  return new File([new Uint8Array(size)], name, { type: "image/png" });
}
