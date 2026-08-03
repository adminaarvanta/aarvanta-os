import Link from "next/link";
import { Building2, Kanban, Sparkles, Target, Users } from "lucide-react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CrmNav } from "@/components/crm/crm-nav";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { TaskList } from "@/components/crm/task-list";
import { buildCrmBriefing } from "@/lib/crm/briefing";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function CrmOverviewPage() {
  const scope = await getTenantScope();
  const repo = getCrmRepository();

  const [contacts, companies, deals, tasks, pipelines, members] =
    await Promise.all([
      repo.listContacts(scope),
      repo.listCompanies(scope),
      repo.listDeals(scope),
      repo.listTasks(scope),
      repo.listPipelines(scope),
      getTenantRepository().listMembers(scope),
    ]);

  const memberOptions = activeMemberOptions(members);
  const openDeals = deals.filter((d) => d.status === "open");
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const weightedForecast = openDeals.reduce(
    (s, d) => s + d.value * (d.probability / 100),
    0
  );
  const hotLeads = contacts.filter((c) => (c.leadScore ?? 0) >= 70);
  const openTasks = tasks.filter((t) => t.status !== "done");
  const briefing = buildCrmBriefing({ contacts, openDeals, openTasks });

  const stats = [
    {
      label: "People",
      value: contacts.length,
      icon: Users,
      href: "/crm/people",
    },
    {
      label: "Companies",
      value: companies.length,
      icon: Building2,
      href: "/crm/companies",
    },
    {
      label: "Open deals",
      value: openDeals.length,
      icon: Kanban,
      href: "/crm/sales",
    },
    {
      label: "Hot leads (70+)",
      value: hotLeads.length,
      icon: Target,
      href: "/crm/people?facet=leads",
    },
  ];

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              CRM
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              AI Relationship Workspace — what needs you, not just charts.
            </p>
          </div>
          <AskAiButton
            module="crm"
            suggestions={[
              "What needs my attention?",
              "Which deals close this week?",
              "Who should I follow up with?",
            ]}
          />
        </div>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-gold/15 p-2 ring-1 ring-gold/30">
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground">
                AI sales briefing
              </h3>
              <ul className="mt-3 space-y-2">
                {briefing.map((line) => (
                  <li key={line.text}>
                    <Link
                      href={line.href}
                      className="block rounded-lg border border-border px-3 py-2 text-sm text-foreground transition hover:border-gold/40 hover:bg-surface-muted"
                    >
                      {line.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="rounded-xl border border-border bg-surface-elevated p-4 transition-colors hover:border-gold/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">{stat.label}</p>
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {stat.value}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface-elevated p-5">
            <h3 className="text-sm font-semibold text-foreground">
              Pipeline forecast
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-muted">
                Total pipeline:{" "}
                <span className="font-semibold text-foreground">
                  £{pipelineValue.toLocaleString()}
                </span>
              </p>
              <p className="text-muted">
                Weighted forecast:{" "}
                <span className="font-semibold text-gold">
                  £{Math.round(weightedForecast).toLocaleString()}
                </span>
              </p>
              <p className="text-xs text-muted">
                {pipelines.length} pipeline
                {pipelines.length !== 1 ? "s" : ""}:{" "}
                {pipelines.map((p) => p.name).join(", ")}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface-elevated p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Top people
              </h3>
              <Link
                href="/crm/people"
                className="text-xs text-gold hover:underline"
              >
                View all
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {[...contacts]
                .sort((a, b) => (b.leadScore ?? 0) - (a.leadScore ?? 0))
                .slice(0, 5)
                .map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/crm/contacts/${c.id}`}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface-muted"
                    >
                      <span className="text-sm text-foreground">
                        {contactDisplayName(c)}
                      </span>
                      <LeadScoreBadge score={c.leadScore} />
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Open work</h3>
            <Link
              href="/crm/activity"
              className="text-xs text-gold hover:underline"
            >
              View all ({openTasks.length})
            </Link>
          </div>
          <TaskList tasks={openTasks.slice(0, 5)} members={memberOptions} />
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "CRM" };
