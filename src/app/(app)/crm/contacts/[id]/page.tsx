import Link from "next/link";
import { format } from "date-fns";
import { ContactManualPanel } from "@/components/crm/contact-manual-panel";
import { CrmAiInsightsPanel } from "@/components/crm/crm-ai-insights-panel";
import { CrmNav } from "@/components/crm/crm-nav";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { ScoreContactButton } from "@/components/crm/score-contact-button";
import { getCrmRepository } from "@/lib/data/crm-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getRepository } from "@/lib/data/repository";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";
import { Badge } from "@/components/ui/badge";

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
    return (
      <div className="p-8 text-sm text-[#9AABC4]">Contact not found.</div>
    );
  }

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
    <>
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/crm/contacts"
              className="text-xs text-[#B8965D] hover:underline"
            >
              ← Contacts
            </Link>
            <h2 className="mt-1 text-lg font-semibold text-[#FFFFFF] sm:text-xl">
              {contactDisplayName(contact)}
            </h2>
            <p className="text-xs text-[#9AABC4] sm:text-sm">
              {contact.jobTitle}
              {company ? (
                <>
                  {" · "}
                  <Link
                    href={`/crm/companies/${company.id}`}
                    className="text-[#B8965D] hover:underline"
                  >
                    {company.name}
                  </Link>
                </>
              ) : (
                ""
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <LeadScoreBadge score={contact.leadScore} />
            <ScoreContactButton contactId={contact.id} />
          </div>
        </div>
        {contact.leadScoreReason && (
          <p className="mt-2 text-xs text-[#9AABC4] sm:text-sm">{contact.leadScoreReason}</p>
        )}
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <ContactManualPanel
          contact={contact}
          companies={companies.map((c) => ({ id: c.id, name: c.name }))}
          members={memberOptions}
          currentUserId={ctx.userId}
        />

        <CrmAiInsightsPanel contactId={contact.id} />

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5 lg:col-span-1">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-[#9AABC4]">Email</dt>
                <dd className="break-all">{contact.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[#9AABC4]">Phone</dt>
                <dd>{contact.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[#9AABC4]">Owner</dt>
                <dd>{memberNameByUserId(members, contact.ownerId)}</dd>
              </div>
              <div>
                <dt className="text-[#9AABC4]">Purchase total</dt>
                <dd>
                  {contact.purchaseTotal > 0
                    ? `£${contact.purchaseTotal.toLocaleString()}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#9AABC4]">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-[#121E32] text-[#9AABC4] ring-[#243656]"
                    >
                      {tag.replace("_", " ")}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">
              Communication history
            </h3>
            {linkedConversations.length === 0 ? (
              <p className="mt-2 text-sm text-[#9AABC4]">
                No linked inbox conversations.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {linkedConversations.map((conv) => (
                  <li key={conv.id}>
                    <Link
                      href={`/inbox/${conv.id}`}
                      className="block rounded-lg border border-[#243656] px-3 py-2 hover:bg-[#121E32]"
                    >
                      <p className="text-sm font-medium text-[#FFFFFF]">
                        Inbox thread
                      </p>
                      <p className="text-xs text-[#9AABC4]">
                        {conv.channels.join(", ")} ·{" "}
                        {conv.timelineEventCount ?? conv.timeline.length} events
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Opportunities</h3>
            <ul className="mt-3 space-y-2">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <Link
                    href={`/crm/deals/${deal.id}`}
                    className="flex flex-col gap-1 rounded-lg border border-[#243656] px-3 py-2 text-sm transition-colors hover:bg-[#121E32] sm:flex-row sm:justify-between sm:gap-2"
                  >
                    <span>{deal.title}</span>
                    <span className="font-medium text-[#B8965D]">
                      £{deal.value.toLocaleString()}
                    </span>
                  </Link>
                </li>
              ))}
              {deals.length === 0 && (
                <p className="text-sm text-[#9AABC4]">No deals linked.</p>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Tasks</h3>
            <ul className="mt-3 space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg border border-[#243656] px-3 py-2 text-sm"
                >
                  <p className="font-medium">{task.title}</p>
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

export const metadata = { title: "Contact" };
