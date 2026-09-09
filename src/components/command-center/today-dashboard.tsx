import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { SetupGuideCard } from "@/components/onboarding/setup-guide-card";
import { EmptyState } from "@/components/ui/os/empty-state";
import { MetricCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import type { LaunchpadItem } from "@/lib/onboarding/launchpad";
import type { TodaySnapshot } from "@/types/founder";

function money(n: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function TodayDashboard({
  userName,
  snapshot,
  setupGuide = null,
  demoMode = false,
}: {
  userName: string;
  snapshot: TodaySnapshot;
  setupGuide?: {
    firstName: string;
    items: LaunchpadItem[];
    percent: number;
  } | null;
  demoMode?: boolean;
}) {
  const firstName = userName.split(" ")[0] ?? userName;
  const currency = snapshot.revenue.currency || "GBP";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gold">
              Today
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {firstName}, here is what needs you
            </h1>
            <p className="mt-1 text-sm text-muted">
              Business pulse, approvals, and the next useful action — from live
              workspace records, not a launcher.
            </p>
          </div>
          <Button href="/automation?view=ask" variant="secondary" size="sm">
            Ask Aarvanta
          </Button>
        </div>

        {demoMode ? (
          <Alert tone="info" title="Demo workspace">
            Figures below come from sample records so you can see the Action
            Centre working. They are not production metrics.
          </Alert>
        ) : null}

        {setupGuide ? (
          <SetupGuideCard
            firstName={setupGuide.firstName}
            items={setupGuide.items}
            percent={setupGuide.percent}
          />
        ) : null}

        <section aria-labelledby="pulse-heading">
          <h2 id="pulse-heading" className="mb-3 text-sm font-semibold text-foreground">
            Business pulse
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Pipeline"
              value={money(snapshot.revenue.pipelineValue, currency)}
              sub={`${snapshot.revenue.openDeals} open deals`}
              href="/crm/sales"
            />
            <MetricCard
              label="Overdue work"
              value={String(snapshot.projects.overdueTasks)}
              sub={`${snapshot.projects.openTasks} open tasks`}
              href="/projects"
            />
            <MetricCard
              label="Open conversations"
              value={String(snapshot.inbox.totalConversations)}
              sub={`${snapshot.inbox.unreadEstimate} unread`}
              href="/inbox"
            />
            <MetricCard
              label="Approvals"
              value={String(snapshot.approvals.length)}
              sub="AI and workflow"
              href="/workforce/waiting"
            />
            <MetricCard
              label="AI activity"
              value={String(snapshot.workforce.recentRuns)}
              sub="Recent agent runs"
              href="/workforce/activity"
            />
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section
            className="rounded-xl border border-border bg-surface-elevated p-4"
            aria-labelledby="attention-heading"
          >
            <h2 id="attention-heading" className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="h-4 w-4 text-gold" />
              Needs attention
            </h2>
            {snapshot.attention.length === 0 ? (
              <EmptyState
                className="mt-4 border-0 bg-transparent p-4"
                title="Nothing urgent"
                description="When a deal stalls, a task goes overdue, or an inbox thread needs a human, it will show up here."
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {snapshot.attention.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5 hover:bg-surface-muted"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted">{item.reason}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-gold">
                        {item.actionLabel}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            className="rounded-xl border border-border bg-surface-elevated p-4"
            aria-labelledby="approvals-heading"
          >
            <h2 id="approvals-heading" className="flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4 text-gold" />
              Approvals
            </h2>
            {snapshot.approvals.length === 0 ? (
              <EmptyState
                className="mt-4 border-0 bg-transparent p-4"
                title="No pending approvals"
                description="External messages, money, and high-impact AI actions wait here before they run."
                action={
                  <Button href="/workforce/waiting" variant="secondary" size="sm">
                    Open approval queue
                  </Button>
                }
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {snapshot.approvals.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="block rounded-lg border border-border/70 px-3 py-2.5 hover:bg-surface-muted"
                    >
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted">{item.reason}</p>
                      <p className="mt-1 text-xs text-dim">{item.consequence}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section
          className="rounded-xl border border-border bg-surface-elevated p-4"
          aria-labelledby="next-heading"
        >
          <h2 id="next-heading" className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 text-gold" />
            Recommended next
          </h2>
          {snapshot.recommended.length === 0 ? (
            <EmptyState
              className="mt-4 border-0 bg-transparent p-4"
              title="No recommended actions yet"
              description="Add a customer or open the inbox and this list will rank the next useful step."
            />
          ) : (
            <ul className="mt-3 divide-y divide-border/70">
              {snapshot.recommended.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted">{item.reason}</p>
                    <p className="text-xs text-dim">Expected: {item.expectedOutcome}</p>
                  </div>
                  <Button href={item.href} size="sm">
                    Do now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface-elevated p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-gold" />
              AI activity
            </h2>
            {snapshot.workforce.recentActivity.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No agent runs yet. Ask Aarvanta or open AI Employees when you
                want a draft — high-impact actions still need approval.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {snapshot.workforce.recentActivity.map((item) => (
                  <li key={item.id} className="rounded-lg border border-border/70 px-3 py-2">
                    <p className="text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted">{item.time}</p>
                  </li>
                ))}
              </ul>
            )}
            <Button href="/workforce/activity" variant="ghost" size="sm" className="mt-3">
              Inspect audit
            </Button>
          </section>

          <section className="rounded-xl border border-border bg-surface-elevated p-4">
            <h2 className="text-sm font-semibold">Recent events</h2>
            {snapshot.recentEvents.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                Customer, project, inbox, and finance events will land here as
                they happen.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {snapshot.recentEvents.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5 hover:bg-surface-muted"
                    >
                      <span className="truncate text-sm capitalize text-foreground">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted">{item.time}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
