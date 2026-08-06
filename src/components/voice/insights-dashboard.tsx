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
import {
  VoiceKpiCard,
  VoicePanel,
  type VoiceTone,
} from "@/components/voice/voice-ui";
import type {
  AgentPerformanceMetrics,
  FunnelMetrics,
} from "@/lib/calling/campaign-analytics";

const funnelColors = [
  "var(--chart-pipeline)",
  "var(--chart-ops)",
  "var(--chart-ai)",
  "var(--chart-revenue)",
  "var(--chart-open)",
  "var(--chart-won)",
  "var(--gold)",
  "var(--navy)",
];

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

  const stats: { label: string; value: string; tone: VoiceTone }[] = [
    { label: "Total Calls", value: String(performance.totalCalls), tone: "navy" },
    {
      label: "Meetings Booked",
      value: String(performance.meetingsBooked),
      tone: "green",
    },
    {
      label: "Booking Rate",
      value: `${performance.bookingRate}%`,
      tone: "cyan",
    },
    {
      label: "Avg Duration",
      value: `${Math.round(performance.avgDurationSeconds / 60)}m`,
      tone: "gold",
    },
    {
      label: "Connected Rate",
      value: `${performance.connectedRate}%`,
      tone: "blue",
    },
    {
      label: "Positive Sentiment",
      value: `${performance.positiveSentiment}%`,
      tone: "green",
    },
    {
      label: "Greeting Success",
      value: `${performance.greetingSuccessRate}%`,
      tone: "amber",
    },
    {
      label: "Retry Success",
      value: `${performance.retrySuccessRate}%`,
      tone: "cyan",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <VoiceKpiCard key={s.label} label={s.label} value={s.value} tone={s.tone} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <VoicePanel title="Booking funnel" tone="blue">
          <div className="space-y-2.5">
            {funnelRows.map((row, i) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-medium text-muted">{row.label}</span>
                  <span className="font-semibold text-foreground">{row.value}</span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-muted">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${(row.value / max) * 100}%`,
                      background: funnelColors[i % funnelColors.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </VoicePanel>

        <VoicePanel title="Performance over time" tone="cyan">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--text-dim)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--text-dim)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--chart-tooltip-bg)",
                    border: "1px solid var(--chart-tooltip-border)",
                    borderRadius: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="calls"
                  stroke="var(--chart-pipeline)"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="var(--chart-ai)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </VoicePanel>
      </section>

      <VoicePanel title="Agent conversion rates" tone="green">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { name: "Greeting", rate: performance.greetingSuccessRate },
                {
                  name: "Qualify",
                  rate: performance.qualificationCompletionRate,
                },
                { name: "Calendar", rate: performance.calendarOfferRate },
                { name: "Book", rate: performance.bookingRate },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--text-dim)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--text-dim)" />
              <Tooltip
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--chart-tooltip-border)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="rate" fill="var(--chart-ops)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </VoicePanel>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">AI Insights</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((card, i) => (
            <div
              key={card.title}
              className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm"
              style={{
                borderLeftWidth: 4,
                borderLeftColor: funnelColors[i % funnelColors.length],
              }}
            >
              <p className="text-sm font-semibold text-foreground">{card.title}</p>
              <p className="mt-1 text-sm text-muted">{card.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
