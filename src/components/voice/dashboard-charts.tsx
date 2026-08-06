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

const tooltipStyle = {
  background: "var(--chart-tooltip-bg)",
  border: "1px solid var(--chart-tooltip-border)",
  borderRadius: 12,
  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
};

export function LiveActivityChart({
  data,
}: {
  data: { hour: string; calls: number }[];
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="var(--text-dim)" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--text-dim)" />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="calls"
            stroke="var(--chart-ops)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--chart-ops)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopHoursChart({
  data,
}: {
  data: { hour: string; bookings: number }[];
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="var(--text-dim)" />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--text-dim)" />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey="bookings"
            fill="var(--chart-ai)"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
