import Link from "next/link";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { ContactManualPanel } from "@/components/crm/contact-manual-panel";
import { CrmAiInsightsPanel } from "@/components/crm/crm-ai-insights-panel";
import {
  CrmAvatar,
  CrmBackLink,
  CrmDetailList,
  CrmSection,
  CrmShell,
  CrmTag,
  formatCrmMoney,
} from "@/components/crm/crm-shell";
import { CrmTimeline } from "@/components/crm/crm-timeline";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { ScoreContactButton } from "@/components/crm/score-contact-button";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getRepository } from "@/lib/data/repository";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  const { id } = await params;
  const scope = ctx.scope;
  const repo = getCrmRepository();

  const contact = await repo.getContact(id, scope);
  if (!contact) {
    return <div className="p-8 text-sm text-muted">Contact not found.</div>;
  }

  const name = contactDisplayName(contact);
  const [company, companies, activities, deals, tasks, members, ...linkedById] =
    await Promise.all([
      contact.accountId ? repo.getCompany(contact.accountId, scope) : null,
      repo.listCompanies(scope),
      repo.listActivities(scope, { contactId: id }),
      repo.listDeals(scope, { contactId: id }),
      repo.listTasks(scope, { contactId: id }),
      getTenantRepository().listMembers(scope),
      ...contact.conversationIds.map((cid) =>
        getRepository().getConversation(cid, scope)
      ),
    ]);

  const memberOptions = activeMemberOptions(members);
  const linkedConversations = linkedById.filter(
    (c): c is NonNullable<typeof c> => c !== null
  );

  return (
    <CrmShell
      title={name}
      lead={<CrmAvatar name={name} seed={contact.id} size="lg" />}
      back={<CrmBackLink href="/crm/people" label="People" />}
      description={
        <>
          {contact.jobTitle}
          {company ? (
            <>
              {contact.jobTitle ? " · " : ""}
              <Link
                href={`/crm/companies/${company.id}`}
                className="text-gold hover:underline"
              >
                {company.name}
              </Link>
            </>
          ) : null}
          {contact.leadScoreReason ? (
            <span className="mt-1 block text-xs">{contact.leadScoreReason}</span>
          ) : null}
        </>
      }
      actions={
        <>
          <LeadScoreBadge score={contact.leadScore} />
          <ScoreContactButton contactId={contact.id} />
          <AskAiButton
            module="crm"
            entityType="contact"
            entityId={contact.id}
            entityLabel={name}
          />
        </>
      }
    >
      <ContactManualPanel
        contact={contact}
        companies={companies.map((c) => ({ id: c.id, name: c.name }))}
        members={memberOptions}
        currentUserId={ctx.userId}
      />

      <CrmAiInsightsPanel contactId={contact.id} />

      <div className="grid gap-4 lg:grid-cols-3">
        <CrmSection title="Details">
          <CrmDetailList
            items={[
              {
                label: "Email",
                value: (
                  <span className="break-all">{contact.email ?? "—"}</span>
                ),
              },
              { label: "Phone", value: contact.phone ?? "—" },
              {
                label: "Owner",
                value: memberNameByUserId(members, contact.ownerId),
              },
              {
                label: "Purchase total",
                value:
                  contact.purchaseTotal > 0
                    ? formatCrmMoney(contact.purchaseTotal)
                    : "—",
              },
              {
                label: "Tags",
                value: (
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.length === 0
                      ? "—"
                      : contact.tags.map((tag) => (
                          <CrmTag key={tag}>{tag.replace(/_/g, " ")}</CrmTag>
                        ))}
                  </div>
                ),
              },
            ]}
          />
        </CrmSection>

        <div className="lg:col-span-2">
          <CrmSection title="Communication history">
            {linkedConversations.length === 0 ? (
              <p className="text-sm text-muted">No linked inbox conversations.</p>
            ) : (
              <ul className="space-y-2">
                {linkedConversations.map((conv) => (
                  <li key={conv.id}>
                    <Link
                      href={`/inbox/${conv.id}`}
                      className="block rounded-xl border border-border/80 px-3 py-2.5 hover:bg-surface-muted"
                    >
                      <p className="text-sm font-medium text-foreground">
                        Inbox thread
                      </p>
                      <p className="text-xs text-muted">
                        {conv.channels.join(", ")} ·{" "}
                        {conv.timelineEventCount ?? conv.timeline.length} events
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CrmSection>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CrmSection title="Opportunities">
          {deals.length === 0 ? (
            <p className="text-sm text-muted">No deals linked.</p>
          ) : (
            <ul className="space-y-2">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <Link
                    href={`/crm/deals/${deal.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/80 px-3 py-2.5 text-sm hover:bg-surface-muted"
                  >
                    <span className="min-w-0 truncate">{deal.title}</span>
                    <span className="shrink-0 font-medium tabular-nums text-gold">
                      {formatCrmMoney(deal.value)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
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
                  <p className="text-xs capitalize text-muted">{task.status.replace(/_/g, " ")}</p>
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

export const metadata = { title: "Contact" };
