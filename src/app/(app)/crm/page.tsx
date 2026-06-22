import Link from "next/link";
import { Building2, Kanban, Target, Users } from "lucide-react";
import { CrmNav } from "@/components/crm/crm-nav";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { TaskList } from "@/components/crm/task-list";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function CrmOverviewPage() {
  const scope = await getTenantScope();
  const repo = getCrmRepository();

  const [contacts, companies, deals, tasks, pipelines] = await Promise.all([
    repo.listContacts(scope),
    repo.listCompanies(scope),
    repo.listDeals(scope),
    repo.listTasks(scope),
    repo.listPipelines(scope),
  ]);

  const openDeals = deals.filter((d) => d.status === "open");
  const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
  const weightedForecast = openDeals.reduce(
    (s, d) => s + d.value * (d.probability / 100),
    0
  );
  const hotLeads = contacts.filter((c) => (c.leadScore ?? 0) >= 70);
  const openTasks = tasks.filter((t) => t.status !== "done");

  const stats = [
    {
      label: "Contacts",
      value: contacts.length,
      icon: Users,
      href: "/crm/contacts",
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
      href: "/crm/pipelines",
    },
    {
      label: "Hot leads (70+)",
      value: hotLeads.length,
      icon: Target,
      href: "/crm/leads",
    },
  ];

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">CRM</h2>
        <p className="text-xs text-[#A89878] sm:text-sm">
          Module 3 — leads, contacts, companies, deals, AI scoring, and insights.
        </p>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="rounded-xl border border-[#3d3528] bg-[#101010] p-4 hover:border-[#D4AF37]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#A89878]">{stat.label}</p>
                  <Icon className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-[#F5E6C8]">
                  {stat.value}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
            <h3 className="text-sm font-semibold text-[#F5E6C8]">
              Pipeline forecast
            </h3>
            <div className="mt-3 space-y-2 text-sm">
              <p className="text-[#A89878]">
                Total pipeline:{" "}
                <span className="font-semibold text-[#F5E6C8]">
                  £{pipelineValue.toLocaleString()}
                </span>
              </p>
              <p className="text-[#A89878]">
                Weighted forecast:{" "}
                <span className="font-semibold text-[#D4AF37]">
                  £{Math.round(weightedForecast).toLocaleString()}
                </span>
              </p>
              <p className="text-xs text-[#A89878]">
                {pipelines.length} pipeline
                {pipelines.length !== 1 ? "s" : ""}:{" "}
                {pipelines.map((p) => p.name).join(", ")}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#F5E6C8]">
                Top leads
              </h3>
              <Link href="/crm/contacts" className="text-xs text-[#D4AF37] hover:underline">
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
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-[#141414]"
                    >
                      <span className="text-sm text-[#F5E6C8]">
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
            <h3 className="text-sm font-semibold text-[#F5E6C8]">Open tasks</h3>
            <Link href="/crm/tasks" className="text-xs text-[#D4AF37] hover:underline">
              View all ({openTasks.length})
            </Link>
          </div>
          <TaskList tasks={openTasks.slice(0, 5)} />
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "CRM Overview" };
