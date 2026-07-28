"use client";

import Link from "next/link";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import type { AnalyticsSnapshot } from "@/types/analytics";

type KpiTone = "revenue" | "pipeline" | "ai" | "finance";

const TONE_STYLES: Record<
  KpiTone,
  { border: string; wash: string; label: string; stroke: string }
> = {
  revenue: {
    border: "border-l-chart-revenue",
    wash: "bg-chart-revenue-soft",
    label: "text-chart-revenue",
    stroke: "var(--chart-revenue)",
  },
  pipeline: {
    border: "border-l-chart-pipeline",
    wash: "bg-chart-pipeline-soft",
    label: "text-chart-pipeline",
    stroke: "var(--chart-pipeline)",
  },
  ai: {
    border: "border-l-chart-ai",
    wash: "bg-chart-ai-soft",
    label: "text-chart-ai",
    stroke: "var(--chart-ai)",
  },
  finance: {
    border: "border-l-chart-ops",
    wash: "bg-chart-ops-soft",
    label: "text-chart-ops",
    stroke: "var(--chart-ops)",
  },
};

function Sparkline({ data, stroke, fillId }: { data: number[]; stroke: string; fillId: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.55} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={2.5}
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
      className={`flex h-full min-h-[148px] flex-col justify-between rounded-xl border border-border border-l-[6px] ${styles.border} ${styles.wash} p-5 transition-colors hover:brightness-[0.98] dark:hover:brightness-110`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold uppercase tracking-wide ${styles.label}`}>
            {label}
          </p>
          <p className="mt-1.5 truncate text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 min-h-[1rem] text-xs text-muted">{sub ?? "\u00a0"}</p>
        </div>
        <div className="w-28 shrink-0 self-start pt-1">
          <Sparkline data={spark} stroke={styles.stroke} fillId={sparkId} />
        </div>
      </div>
      <p
        className={`mt-3 min-h-[1.25rem] text-sm font-semibold ${
          change == null
            ? "text-transparent"
            : change >= 0
              ? "text-chart-ai"
              : "text-danger"
        }`}
      >
        {change != null ? `${change >= 0 ? "+" : ""}${change}% vs prior` : "—"}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
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
    <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
