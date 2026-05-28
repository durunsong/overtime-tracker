import { describe, expect, it } from "vitest";
import { getImportDropzoneClassName, getImportDropzoneIconClassName } from "./import-dropzone-styles";

describe("getImportDropzoneClassName", () => {
  it("uses screenshot scanning motion when the AI image zone is active", () => {
    const className = getImportDropzoneClassName("screenshot", true);

    expect(className).toContain("import-dropzone--screenshot");
    expect(className).toContain("import-dropzone--active");
    expect(className).not.toContain("import-dropzone--excel");
  });

  it("uses spreadsheet data motion when the Excel zone is active", () => {
    const className = getImportDropzoneClassName("excel", true);

    expect(className).toContain("import-dropzone--excel");
    expect(className).toContain("import-dropzone--active");
    expect(className).not.toContain("import-dropzone--screenshot");
  });
});

describe("getImportDropzoneIconClassName", () => {
  it("keeps icon motion scoped to the active zone only", () => {
    expect(getImportDropzoneIconClassName(true)).toContain("import-dropzone__icon--active");
    expect(getImportDropzoneIconClassName(false)).not.toContain("import-dropzone__icon--active");
  });
});
