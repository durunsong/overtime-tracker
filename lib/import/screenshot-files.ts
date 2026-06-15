const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export const maxScreenshotFileCount = 10;
export const maxScreenshotFileSize = 10 * 1024 * 1024;
export const maxScreenshotTotalSize = 50 * 1024 * 1024;

type ScreenshotFileLike = {
  type: string;
  size: number;
};

export function getScreenshotImportFileValidationError(files: ScreenshotFileLike[]) {
  if (files.length === 0) {
    return "请上传至少一张打卡截图";
  }

  if (files.length > maxScreenshotFileCount) {
    return "一次最多导入 10 张截图，请分批上传";
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxScreenshotTotalSize) {
    return "截图总大小不能超过 50MB";
  }

  const invalidFile = files.find(
    (file) => !allowedImageTypes.has(file.type) || file.size > maxScreenshotFileSize,
  );
  if (invalidFile) {
    return "仅支持 PNG / JPG / WebP，且单张不能超过 10MB";
  }

  return null;
}
