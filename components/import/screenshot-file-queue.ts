const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export const maxScreenshotQueueCount = 10;
export const maxScreenshotQueueFileSize = 10 * 1024 * 1024;

export type ScreenshotFileQueueResult = {
  files: File[];
  invalidFiles: File[];
  rejectedCount: number;
};

export function appendScreenshotFiles(currentFiles: File[], incomingFiles: File[]): ScreenshotFileQueueResult {
  const validIncoming = incomingFiles.filter(isSupportedScreenshotFile);
  const invalidFiles = incomingFiles.filter((file) => !isSupportedScreenshotFile(file));
  const availableSlots = Math.max(0, maxScreenshotQueueCount - currentFiles.length);
  const acceptedIncoming = validIncoming.slice(0, availableSlots);

  return {
    files: [...currentFiles, ...acceptedIncoming],
    invalidFiles,
    rejectedCount: validIncoming.length - acceptedIncoming.length,
  };
}

function isSupportedScreenshotFile(file: File) {
  return supportedImageTypes.has(file.type) && file.size <= maxScreenshotQueueFileSize;
}
