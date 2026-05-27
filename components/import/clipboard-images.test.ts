import { describe, expect, it } from "vitest";
import { extractImageFilesFromClipboardItems } from "./clipboard-images";

function clipboardItem(type: string, file: File | null) {
  return {
    type,
    getAsFile: () => file,
  };
}

describe("extractImageFilesFromClipboardItems", () => {
  it("extracts only supported pasted images and assigns fallback names", () => {
    const png = new File(["png"], "", { type: "image/png" });
    const webp = new File(["webp"], "attendance.webp", { type: "image/webp" });
    const text = new File(["text"], "note.txt", { type: "text/plain" });

    const files = extractImageFilesFromClipboardItems([
      clipboardItem("text/plain", text),
      clipboardItem("image/png", png),
      clipboardItem("image/gif", new File(["gif"], "skip.gif", { type: "image/gif" })),
      clipboardItem("image/webp", webp),
      clipboardItem("image/jpeg", null),
    ]);

    expect(files).toHaveLength(2);
    expect(files[0]?.name).toBe("pasted-attendance-1.png");
    expect(files[0]?.type).toBe("image/png");
    expect(files[1]?.name).toBe("attendance.webp");
  });
});
