"use client";

import Link from "next/link";
import { StatusPill } from "@/components/ui/os/status-pill";
import type { AnalyticsListItem, AnalyticsSnapshot } from "@/types/analytics";

function DetailList({
  title,
  items,
  empty,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  items: AnalyticsListItem[];
  empty: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface-elevated">
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Link href={viewAllHref} className="text-xs font-medium text-gold hover:underline">
          {viewAllLabel}
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.meta}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {item.value && (
                    <span className="text-sm font-semibold text-chart-revenue">{item.value}</span>
                  )}
                  {item.badge && <StatusPill variant="gold">{item.badge}</StatusPill>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AnalyticsDetailLists({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <DetailList
        title="Top open deals"
        items={snapshot.topDeals}
        empty="No open deals yet."
        viewAllHref="/crm"
        viewAllLabel="CRM"
      />
      <DetailList
        title="Overdue tasks"
        items={snapshot.overdueTasks}
        empty="Nothing overdue — nice work."
        viewAllHref="/crm/tasks"
        viewAllLabel="Tasks"
      />
      <DetailList
        title="Recent agent runs"
        items={snapshot.recentAgentRuns}
        empty="No agent runs yet."
        viewAllHref="/automation?view=ask"
        viewAllLabel="Automation"
      />
    </div>
  );
}

export function AnalyticsSecondaryStats({ snapshot }: { snapshot: AnalyticsSnapshot }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: snapshot.revenue.currency,
      maximumFractionDigits: 0,
    }).format(n);

  const tiles = [
    {
      label: "Invoices",
      value: fmt(snapshot.finance.invoiceTotal),
      sub: `${snapshot.finance.invoiceCount} records`,
      tone: "bg-chart-revenue-soft text-chart-revenue",
    },
    {
      label: "Expenses",
      value: fmt(snapshot.finance.expenseTotal),
      sub: `${snapshot.finance.expenseCount} records`,
      tone: "bg-chart-pipeline-soft text-chart-pipeline",
    },
    {
      label: "Employees",
      value: String(snapshot.hr.employees),
      sub: `${snapshot.hr.candidates} candidates`,
      tone: "bg-chart-ops-soft text-chart-ops",
    },
    {
      label: "AI extras",
      value: String(snapshot.aiExtra.autonomousTasks),
      sub: `${snapshot.aiExtra.installedAgents} marketplace agents`,
      tone: "bg-chart-ai-soft text-chart-ai",
    },
    {
      label: "Weighted forecast",
      value: fmt(snapshot.pipeline.weightedForecast),
      sub: `Avg deal ${fmt(snapshot.pipeline.avgDealSize)}`,
      tone: "bg-primary-soft text-navy dark:text-gold",
    },
    {
      label: "Active projects",
      value: String(snapshot.projects.active),
      sub: `${snapshot.projects.completedTasks} tasks done`,
      tone: "bg-chart-ops-soft text-chart-ops",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`rounded-xl border border-border px-4 py-3 ${tile.tone}`}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">{tile.label}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{tile.value}</p>
          <p className="mt-0.5 text-xs text-muted">{tile.sub}</p>
        </div>
      ))}
    </div>
  );
}
