const maxImportFileSize = 20 * 1024 * 1024;
const allowedImportExtensions = new Set([".xlsx", ".xls"]);

type ImportFileLike = {
  name: string;
  size: number;
  type?: string;
};

export function getImportFileValidationError(file: ImportFileLike) {
  if (file.size > maxImportFileSize) {
    return "Excel 文件不能超过 20MB";
  }

  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = [...allowedImportExtensions].some((extension) =>
    lowerName.endsWith(extension),
  );

  if (!hasAllowedExtension) {
    return "仅支持 .xlsx 或 .xls 文件";
  }

  return null;
}
