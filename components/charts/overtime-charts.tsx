"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/types/report";
import { minutesToDecimalHours } from "@/lib/attendance/formatter";

type ChartPoint = TrendPoint & {
  加班小时: number;
  出勤小时: number;
};

type DailyTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{
    payload?: ChartPoint;
  }>;
};

function normalize(data: TrendPoint[]): ChartPoint[] {
  return data.map((item) => ({
    ...item,
    加班小时: minutesToDecimalHours(item.overtimeMinutes),
    出勤小时: minutesToDecimalHours(item.workMinutes),
  }));
}

export function DailyOvertimeBar({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={normalize(data)}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.05)" }}
          content={<DailyOvertimeTooltip />}
        />
        <Bar dataKey="加班小时" radius={[6, 6, 0, 0]} fill="#67e8f9" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DailyOvertimeTooltip({ active, payload, label }: DailyTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  const overtimeHours = point?.加班小时 ?? 0;
  const punchTimeRange = point?.punchTimeRange;

  return (
    <div className="rounded-md border border-white/12 bg-slate-950/95 px-3 py-2 text-sm text-white shadow-[0_18px_60px_rgba(2,6,23,0.35)]">
      <p className="font-semibold">{label}</p>
      <p className="mt-1 text-cyan-200">加班小时：{overtimeHours}</p>
      {punchTimeRange ? (
        <p className="mt-1 text-slate-300">打卡时间：{punchTimeRange}</p>
      ) : null}
    </div>
  );
}

export function WeeklyTrendLine({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={normalize(data)}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "rgba(15,23,42,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            color: "#fff",
          }}
        />
        <Line type="monotone" dataKey="出勤小时" stroke="#a7f3d0" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="加班小时" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
