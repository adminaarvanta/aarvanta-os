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
    <div className="rounded-xl border border-[#243656] bg-[#0D1524] p-4">
      <p className="text-[10px] uppercase tracking-wide text-[#9AABC4]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#FFFFFF]">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-[#9AABC4]">{sub}</p>}
      {change != null && (
        <p className={`mt-1 text-xs ${change >= 0 ? "text-[#4DA6FF]" : "text-red-400"}`}>
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
                  ? "bg-[#B8965D]/15 text-[#C9AA72] ring-1 ring-[#B8965D]/30"
                  : "text-[#9AABC4] hover:bg-[#162840]"
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
        <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Revenue</h3>
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
        <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Pipeline & projects</h3>
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
        <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Tasks & AI usage</h3>
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
        <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Key metrics</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {snapshot.metrics.map((m) => (
            <li
              key={m.label}
              className="flex items-center justify-between rounded-lg border border-[#243656] px-4 py-3"
            >
              <span className="text-sm text-[#9AABC4]">{m.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#FFFFFF]">
                  {m.unit === "GBP"
                    ? fmt(Number(m.value))
                    : String(m.value)}
                </span>
                {m.changePct != null && (
                  <Badge className="bg-[#0A2A33] text-[#4DA6FF] ring-[#4DA6FF]/30">
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
