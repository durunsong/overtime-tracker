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
          contentStyle={{
            background: "rgba(15,23,42,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8,
            color: "#fff",
          }}
        />
        <Bar dataKey="加班小时" radius={[6, 6, 0, 0]} fill="#67e8f9" />
      </BarChart>
    </ResponsiveContainer>
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
