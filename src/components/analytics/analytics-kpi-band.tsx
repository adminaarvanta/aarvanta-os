"use client";

import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { AnalyticsSnapshot } from "@/types/analytics";

type KpiTone = "revenue" | "pipeline" | "ops" | "ai" | "won" | "finance";

const TONE_STYLES: Record<
  KpiTone,
  { border: string; wash: string; stroke: string; fill: string }
> = {
  revenue: {
    border: "border-l-chart-revenue",
    wash: "bg-chart-revenue-soft",
    stroke: "var(--chart-revenue)",
    fill: "var(--chart-revenue-soft)",
  },
  pipeline: {
    border: "border-l-chart-pipeline",
    wash: "bg-chart-pipeline-soft",
    stroke: "var(--chart-pipeline)",
    fill: "var(--chart-pipeline-soft)",
  },
  ops: {
    border: "border-l-chart-ops",
    wash: "bg-chart-ops-soft",
    stroke: "var(--chart-ops)",
    fill: "var(--chart-ops-soft)",
  },
  ai: {
    border: "border-l-chart-ai",
    wash: "bg-chart-ai-soft",
    stroke: "var(--chart-ai)",
    fill: "var(--chart-ai-soft)",
  },
  won: {
    border: "border-l-chart-won",
    wash: "bg-chart-ai-soft",
    stroke: "var(--chart-won)",
    fill: "var(--chart-ai-soft)",
  },
  finance: {
    border: "border-l-gold",
    wash: "bg-primary-soft",
    stroke: "var(--gold)",
    fill: "var(--primary-soft)",
  },
};

function Sparkline({ data, stroke, fillId }: { data: number[]; stroke: string; fillId: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  change,
  tone,
  spark,
  href,
  sparkId,
}: {
  label: string;
  value: string;
  sub?: string;
  change?: number;
  tone: KpiTone;
  spark: number[];
  href?: string;
  sparkId: string;
}) {
  const styles = TONE_STYLES[tone];
  const body = (
    <div
      className={`rounded-xl border border-border border-l-4 ${styles.border} ${styles.wash} p-4 transition-colors hover:bg-surface-hover`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
          {change != null && (
            <p
              className={`mt-1 text-xs font-medium ${
                change >= 0 ? "text-chart-ai" : "text-danger"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {change}% vs prior
            </p>
          )}
        </div>
        <div className="w-20 shrink-0 self-end">
          <Sparkline data={spark} stroke={styles.stroke} fillId={sparkId} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40">
        {body}
      </Link>
    );
  }
  return body;
}

export function AnalyticsKpiBand({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: snapshot.revenue.currency,
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label="Revenue"
        value={fmt(snapshot.revenue.total)}
        change={snapshot.revenue.changePct}
        tone="revenue"
        spark={snapshot.sparklines.revenue}
        sparkId="spark-rev"
        href="/crm"
      />
      <KpiCard
        label="Pipeline"
        value={fmt(snapshot.pipeline.pipelineValue)}
        sub={`${snapshot.pipeline.openDeals} open deals`}
        change={snapshot.pipeline.changePct}
        tone="pipeline"
        spark={snapshot.sparklines.pipeline}
        sparkId="spark-pipe"
        href="/crm"
      />
      <KpiCard
        label="Won deals"
        value={String(snapshot.revenue.wonDeals)}
        tone="won"
        spark={snapshot.sparklines.wonDeals}
        sparkId="spark-won"
        href="/crm"
      />
      <KpiCard
        label="Open tasks"
        value={String(snapshot.tasks.open)}
        sub={`${snapshot.projects.overdueTasks} project overdue`}
        change={snapshot.tasks.changePct}
        tone="ops"
        spark={snapshot.sparklines.openTasks}
        sparkId="spark-tasks"
        href="/crm/tasks"
      />
      <KpiCard
        label="Agent runs"
        value={String(snapshot.aiUsage.agentRuns)}
        sub={`${snapshot.aiUsage.workflowRuns} workflows`}
        change={snapshot.aiUsage.changePct}
        tone="ai"
        spark={snapshot.sparklines.agentRuns}
        sparkId="spark-agents"
        href="/workforce"
      />
      <KpiCard
        label="Net finance"
        value={fmt(snapshot.finance.net)}
        sub={`${snapshot.finance.invoiceCount} inv · ${snapshot.finance.expenseCount} exp`}
        tone="finance"
        spark={snapshot.sparklines.financeNet}
        sparkId="spark-fin"
        href="/finance"
      />
    </div>
  );
}
