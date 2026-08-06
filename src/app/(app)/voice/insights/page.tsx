import Link from "next/link";
import { InsightsDashboard } from "@/components/voice/insights-dashboard";
import {
  buildAgentPerformance,
  buildFunnelMetrics,
  buildInsightCards,
} from "@/lib/calling/campaign-analytics";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function VoiceInsightsPage() {
  const scope = await getTenantScope();
  const repo = getCallingAgentRepository();
  const [queue, sessions, meetings] = await Promise.all([
    repo.listQueue(scope),
    repo.listSessions(scope),
    repo.listMeetings(scope),
  ]);

  const funnel = buildFunnelMetrics({ queue, sessions, meetings });
  const performance = buildAgentPerformance({ sessions, meetings, queue });
  const insights = buildInsightCards({ sessions, meetings, performance });

  const trendMap = new Map<string, { calls: number; bookings: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(5, 10);
    trendMap.set(key, { calls: 0, bookings: 0 });
  }
  for (const s of sessions) {
    const key = s.startedAt.slice(5, 10);
    const row = trendMap.get(key);
    if (row) row.calls += 1;
  }
  for (const m of meetings) {
    const key = m.createdAt.slice(5, 10);
    const row = trendMap.get(key);
    if (row) row.bookings += 1;
  }
  const trend = [...trendMap.entries()].map(([day, v]) => ({ day, ...v }));

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Insights</h2>
          <p className="text-xs text-muted sm:text-sm">
            Funnel, agent performance, and AI recommendations
          </p>
        </div>
        <Link
          href="/api/voice/insights/export"
          className="text-sm text-gold hover:underline"
        >
          Export CSV
        </Link>
      </header>
      <InsightsDashboard
        funnel={funnel}
        performance={performance}
        insights={insights}
        trend={trend}
      />
    </>
  );
}

export const metadata = { title: "Voice OS · Insights" };
