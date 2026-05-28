import { describe, expect, it } from "vitest";
import { appendScreenshotFiles } from "./screenshot-file-queue";

describe("appendScreenshotFiles", () => {
  it("adds multiple screenshots and reports the overflow when the queue would exceed ten", () => {
    const current = Array.from({ length: 8 }, (_, index) => imageFile(`old-${index + 1}.png`));
    const incoming = Array.from({ length: 4 }, (_, index) => imageFile(`new-${index + 1}.png`));

    const result = appendScreenshotFiles(current, incoming);

    expect(result.files).toHaveLength(10);
    expect(result.rejectedCount).toBe(2);
    expect(result.files.map((file) => file.name)).toEqual([
      "old-1.png",
      "old-2.png",
      "old-3.png",
      "old-4.png",
      "old-5.png",
      "old-6.png",
      "old-7.png",
      "old-8.png",
      "new-1.png",
      "new-2.png",
    ]);
  });

  it("keeps unsupported or oversized files out of the queue", () => {
    const result = appendScreenshotFiles([], [
      imageFile("ok.png"),
      new File(["gif"], "bad.gif", { type: "image/gif" }),
      imageFile("huge.png", 11 * 1024 * 1024),
    ]);

    expect(result.files.map((file) => file.name)).toEqual(["ok.png"]);
    expect(result.invalidFiles.map((file) => file.name)).toEqual(["bad.gif", "huge.png"]);
  });
});

function imageFile(name: string, size = 1024) {
  return new File([new Uint8Array(size)], name, { type: "image/png" });
}
