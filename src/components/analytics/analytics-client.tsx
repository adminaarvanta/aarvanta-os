"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AnalyticsSnapshot, ReportPeriod } from "@/types/analytics";

function StatCard({
  label,
  value,
  sub,
  change,
}: {
  label: string;
  value: string;
  sub?: string;
  change?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated p-4">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
      {change != null && (
        <p className={`mt-1 text-xs ${change >= 0 ? "text-accent-cyan" : "text-red-400"}`}>
          {change >= 0 ? "+" : ""}
          {change}% vs prior period
        </p>
      )}
    </div>
  );
}

export function AnalyticsClient({
  initialSnapshot,
}: {
  initialSnapshot: AnalyticsSnapshot;
}) {
  const [period, setPeriod] = useState<ReportPeriod>(initialSnapshot.period);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [loading, setLoading] = useState(false);

  async function loadPeriod(p: ReportPeriod) {
    setLoading(true);
    setPeriod(p);
    try {
      const res = await fetch(`/api/analytics?period=${p}`);
      if (res.ok) setSnapshot(await res.json());
    } finally {
      setLoading(false);
    }
  }

  function exportReport(format: "csv" | "pdf" | "excel") {
    window.open(`/api/analytics/export?period=${period}&format=${format}`, "_blank");
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: snapshot.revenue.currency,
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly"] as ReportPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => loadPeriod(p)}
              disabled={loading}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize ${
                period === p
                  ? "bg-gold/15 text-gold-bright ring-1 ring-gold/30"
                  : "text-muted hover:bg-surface-hover"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => exportReport("csv")}>
            Export CSV
          </Button>
          <Button size="sm" variant="ghost" onClick={() => exportReport("pdf")}>
            PDF
          </Button>
          <Button size="sm" variant="ghost" onClick={() => exportReport("excel")}>
            Excel
          </Button>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Revenue</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total revenue"
            value={fmt(snapshot.revenue.total)}
            change={snapshot.revenue.changePct}
          />
          <StatCard label="Won deals" value={String(snapshot.revenue.wonDeals)} />
          <StatCard
            label="Pipeline value"
            value={fmt(snapshot.pipeline.pipelineValue)}
          />
          <StatCard
            label="Weighted forecast"
            value={fmt(snapshot.pipeline.weightedForecast)}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Pipeline & projects</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Open deals" value={String(snapshot.pipeline.openDeals)} />
          <StatCard
            label="Avg deal size"
            value={fmt(snapshot.pipeline.avgDealSize)}
          />
          <StatCard label="Active projects" value={String(snapshot.projects.active)} />
          <StatCard
            label="Overdue tasks"
            value={String(snapshot.projects.overdueTasks)}
            sub={`${snapshot.projects.openTasks} open project tasks`}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Tasks & AI usage</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Open CRM tasks" value={String(snapshot.tasks.open)} />
          <StatCard
            label="AI-assigned tasks"
            value={String(snapshot.tasks.aiAssigned)}
          />
          <StatCard label="Agent runs" value={String(snapshot.aiUsage.agentRuns)} />
          <StatCard
            label="Workflow runs"
            value={String(snapshot.aiUsage.workflowRuns)}
            sub={`~${snapshot.aiUsage.tokensEstimate.toLocaleString()} tokens est.`}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Key metrics</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {snapshot.metrics.map((m) => (
            <li
              key={m.label}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
            >
              <span className="text-sm text-muted">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {m.unit === "GBP"
                    ? fmt(Number(m.value))
                    : String(m.value)}
                </span>
                {m.changePct != null && (
                  <Badge className="bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30">
                    +{m.changePct}%
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
