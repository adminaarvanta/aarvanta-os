import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Kanban,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CrmLoopPanel } from "@/components/crm/crm-loop-panel";
import {
  CrmAvatar,
  CrmShell,
  formatCrmMoney,
} from "@/components/crm/crm-shell";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { TaskList } from "@/components/crm/task-list";
import { StatTile } from "@/components/ui/os/stat-tile";
import { getBrainLoopSnapshot } from "@/lib/ai-team/brain";
import { buildCrmBriefing } from "@/lib/crm/briefing";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function CrmOverviewPage() {
  const scope = await getTenantScope();
  const repo = getCrmRepository();

  const [contacts, companies, deals, tasks, pipelines, members, loop] =
    await Promise.all([
      repo.listContacts(scope),
      repo.listCompanies(scope),
      repo.listDeals(scope),
      repo.listTasks(scope),
      repo.listPipelines(scope),
      getTenantRepository().listMembers(scope),
      getBrainLoopSnapshot(scope),
    ]);

  const memberOptions = activeMemberOptions(members);
  const openDeals = deals.filter((d) => d.status === "open");
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const weightedForecast = openDeals.reduce(
    (s, d) => s + d.value * (d.probability / 100),
    0
  );
  const coverage =
    pipelineValue > 0
      ? Math.round((weightedForecast / pipelineValue) * 100)
      : 0;
  const hotLeads = contacts.filter((c) => (c.leadScore ?? 0) >= 70);
  const openTasks = tasks.filter((t) => t.status !== "done");
  const briefing = buildCrmBriefing({ contacts, openDeals, openTasks });
  const topPeople = [...contacts]
    .sort((a, b) => (b.leadScore ?? 0) - (a.leadScore ?? 0))
    .slice(0, 5);

  return (
    <CrmShell
      title="Relationship workspace"
      description="What needs you now — people, pipeline, and follow-ups in one place."
      actions={
        <AskAiButton
          module="crm"
          suggestions={[
            "What needs my attention?",
            "Which deals close this week?",
            "Who should I follow up with?",
          ]}
        />
      }
    >
      <section className="overflow-hidden rounded-2xl border border-gold/30 bg-surface-elevated shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="h-1.5 bg-gradient-to-r from-[#1a2f59] via-[#a8894f] to-[#2f7f92]" />
        <div className="bg-gradient-to-br from-gold/14 via-surface-elevated to-cyan-500/[0.08] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a8894f] to-[#2f7f92] text-white shadow-[0_6px_14px_rgba(168,137,79,0.28)]">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-foreground">
              AI sales briefing
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Start here before opening the rest of the board.
            </p>
            <ul className="mt-3 space-y-2">
              {briefing.map((line, index) => (
                <li key={line.text}>
                  <Link
                    href={line.href}
                    className="group flex items-start gap-3 rounded-xl border border-border/80 bg-background/70 px-3 py-2.5 text-sm text-foreground transition hover:border-gold/40 hover:bg-surface-muted"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[11px] font-semibold text-gold">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">{line.text}</span>
                    <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition group-hover:text-gold" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        </div>
      </section>

      <CrmLoopPanel snapshot={loop} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="People"
          value={contacts.length}
          icon={Users}
          href="/crm/people"
          sub="In your workspace"
          tone="navy"
        />
        <StatTile
          label="Companies"
          value={companies.length}
          icon={Building2}
          href="/crm/companies"
          sub="Accounts"
          tone="cyan"
        />
        <StatTile
          label="Open deals"
          value={openDeals.length}
          icon={Kanban}
          href="/crm/sales"
          sub={formatCrmMoney(pipelineValue)}
          tone="gold"
        />
        <StatTile
          label="Hot leads"
          value={hotLeads.length}
          icon={Target}
          href="/crm/people?facet=leads"
          sub="Score 70+"
          tone="rose"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-gold/25 bg-surface-elevated">
          <div className="h-1.5 bg-gradient-to-r from-[#a8894f] to-[#2f7f92]" />
          <div className="bg-gradient-to-br from-gold/10 via-surface-elevated to-cyan-500/[0.08] p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Pipeline forecast
            </h2>
            <Link href="/crm/sales" className="text-xs font-medium text-gold hover:underline">
              Open board
            </Link>
          </div>
          <p className="mt-4 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {formatCrmMoney(Math.round(weightedForecast))}
          </p>
          <p className="mt-1 text-xs text-muted">
            Weighted of {formatCrmMoney(pipelineValue)} pipeline
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#a8894f] to-[#2f7f92]"
              style={{ width: `${coverage}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-muted">
            {pipelines.length} pipeline{pipelines.length !== 1 ? "s" : ""}
            {pipelines.length > 0 ? `: ${pipelines.map((p) => p.name).join(", ")}` : ""}
          </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-sky-400/25 bg-surface-elevated">
          <div className="h-1.5 bg-gradient-to-r from-[#1a2f59] to-sky-500" />
          <div className="bg-gradient-to-br from-sky-500/[0.08] via-surface-elevated to-surface-elevated p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Top people</h2>
            <Link
              href="/crm/people"
              className="text-xs font-medium text-gold hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="mt-3 space-y-1">
            {topPeople.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/crm/contacts/${c.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-muted"
                >
                  <CrmAvatar
                    name={contactDisplayName(c)}
                    seed={c.id}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {contactDisplayName(c)}
                    </span>
                    {c.jobTitle ? (
                      <span className="block truncate text-xs text-muted">
                        {c.jobTitle}
                      </span>
                    ) : null}
                  </span>
                  <LeadScoreBadge score={c.leadScore} />
                </Link>
              </li>
            ))}
            {topPeople.length === 0 ? (
              <p className="px-2 py-6 text-sm text-muted">
                Add people to see who to talk to first.
              </p>
            ) : null}
          </ul>
          </div>
        </section>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Open work</h2>
          <Link
            href="/crm/activity"
            className="text-xs font-medium text-gold hover:underline"
          >
            View all ({openTasks.length})
          </Link>
        </div>
        <TaskList tasks={openTasks.slice(0, 5)} members={memberOptions} />
      </section>
    </CrmShell>
  );
}

export const metadata = { title: "CRM" };
