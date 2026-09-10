import { notFound } from "next/navigation";
import { Customer360View } from "@/components/crm/customer-360";
import { mergeCustomerTimeline } from "@/lib/crm/customer-360";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getEventRepository } from "@/lib/data/event-store";
import { getFinanceStore } from "@/lib/data/platform-store";
import { getProjectRepository } from "@/lib/data/project-store";
import { getRepository } from "@/lib/data/repository";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { activeMemberOptions, memberNameByUserId } from "@/lib/crm/members";
import { getSessionContext } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";
import { formatRelative } from "@/lib/utils";

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
  if (!contact) notFound();

  const name = contactDisplayName(contact);
  const [company, companies, activities, deals, tasks, members, projects, invoices, events, ...linkedById] =
    await Promise.all([
      contact.accountId ? repo.getCompany(contact.accountId, scope) : null,
      repo.listCompanies(scope),
      repo.listActivities(scope, { contactId: id }),
      repo.listDeals(scope, { contactId: id }),
      repo.listTasks(scope, { contactId: id }),
      getTenantRepository().listMembers(scope),
      getProjectRepository().listProjects(scope),
      getFinanceStore().list(scope),
      getEventRepository().list(scope, { entityId: id, limit: 20 }),
      ...contact.conversationIds.map((cid) =>
        getRepository().getConversation(cid, scope)
      ),
    ]);

  const linkedConversations = linkedById.filter(
    (c): c is NonNullable<typeof c> => c !== null
  );
  const relatedProjects = projects.filter((project) => project.contactId === id);
  const relatedInvoices = invoices.filter((invoice) => {
    const haystack = `${invoice.clientName}`.toLowerCase();
    return haystack.includes(name.toLowerCase()) || (contact.email && haystack.includes(contact.email.toLowerCase()));
  });
  const openTask = tasks.find((task) => task.status !== "done");
  const last = [...activities].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )[0];

  const timeline = mergeCustomerTimeline({
    activities,
    conversations: linkedConversations,
    events,
    notes: contact.notes,
  });

  return (
    <Customer360View
      name={name}
      contact={contact}
      company={company}
      companies={companies.map((item) => ({ id: item.id, name: item.name }))}
      members={activeMemberOptions(members)}
      currentUserId={ctx.userId}
      deals={deals}
      tasks={tasks}
      conversations={linkedConversations}
      projects={relatedProjects}
      invoices={relatedInvoices}
      timeline={timeline}
      nextAction={
        openTask?.title ??
        (linkedConversations[0] ? "Reply in inbox" : "Log a note or create a deal")
      }
      lastInteraction={
        last
          ? formatRelative(last.occurredAt)
          : linkedConversations[0]
            ? formatRelative(linkedConversations[0].lastActivityAt)
            : "No interactions yet"
      }
    />
  );
}

export const metadata = { title: "Customer 360" };
