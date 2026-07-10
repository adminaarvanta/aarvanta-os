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
      <div className="p-8 text-sm text-[#9AABC4]">Deal not found.</div>
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
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <div className="min-w-0">
          <Link
            href="/crm/pipelines"
            className="text-xs text-[#B8965D] hover:underline"
          >
            ← Pipelines
          </Link>
          <h2 className="mt-1 text-lg font-semibold text-[#FFFFFF] sm:text-xl">
            {deal.title}
          </h2>
          <p className="text-xs text-[#9AABC4] sm:text-sm">
            {pipeline?.name ?? "Pipeline"} · {stageName}
          </p>
        </div>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#243656] bg-[#0D1524] p-4">
            <p className="text-xs text-[#9AABC4]">Value</p>
            <p className="mt-1 text-xl font-semibold text-[#B8965D]">
              {formatCurrency(deal.value, deal.currency)}
            </p>
          </div>
          <div className="rounded-xl border border-[#243656] bg-[#0D1524] p-4">
            <p className="text-xs text-[#9AABC4]">Probability</p>
            <p className="mt-1 text-xl font-semibold text-[#FFFFFF]">
              {deal.probability}%
            </p>
          </div>
          <div className="rounded-xl border border-[#243656] bg-[#0D1524] p-4">
            <p className="text-xs text-[#9AABC4]">Status</p>
            <p className="mt-1">
              <Badge
                className={
                  deal.status === "won"
                    ? "bg-emerald-950 text-emerald-300 ring-emerald-800"
                    : deal.status === "lost"
                      ? "bg-red-950 text-red-300 ring-red-800"
                      : "bg-[#121E32] text-[#FFFFFF] ring-[#243656]"
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
          <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-[#9AABC4]">Owner</dt>
                <dd>{memberNameByUserId(members, deal.ownerId)}</dd>
              </div>
              <div>
                <dt className="text-[#9AABC4]">Contact</dt>
                <dd>
                  {contact ? (
                    <Link
                      href={`/crm/contacts/${contact.id}`}
                      className="text-[#B8965D] hover:underline"
                    >
                      {contactDisplayName(contact)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[#9AABC4]">Company</dt>
                <dd>
                  {company ? (
                    <Link
                      href={`/crm/companies/${company.id}`}
                      className="text-[#B8965D] hover:underline"
                    >
                      {company.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[#9AABC4]">Expected close</dt>
                <dd>{deal.expectedCloseDate ?? "—"}</dd>
              </div>
            </dl>
            {deal.notes && (
              <p className="mt-3 text-xs text-[#9AABC4]">{deal.notes}</p>
            )}
          </section>

          <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Tasks</h3>
            <ul className="mt-3 space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg border border-[#243656] px-3 py-2 text-sm"
                >
                  <p className="font-medium text-[#FFFFFF]">{task.title}</p>
                  <p className="text-xs text-[#9AABC4]">{task.status}</p>
                </li>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-[#9AABC4]">No tasks linked.</p>
              )}
            </ul>
          </section>
        </div>

        <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Activities</h3>
          <ul className="mt-3 space-y-3">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="border-l-2 border-[#B8965D]/40 pl-3 text-sm"
              >
                <p className="font-medium text-[#FFFFFF]">
                  [{activity.type}] {activity.title}
                </p>
                {activity.description && (
                  <p className="text-[#9AABC4]">{activity.description}</p>
                )}
                <p className="text-xs text-[#9AABC4]">
                  {format(new Date(activity.occurredAt), "dd MMM yyyy HH:mm")}
                  {activity.authorName ? ` · ${activity.authorName}` : ""}
                </p>
              </li>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-[#9AABC4]">No activities logged.</p>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Deal" };
