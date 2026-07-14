import Link from "next/link";
import { format } from "date-fns";
import { CrmNav } from "@/components/crm/crm-nav";
import { DealDetailPanel } from "@/components/crm/deal-detail-panel";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";
import { Badge } from "@/components/ui/badge";

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  const { id } = await params;
  const scope = ctx.scope;
  const repo = getCrmRepository();

  const deal = await repo.getDeal(id, scope);
  if (!deal) {
    return (
      <div className="p-8 text-sm text-muted">Deal not found.</div>
    );
  }

  const [pipeline, contact, company, activities, tasks, members] =
    await Promise.all([
      repo.getPipeline(deal.pipelineId, scope),
      deal.contactId ? repo.getContact(deal.contactId, scope) : null,
      deal.accountId ? repo.getCompany(deal.accountId, scope) : null,
      repo.listActivities(scope, { dealId: id }),
      repo.listTasks(scope, { dealId: id }),
      getTenantRepository().listMembers(scope),
    ]);

  const memberOptions = activeMemberOptions(members);
  const stageName =
    pipeline?.stages.find((s) => s.id === deal.stageId)?.name ?? deal.stageId;

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0">
          <Link
            href="/crm/pipelines"
            className="text-xs text-gold hover:underline"
          >
            ← Pipelines
          </Link>
          <h2 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
            {deal.title}
          </h2>
          <p className="text-xs text-muted sm:text-sm">
            {pipeline?.name ?? "Pipeline"} · {stageName}
          </p>
        </div>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <p className="text-xs text-muted">Value</p>
            <p className="mt-1 text-xl font-semibold text-gold">
              {formatCurrency(deal.value, deal.currency)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <p className="text-xs text-muted">Probability</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {deal.probability}%
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface-elevated p-4">
            <p className="text-xs text-muted">Status</p>
            <p className="mt-1">
              <Badge
                className={
                  deal.status === "won"
                    ? "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30"
                    : deal.status === "lost"
                      ? "bg-danger/15 text-danger ring-danger/45"
                      : "bg-surface-muted text-foreground ring-border"
                }
              >
                {deal.status}
              </Badge>
            </p>
          </div>
        </div>

        <DealDetailPanel
          deal={deal}
          members={memberOptions}
          currentUserId={ctx.userId}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-surface-elevated p-5">
            <h3 className="text-sm font-semibold text-foreground">Details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-muted">Owner</dt>
                <dd>{memberNameByUserId(members, deal.ownerId)}</dd>
              </div>
              <div>
                <dt className="text-muted">Contact</dt>
                <dd>
                  {contact ? (
                    <Link
                      href={`/crm/contacts/${contact.id}`}
                      className="text-gold hover:underline"
                    >
                      {contactDisplayName(contact)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Company</dt>
                <dd>
                  {company ? (
                    <Link
                      href={`/crm/companies/${company.id}`}
                      className="text-gold hover:underline"
                    >
                      {company.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Expected close</dt>
                <dd>{deal.expectedCloseDate ?? "—"}</dd>
              </div>
            </dl>
            {deal.notes && (
              <p className="mt-3 text-xs text-muted">{deal.notes}</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-surface-elevated p-5">
            <h3 className="text-sm font-semibold text-foreground">Tasks</h3>
            <ul className="mt-3 space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-xs text-muted">{task.status}</p>
                </li>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-muted">No tasks linked.</p>
              )}
            </ul>
          </section>
        </div>

        <section className="rounded-xl border border-border bg-surface-elevated p-5">
          <h3 className="text-sm font-semibold text-foreground">Activities</h3>
          <ul className="mt-3 space-y-3">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="border-l-2 border-gold/40 pl-3 text-sm"
              >
                <p className="font-medium text-foreground">
                  [{activity.type}] {activity.title}
                </p>
                {activity.description && (
                  <p className="text-muted">{activity.description}</p>
                )}
                <p className="text-xs text-muted">
                  {format(new Date(activity.occurredAt), "dd MMM yyyy HH:mm")}
                  {activity.authorName ? ` · ${activity.authorName}` : ""}
                </p>
              </li>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-muted">No activities logged.</p>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Deal" };
