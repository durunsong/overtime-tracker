"use client";

import { useMemo, useState } from "react";
import { Download, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MonthPicker } from "@/components/ui/month-picker";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { AttendanceRecordView, AttendanceStatus } from "@/types/attendance";
import { formatMinutes } from "@/lib/attendance/formatter";
import { toDateKey } from "@/lib/attendance/parser";
import { DEFAULT_RECORD_FILTERS, isRecordStatusFilter, resetRecordFilters } from "./records-filter";

const statusLabel: Record<AttendanceStatus, string> = {
  NORMAL: "正常",
  LATE: "迟到",
  EARLY_LEAVE: "早退",
  ABSENT: "缺勤",
  REST_DAY: "休息日",
  HOLIDAY: "节假日",
  ABNORMAL: "异常",
};
const statusOptions = [
  { value: "ALL", label: "全部状态" },
  ...Object.entries(statusLabel).map(([value, label]) => ({ value, label })),
];

export function RecordsTable({ initialRecords }: { initialRecords: AttendanceRecordView[] }) {
  const [records, setRecords] = useState(initialRecords);
  const [keyword, setKeyword] = useState(DEFAULT_RECORD_FILTERS.keyword);
  const [status, setStatus] = useState(DEFAULT_RECORD_FILTERS.status);
  const [month, setMonth] = useState(DEFAULT_RECORD_FILTERS.month);

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        const matchMonth = toDateKey(record.workDate).startsWith(month);
        const matchStatus = status === "ALL" || record.status === status;
        const text = `${record.remark ?? ""} ${record.rawCheckInText ?? ""} ${record.rawCheckOutText ?? ""}`;
        return matchMonth && matchStatus && text.includes(keyword);
      }),
    [keyword, month, records, status],
  );

  function removeRecord(id: string) {
    fetch(`/api/records/${id}`, { method: "DELETE" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error ?? "删除失败");
        }
        setRecords((current) => current.filter((record) => record.id !== id));
        toast.success("已删除数据库记录");
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "删除失败");
      });
  }

  function resetFilters() {
    const nextFilters = resetRecordFilters();
    setKeyword(nextFilters.keyword);
    setMonth(nextFilters.month);
    setStatus(nextFilters.status);
  }

  function changeStatus(value: string) {
    if (isRecordStatusFilter(value)) {
      setStatus(value);
    }
  }

  function exportCsv() {
    const header = "日期,上班打卡,下班打卡,有效出勤,标准工时,加班时长,状态,来源,备注";
    const body = filtered
      .map((record) =>
        [
          toDateKey(record.workDate),
          record.rawCheckInText ?? "",
          record.rawCheckOutText ?? "",
          formatMinutes(record.actualWorkMinutes),
          formatMinutes(record.standardWorkMinutes),
          formatMinutes(record.overtimeMinutes),
          statusLabel[record.status],
          record.source,
          record.remark ?? "",
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([`\uFEFF${header}\n${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "attendance-records.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <CardTitle>打卡记录</CardTitle>
        <div className="flex flex-wrap gap-2">
          <MonthPicker
            value={month}
            onChange={setMonth}
            className="w-32"
            allowClear
            aria-label="选择记录月份"
          />
          <Select
            value={status}
            onChange={changeStatus}
            options={statusOptions}
            className="w-32"
            aria-label="选择打卡状态"
          />
          <Input placeholder="搜索备注" value={keyword} onChange={(event) => setKeyword(event.target.value)} className="w-40" />
          <Button variant="secondary" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4" /> 重置
          </Button>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4" /> 重新计算
          </Button>
          <Button variant="secondary" onClick={exportCsv}>
            <Download className="h-4 w-4" /> 导出
          </Button>
          <Button onClick={() => toast.info("请通过 Excel 导入或调用 POST /api/records 写入真实记录")}>
            <Plus className="h-4 w-4" /> 新增
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1110px] table-fixed border-separate border-spacing-y-2 text-sm">
            <colgroup>
              <col className="w-[112px]" />
              <col className="w-[92px]" />
              <col className="w-[92px]" />
              <col className="w-[100px]" />
              <col className="w-[92px]" />
              <col className="w-[100px]" />
              <col className="w-[80px]" />
              <col className="w-[128px]" />
              <col className="w-[250px]" />
              <col className="w-[64px]" />
            </colgroup>
            <thead className="text-left text-slate-500">
              <tr>
                <th className="px-3 py-2 whitespace-nowrap">日期</th>
                <th className="px-3 py-2 whitespace-nowrap">上班打卡</th>
                <th className="px-3 py-2 whitespace-nowrap">下班打卡</th>
                <th className="px-3 py-2">有效出勤</th>
                <th className="px-3 py-2 whitespace-nowrap">标准工时</th>
                <th className="px-3 py-2">加班时长</th>
                <th className="px-3 py-2 whitespace-nowrap">状态</th>
                <th className="px-3 py-2">来源</th>
                <th className="px-3 py-2">备注</th>
                <th className="px-3 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <tr key={record.id} className="bg-white/[0.04] text-slate-200">
                  <td className="rounded-l-md px-3 py-3 whitespace-nowrap">{toDateKey(record.workDate)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{record.rawCheckInText ?? "-"}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{record.rawCheckOutText ?? "-"}</td>
                  <td className="px-3 py-3">{formatMinutes(record.actualWorkMinutes)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{formatMinutes(record.standardWorkMinutes)}</td>
                  <td className="px-3 py-3 text-cyan-100">{formatMinutes(record.overtimeMinutes)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Badge tone={record.status === "NORMAL" ? "emerald" : "amber"}>
                      {statusLabel[record.status]}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">{record.source}</td>
                  <td className="truncate px-3 py-3" title={record.remark ?? "-"}>
                    {record.remark ?? "-"}
                  </td>
                  <td className="rounded-r-md px-3 py-3">
                    <Button variant="ghost" size="icon" onClick={() => removeRecord(record.id)} title="删除">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="rounded-md bg-white/[0.04] px-3 py-10 text-center text-slate-500">
                    数据库中暂无匹配的打卡记录
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
