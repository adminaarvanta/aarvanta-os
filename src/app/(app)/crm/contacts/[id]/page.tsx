import Link from "next/link";
import { format } from "date-fns";
import { CrmAiInsightsPanel } from "@/components/crm/crm-ai-insights-panel";
import { CrmNav } from "@/components/crm/crm-nav";
import { LeadScoreBadge } from "@/components/crm/lead-score-badge";
import { ScoreContactButton } from "@/components/crm/score-contact-button";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";
import { Badge } from "@/components/ui/badge";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const scope = await getTenantScope();
  const { id } = await params;
  const repo = getCrmRepository();

  const contact = await repo.getContact(id, scope);
  if (!contact) {
    return (
      <div className="p-8 text-sm text-[#A89878]">Contact not found.</div>
    );
  }

  const [company, activities, allDeals, allTasks, conversations] =
    await Promise.all([
      contact.accountId ? repo.getCompany(contact.accountId, scope) : null,
      repo.listActivities(scope, { contactId: id }),
      repo.listDeals(scope),
      repo.listTasks(scope),
      getRepository().listConversations(scope),
    ]);

  const deals = allDeals.filter((d) => d.contactId === id);
  const tasks = allTasks.filter((t) => t.contactId === id);
  const linkedConversations = conversations.filter(
    (c) =>
      contact.conversationIds.includes(c.id) ||
      (contact.email &&
        c.contact.email?.toLowerCase() === contact.email.toLowerCase()) ||
      (contact.phone && c.contact.phone === contact.phone)
  );

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/crm/contacts"
              className="text-xs text-[#D4AF37] hover:underline"
            >
              ← Contacts
            </Link>
            <h2 className="mt-1 text-lg font-semibold text-[#F5E6C8] sm:text-xl">
              {contactDisplayName(contact)}
            </h2>
            <p className="text-xs text-[#A89878] sm:text-sm">
              {contact.jobTitle}
              {company ? ` · ${company.name}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <LeadScoreBadge score={contact.leadScore} />
            <ScoreContactButton contactId={contact.id} />
          </div>
        </div>
        {contact.leadScoreReason && (
          <p className="mt-2 text-xs text-[#A89878] sm:text-sm">{contact.leadScoreReason}</p>
        )}
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        <CrmAiInsightsPanel contactId={contact.id} />

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5 lg:col-span-1">
            <h3 className="text-sm font-semibold text-[#F5E6C8]">Details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-[#A89878]">Email</dt>
                <dd className="break-all">{contact.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[#A89878]">Phone</dt>
                <dd>{contact.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[#A89878]">Purchase total</dt>
                <dd>
                  {contact.purchaseTotal > 0
                    ? `£${contact.purchaseTotal.toLocaleString()}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#A89878]">Tags</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-[#141414] text-[#A89878] ring-[#3d3528]"
                    >
                      {tag.replace("_", " ")}
                    </Badge>
                  ))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-[#F5E6C8]">
              Communication history
            </h3>
            {linkedConversations.length === 0 ? (
              <p className="mt-2 text-sm text-[#A89878]">
                No linked inbox conversations.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {linkedConversations.map((conv) => (
                  <li key={conv.id}>
                    <Link
                      href={`/inbox/${conv.id}`}
                      className="block rounded-lg border border-[#3d3528] px-3 py-2 hover:bg-[#141414]"
                    >
                      <p className="text-sm font-medium text-[#F5E6C8]">
                        Inbox thread
                      </p>
                      <p className="text-xs text-[#A89878]">
                        {conv.channels.join(", ")} · {conv.timeline.length} events
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
            <h3 className="text-sm font-semibold text-[#F5E6C8]">Opportunities</h3>
            <ul className="mt-3 space-y-2">
              {deals.map((deal) => (
                <li
                  key={deal.id}
                  className="flex flex-col gap-1 rounded-lg border border-[#3d3528] px-3 py-2 text-sm sm:flex-row sm:justify-between sm:gap-2"
                >
                  <span>{deal.title}</span>
                  <span className="font-medium text-[#D4AF37]">
                    £{deal.value.toLocaleString()}
                  </span>
                </li>
              ))}
              {deals.length === 0 && (
                <p className="text-sm text-[#A89878]">No deals linked.</p>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
            <h3 className="text-sm font-semibold text-[#F5E6C8]">Tasks</h3>
            <ul className="mt-3 space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-lg border border-[#3d3528] px-3 py-2 text-sm"
                >
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-[#A89878]">{task.status}</p>
                </li>
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-[#A89878]">No tasks linked.</p>
              )}
            </ul>
          </section>
        </div>

        <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
          <h3 className="text-sm font-semibold text-[#F5E6C8]">Activities</h3>
          <ul className="mt-3 space-y-3">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="border-l-2 border-[#D4AF37]/40 pl-3 text-sm"
              >
                <p className="font-medium text-[#F5E6C8]">
                  [{activity.type}] {activity.title}
                </p>
                {activity.description && (
                  <p className="text-[#A89878]">{activity.description}</p>
                )}
                <p className="text-xs text-[#A89878]">
                  {format(new Date(activity.occurredAt), "dd MMM yyyy HH:mm")}
                  {activity.authorName ? ` · ${activity.authorName}` : ""}
                </p>
              </li>
            ))}
            {activities.length === 0 && (
              <p className="text-sm text-[#A89878]">No activities logged.</p>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}

export const metadata = { title: "Contact" };
