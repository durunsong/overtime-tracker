"use client";

import type { ClipboardEvent } from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import { Download, FileUp, ImageUp, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ImportPreview } from "@/types/import";
import { formatMinutes } from "@/lib/attendance/formatter";
import { toDateKey } from "@/lib/attendance/parser";
import { getImportedRecordMonths } from "@/lib/import/import-summary";
import { extractImageFilesFromClipboardItems } from "./clipboard-images";

type ScreenshotImportResult = {
  preview: ImportPreview;
  batch: {
    id: string;
    successRows: number;
    failedRows: number;
    status: string;
  };
};

export function ImportWorkbench() {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [previewSource, setPreviewSource] = useState<"excel" | "screenshot" | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotResult, setScreenshotResult] = useState<ScreenshotImportResult | null>(null);
  const importedMonths = preview ? getImportedRecordMonths(preview) : [];
  const primaryImportedMonth = importedMonths[0];

  async function previewFile(file: File) {
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      toast.error("仅支持 .xlsx / .xls 文件");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小不能超过 10MB");
      return;
    }

    setLoading(true);
    setFileName(file.name);
    const form = new FormData();
    form.append("file", file);
    let result: { success: boolean; data?: ImportPreview; error?: string };
    try {
      const response = await fetch("/api/import/preview", { method: "POST", body: form });
      result = await response.json();
    } catch {
      setLoading(false);
      toast.error("上传失败，请检查本地服务或网络");
      return;
    }
    setLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "解析失败");
      return;
    }
    setPreview(result.data);
    setPreviewSource("excel");
    setScreenshotResult(null);
    toast.success("Excel 解析完成");
  }

  async function confirmImport() {
    if (!preview) return;
    const response = await fetch("/api/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileSize: 0, rows: preview.rows }),
    });
    const result = await response.json();
    if (result.success) {
      toast.success("导入完成");
    } else {
      toast.error(result.error ?? "导入失败，请检查数据库连接");
    }
  }

  async function importScreenshots(files: FileList | File[]) {
    const selectedFiles = Array.from(files);
    if (selectedFiles.length === 0) return;

    const invalidFile = selectedFiles.find(
      (file) => !/^image\/(png|jpe?g|webp)$/i.test(file.type) || file.size > 10 * 1024 * 1024,
    );
    if (invalidFile) {
      toast.error("仅支持 PNG / JPG / WebP，且单张不能超过 10MB");
      return;
    }

    setScreenshotLoading(true);
    setScreenshotResult(null);
    const form = new FormData();
    selectedFiles.forEach((file) => form.append("files", file));
    let result: { success: boolean; data?: ScreenshotImportResult; error?: string };
    try {
      const response = await fetch("/api/import/screenshot", { method: "POST", body: form });
      result = await response.json();
    } catch {
      setScreenshotLoading(false);
      toast.error("截图上传失败，请检查本地服务或网络");
      return;
    }
    setScreenshotLoading(false);

    if (!result.success || !result.data) {
      toast.error(result.error ?? "截图识别导入失败");
      return;
    }

    setPreview(result.data.preview);
    setPreviewSource("screenshot");
    setScreenshotResult(result.data);
    if (result.data.batch.successRows > 0) {
      toast.success(`AI 已识别并导入 ${result.data.batch.successRows} 条记录`);
    } else {
      toast.warning("AI 已完成识别，但没有有效记录写入日历，请在右侧预览中复核异常原因");
    }
  }

  function pasteScreenshots(event: ClipboardEvent<HTMLDivElement>) {
    const files = extractImageFilesFromClipboardItems(event.clipboardData.items);
    if (files.length === 0) {
      toast.error("剪贴板中没有可导入的 PNG / JPG / WebP 图片");
      return;
    }

    event.preventDefault();
    void importScreenshots(files);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>AI 截图自动导入</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              tabIndex={0}
              onPaste={pasteScreenshots}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void importScreenshots(event.dataTransfer.files);
              }}
              className="flex min-h-56 w-full flex-col items-center justify-center rounded-lg border border-dashed border-fuchsia-200/30 bg-fuchsia-200/5 p-8 text-center transition hover:bg-fuchsia-200/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-200/45"
            >
              {screenshotLoading ? (
                <Loader2 className="h-10 w-10 animate-spin text-fuchsia-100" />
              ) : (
                <ImageUp className="h-10 w-10 text-fuchsia-100" />
              )}
              <span className="mt-5 text-lg font-semibold text-white">上传打卡截图，AI 自动识别并写入</span>
              <span className="mt-2 text-sm text-slate-400">支持点击上传、拖拽或粘贴 PNG / JPG / WebP，可多选</span>
              <span className="mt-1 text-xs text-slate-500">选中此区域后按 Ctrl+V，可直接导入剪贴板截图</span>
              <Button className="mt-5" type="button" variant="secondary" onClick={() => imageInputRef.current?.click()}>
                <ImageUp className="h-4 w-4" /> 选择截图
              </Button>
            </div>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={(event) => {
                const files = event.target.files;
                if (files) void importScreenshots(files);
                event.currentTarget.value = "";
              }}
            />
            {screenshotResult ? (
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                  <span className="text-slate-500">批次</span>
                  <span className="float-right text-slate-200">{screenshotResult.batch.status}</span>
                </div>
                <div className="rounded-md border border-emerald-300/20 bg-emerald-300/5 px-3 py-2">
                  <span className="text-slate-500">已导入</span>
                  <span className="float-right text-emerald-100">{screenshotResult.batch.successRows}</span>
                </div>
                <div className="rounded-md border border-rose-300/20 bg-rose-300/5 px-3 py-2">
                  <span className="text-slate-500">需复核</span>
                  <span className="float-right text-rose-100">{screenshotResult.batch.failedRows}</span>
                </div>
                {primaryImportedMonth ? (
                  <Link
                    href={`/dashboard/calendar?month=${primaryImportedMonth}`}
                    className="rounded-md border border-cyan-300/20 bg-cyan-300/8 px-3 py-2 text-cyan-100 transition hover:bg-cyan-300/14"
                  >
                    查看日历
                    <span className="float-right">{primaryImportedMonth}</span>
                  </Link>
                ) : (
                  <div className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-slate-500">
                    未写入日历
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Excel 导入</CardTitle>
            <Button asChild variant="secondary" size="sm">
              <a href="/api/import/template" download="考勤导入模板.xlsx">
                <Download className="h-4 w-4" /> 下载模板
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) void previewFile(file);
              }}
              className="flex min-h-56 w-full flex-col items-center justify-center rounded-lg border border-dashed border-cyan-200/30 bg-cyan-200/5 p-8 text-center transition hover:bg-cyan-200/10"
            >
              <UploadCloud className="h-10 w-10 text-cyan-100" />
              <span className="mt-5 text-lg font-semibold text-white">拖拽或点击上传考勤 Excel</span>
              <span className="mt-2 text-sm text-slate-400">支持 .xlsx / .xls，可先下载模板填写，导入后自动识别并预填预览</span>
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void previewFile(file);
              }}
            />
            <Button className="mt-4 w-full" disabled={!preview || previewSource !== "excel" || loading} onClick={confirmImport}>
              <FileUp className="h-4 w-4" /> 确认导入 Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {previewSource === "screenshot" ? <Sparkles className="h-5 w-5 text-fuchsia-200" /> : null}
            字段映射与预览
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!preview ? (
            <div className="flex h-72 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-sm text-slate-500">
              上传 Excel 或打卡截图后展示识别、校验和导入结果
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {previewSource === "screenshot" ? <Badge tone="cyan">AI 截图识别</Badge> : <Badge tone="cyan">Excel 解析</Badge>}
                <Badge tone="cyan">总行数 {preview.totalRows}</Badge>
                <Badge tone="emerald">成功 {preview.validRows}</Badge>
                <Badge tone="rose">异常 {preview.invalidRows}</Badge>
              </div>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                {Object.entries(preview.mapping).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-2">
                    <span className="text-slate-500">{key}</span>
                    <span className="float-right text-slate-200">{value}</span>
                  </div>
                ))}
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2">行号</th>
                      <th className="px-3 py-2">日期</th>
                      <th className="px-3 py-2">上班</th>
                      <th className="px-3 py-2">下班</th>
                      <th className="px-3 py-2">加班</th>
                      <th className="px-3 py-2">校验</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 20).map((row) => (
                      <tr key={row.rowNumber} className="border-t border-white/8">
                        <td className="px-3 py-2">{row.rowNumber}</td>
                        <td className="px-3 py-2">{row.record?.workDate ? toDateKey(row.record.workDate) : "-"}</td>
                        <td className="px-3 py-2">{row.record?.rawCheckInText ?? "-"}</td>
                        <td className="px-3 py-2">{row.record?.rawCheckOutText ?? "-"}</td>
                        <td className="px-3 py-2">{formatMinutes(row.record?.overtimeMinutes ?? 0)}</td>
                        <td className="px-3 py-2">{row.errors.length ? row.errors.join("；") : "通过"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
