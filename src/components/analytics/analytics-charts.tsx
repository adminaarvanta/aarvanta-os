"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsSnapshot } from "@/types/analytics";

function ChartPanel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-border bg-surface-elevated p-4 sm:p-5 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="h-64 w-full">{children}</div>
    </section>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
  currency?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-sm"
      style={{
        background: "var(--chart-tooltip-bg)",
        borderColor: "var(--chart-tooltip-border)",
        color: "var(--foreground)",
      }}
    >
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <span className="font-semibold text-foreground">
            {currency && typeof p.value === "number"
              ? new Intl.NumberFormat("en-GB", {
                  style: "currency",
                  currency,
                  maximumFractionDigits: 0,
                }).format(p.value)
              : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Open: "var(--chart-open)",
  Won: "var(--chart-won)",
  Lost: "var(--chart-lost)",
};

const TASK_COLORS = [
  "var(--chart-ops)",
  "var(--chart-ai)",
  "var(--chart-pipeline)",
  "var(--danger)",
];

export function AnalyticsCharts({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const currency = snapshot.revenue.currency;
  const stageData = snapshot.pipelineByStage.length
    ? snapshot.pipelineByStage
    : [{ stage: "No open deals", count: 0, value: 0 }];

  return (
    <div className="space-y-4">
      <ChartPanel
        title="Revenue vs pipeline"
        subtitle="Trend across the selected period"
        className="col-span-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={snapshot.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-revenue)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--chart-revenue)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPipeline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-pipeline)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--chart-pipeline)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="var(--chart-revenue)"
              fill="url(#gradRevenue)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="pipeline"
              name="Pipeline"
              stroke="var(--chart-pipeline)"
              fill="url(#gradPipeline)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Pipeline by stage" subtitle="Open deal value by stage">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stageData}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="stage"
                width={88}
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              <Bar dataKey="value" name="Value" radius={[0, 6, 6, 0]} fill="var(--chart-pipeline)">
                {stageData.map((entry, i) => (
                  <Cell
                    key={entry.stage}
                    fill={i % 2 === 0 ? "var(--chart-pipeline)" : "var(--chart-ops)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Deal status" subtitle="Count and value by outcome">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={snapshot.dealStatus} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="status"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Deals" radius={[6, 6, 0, 0]}>
                {snapshot.dealStatus.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status] ?? "var(--chart-ops)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="AI workforce activity" subtitle="Agent and workflow runs over time">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={snapshot.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAgents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-ai)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-ai)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
              <Area
                type="monotone"
                dataKey="agentRuns"
                name="Agent runs"
                stroke="var(--chart-ai)"
                fill="url(#gradAgents)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="workflowRuns"
                name="Workflows"
                stroke="var(--chart-ops)"
                fill="var(--chart-ops-soft)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Task mix" subtitle="Open, completed, AI-assigned, overdue">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={snapshot.taskBreakdown} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Tasks" radius={[6, 6, 0, 0]}>
                {snapshot.taskBreakdown.map((entry, i) => (
                  <Cell key={entry.label} fill={TASK_COLORS[i % TASK_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>
    </div>
  );
}
