import Link from "next/link";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { DealDetailPanel } from "@/components/crm/deal-detail-panel";
import {
  CrmBackLink,
  CrmDetailList,
  CrmSection,
  CrmShell,
  formatCrmMoney,
} from "@/components/crm/crm-shell";
import { CrmTimeline } from "@/components/crm/crm-timeline";
import { StatTile } from "@/components/ui/os/stat-tile";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";
import { Badge } from "@/components/ui/badge";

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
    return <div className="p-8 text-sm text-muted">Deal not found.</div>;
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
    <CrmShell
      title={deal.title}
      back={<CrmBackLink href="/crm/sales" label="Sales" />}
      description={`${pipeline?.name ?? "Pipeline"} · ${stageName}`}
      actions={
        <AskAiButton
          module="crm"
          entityType="deal"
          entityId={deal.id}
          entityLabel={deal.title}
          suggestions={[
            "Prepare follow-up",
            "Create a proposal",
            "Close this lead",
          ]}
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Value"
          value={formatCrmMoney(deal.value, deal.currency)}
        />
        <StatTile label="Probability" value={`${deal.probability}%`} />
        <div className="rounded-xl border border-border bg-surface-elevated p-4">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
            Status
          </p>
          <div className="mt-3">
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
          </div>
        </div>
      </div>

      <DealDetailPanel
        deal={deal}
        members={memberOptions}
        currentUserId={ctx.userId}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <CrmSection title="Details">
          <CrmDetailList
            items={[
              {
                label: "Owner",
                value: memberNameByUserId(members, deal.ownerId),
              },
              {
                label: "Contact",
                value: contact ? (
                  <Link
                    href={`/crm/contacts/${contact.id}`}
                    className="text-gold hover:underline"
                  >
                    {contactDisplayName(contact)}
                  </Link>
                ) : (
                  "—"
                ),
              },
              {
                label: "Company",
                value: company ? (
                  <Link
                    href={`/crm/companies/${company.id}`}
                    className="text-gold hover:underline"
                  >
                    {company.name}
                  </Link>
                ) : (
                  "—"
                ),
              },
              {
                label: "Expected close",
                value: deal.expectedCloseDate ?? "—",
              },
            ]}
          />
          {deal.notes ? (
            <p className="mt-3 text-xs text-muted">{deal.notes}</p>
          ) : null}
        </CrmSection>

        <CrmSection title="Tasks">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted">No tasks linked.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border border-border/80 px-3 py-2.5 text-sm"
                >
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-xs capitalize text-muted">
                    {task.status.replace(/_/g, " ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CrmSection>
      </div>

      <CrmSection title="Activities">
        <CrmTimeline items={activities} />
      </CrmSection>
    </CrmShell>
  );
}

export const metadata = { title: "Deal" };
