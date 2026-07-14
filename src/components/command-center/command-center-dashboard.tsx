import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target,
  UserPlus,
  Workflow,
  FileText,
} from "lucide-react";
import { OPERATING_SYSTEMS } from "@/lib/navigation/command-center-nav";
import { BusinessOsMap } from "@/components/command-center/business-os-map";
import { KpiSparklineCard } from "@/components/command-center/kpi-sparkline-card";
import type { FounderSnapshot } from "@/types/founder";
import { cn } from "@/lib/utils";

function MiniSparkline({ color }: { color: string }) {
  const points = "0,18 12,14 24,16 36,8 48,10 60,4 72,6 84,2";
  return (
    <svg viewBox="0 0 84 20" className="h-5 w-full" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function formatNow() {
  const now = new Date();
  return now.toLocaleString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const quickActions = [
  { label: "Add New Lead", href: "/crm/leads", icon: Target },
  { label: "Create Workflow", href: "/workflows", icon: Workflow },
  { label: "Generate Report", href: "/analytics", icon: FileText },
  { label: "Invite Team Member", href: "/settings", icon: UserPlus },
];

const activityFeed = [
  { title: "AI Agent: Lead Scoring Completed", time: "7:45 AM" },
  { title: "AI Agent: New Lead Assigned", time: "7:42 AM" },
  { title: "AI Agent: Follow-up Email Sent", time: "7:41 AM" },
  { title: "AI Agent: Analytics Report Generated", time: "7:40 AM" },
];

export function CommandCenterDashboard({
  userName,
  snapshot,
}: {
  userName: string;
  snapshot: FounderSnapshot;
}) {
  const firstName = userName.split(" ")[0] ?? userName;
  const aiScore = Math.min(
    100,
    Math.round(
      (snapshot.sales.hotLeads * 8 +
        snapshot.inbox.totalConversations * 3 +
        snapshot.projects.active * 5 +
        snapshot.knowledge.readyDocuments * 2) /
        2
    )
  );

  const kpis = [
    {
      label: "Revenue",
      value: `£${snapshot.revenue.pipelineValue.toLocaleString()}`,
      delta: "0%",
      color: "#ea580c",
      sparkColor: "#fb923c",
    },
    {
      label: "Pipeline Value",
      value: `£${snapshot.revenue.weightedForecast.toLocaleString()}`,
      delta: "0%",
      color: "#7c3aed",
      sparkColor: "#a78bfa",
    },
    {
      label: "New Leads",
      value: String(snapshot.sales.hotLeads),
      delta: "0%",
      color: "#2563eb",
      sparkColor: "#60a5fa",
    },
    {
      label: "Conversions",
      value: String(snapshot.revenue.openDeals),
      delta: "0%",
      color: "#16a34a",
      sparkColor: "#4ade80",
    },
    {
      label: "Tasks Overdue",
      value: String(snapshot.projects.overdueTasks),
      delta: "0%",
      color: "#dc2626",
      sparkColor: "#f87171",
    },
  ];

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Your Business OS is running smoothly.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-muted">{formatNow()}</p>
            <div className="mt-2 w-32">
              <MiniSparkline color="#2563eb" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((kpi) => (
            <KpiSparklineCard key={kpi.label} {...kpi} />
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <BusinessOsMap />

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Operating Systems</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {OPERATING_SYSTEMS.map((os) => (
                  <Link
                    key={os.id}
                    href={os.href}
                    className="group rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                  >
                    <div
                      className={cn(
                        "mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold",
                        os.iconClass
                      )}
                    >
                      {os.label.slice(0, 1)}
                    </div>
                    <p className="font-semibold text-foreground">{os.label}</p>
                    {os.description ? (
                      <p className="mt-1 text-xs text-muted">{os.description}</p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Active
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <h3 className="font-semibold text-foreground">AI Activity Feed</h3>
              <ul className="mt-3 space-y-3">
                {activityFeed.map((item) => (
                  <li key={item.title} className="flex gap-3 text-sm">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-foreground">{item.title}</p>
                      <p className="text-xs text-muted">{item.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/communications"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all activity
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">AI Insights</h3>
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Beta
                </span>
              </div>
              <div className="mt-4 flex flex-col items-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary/15 bg-primary-soft">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{aiScore}</p>
                    <p className="text-[10px] text-muted">/ 100</p>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">AI Score</p>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">Growth Potential</dt>
                  <dd className="font-medium text-foreground">
                    {snapshot.sales.hotLeads > 0 ? "High" : "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Engagement Score</dt>
                  <dd className="font-medium text-foreground">
                    {snapshot.inbox.totalConversations > 0 ? "Good" : "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Pipeline Health</dt>
                  <dd className="font-medium text-foreground">
                    {snapshot.revenue.openDeals > 0 ? "Stable" : "N/A"}
                  </dd>
                </div>
              </dl>
              <Link
                href="/workforce"
                className="mt-4 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Improve Score →
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <h3 className="font-semibold text-foreground">System Health</h3>
              <ul className="mt-3 space-y-2.5">
                {[
                  "All Systems: Operational",
                  "AI Workforce: Active",
                  "Data Sync: Real-time",
                  "Security: Secure",
                ].map((line) => (
                  <li key={line} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
              <h3 className="font-semibold text-foreground">Quick Actions</h3>
              <ul className="mt-3 space-y-1">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <li key={action.href}>
                      <Link
                        href={action.href}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        {action.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary-bright px-6 py-8 text-white shadow-lg">
          <div className="relative z-10 max-w-2xl">
            <p className="text-lg font-semibold sm:text-xl">
              Aarvanta Business OS: All your business. One intelligent operating system.
            </p>
            <Link
              href="/platform"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-white/90"
            >
              Explore All OS →
            </Link>
          </div>
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute bottom-0 right-16 h-24 w-24 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
