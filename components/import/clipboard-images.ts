const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

const imageExtensions: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type ClipboardItemLike = {
  type: string;
  getAsFile: () => File | null;
};

export function extractImageFilesFromClipboardItems(items: Iterable<ClipboardItemLike>) {
  const files: File[] = [];

  for (const item of items) {
    if (!supportedImageTypes.has(item.type)) {
      continue;
    }

    const file = item.getAsFile();
    if (!file) {
      continue;
    }

    files.push(file.name ? file : renamePastedImage(file, files.length + 1));
  }

  return files;
}

function renamePastedImage(file: File, index: number) {
  const extension = imageExtensions[file.type] ?? "png";
  return new File([file], `pasted-attendance-${index}.${extension}`, {
    type: file.type,
    lastModified: file.lastModified,
  });
}
