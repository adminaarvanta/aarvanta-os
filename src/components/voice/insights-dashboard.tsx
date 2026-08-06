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
import type {
  AgentPerformanceMetrics,
  FunnelMetrics,
} from "@/lib/calling/campaign-analytics";

export function InsightsDashboard({
  funnel,
  performance,
  insights,
  trend,
}: {
  funnel: FunnelMetrics;
  performance: AgentPerformanceMetrics;
  insights: { title: string; body: string }[];
  trend: { day: string; calls: number; bookings: number }[];
}) {
  const funnelRows = [
    { label: "Leads Added", value: funnel.leadsAdded },
    { label: "Calls Connected", value: funnel.callsConnected },
    { label: "Interested", value: funnel.interested },
    { label: "Qualified", value: funnel.qualified },
    { label: "Calendar Opened", value: funnel.calendarOpened },
    { label: "Meetings Booked", value: funnel.meetingsBooked },
    { label: "Meetings Attended", value: funnel.meetingsAttended },
    { label: "Converted", value: funnel.converted },
  ];
  const max = Math.max(...funnelRows.map((r) => r.value), 1);

  const stats = [
    { label: "Total Calls", value: performance.totalCalls },
    { label: "Meetings Booked", value: performance.meetingsBooked },
    { label: "Booking Rate", value: `${performance.bookingRate}%` },
    {
      label: "Avg Duration",
      value: `${Math.round(performance.avgDurationSeconds / 60)}m`,
    },
    { label: "Connected Rate", value: `${performance.connectedRate}%` },
    {
      label: "Positive Sentiment",
      value: `${performance.positiveSentiment}%`,
    },
    {
      label: "Greeting Success",
      value: `${performance.greetingSuccessRate}%`,
    },
    {
      label: "Retry Success",
      value: `${performance.retrySuccessRate}%`,
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-surface-elevated px-4 py-3"
          >
            <p className="text-xs text-muted">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {s.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <h3 className="mb-4 text-sm font-medium text-foreground">
            Booking funnel
          </h3>
          <div className="space-y-2">
            {funnelRows.map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-muted">{row.label}</span>
                  <span className="text-foreground">{row.value}</span>
                </div>
                <div className="h-2 rounded-full bg-surface">
                  <div
                    className="h-2 rounded-full bg-gold"
                    style={{ width: `${(row.value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">
            Performance over time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="var(--muted)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="var(--gold)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface-elevated p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">
          Agent conversion rates
        </h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                {
                  name: "Greeting",
                  rate: performance.greetingSuccessRate,
                },
                {
                  name: "Qualify",
                  rate: performance.qualificationCompletionRate,
                },
                {
                  name: "Calendar",
                  rate: performance.calendarOfferRate,
                },
                { name: "Book", rate: performance.bookingRate },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" />
              <Tooltip
                contentStyle={{
                  background: "var(--surface-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="rate" fill="var(--gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-foreground">AI Insights</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-border bg-surface-elevated p-4"
            >
              <p className="text-sm font-medium text-foreground">{card.title}</p>
              <p className="mt-1 text-sm text-muted">{card.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
