import { cn } from "@/lib/utils";

type ImportDropzoneKind = "screenshot" | "excel";

export function getImportDropzoneClassName(kind: ImportDropzoneKind, active: boolean) {
  return cn(
    "import-dropzone flex min-h-56 w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition focus:outline-none",
    kind === "screenshot"
      ? "import-dropzone--screenshot border-fuchsia-200/30 bg-fuchsia-200/5 hover:bg-fuchsia-200/10 focus:ring-2 focus:ring-fuchsia-200/45"
      : "import-dropzone--excel border-cyan-200/30 bg-cyan-200/5 hover:bg-cyan-200/10",
    active && "import-dropzone--active",
  );
}

export function getImportDropzoneIconClassName(active: boolean) {
  return cn("import-dropzone__icon h-10 w-10", active && "import-dropzone__icon--active");
}
