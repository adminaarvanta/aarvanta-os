import Link from "next/link";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import { CrmNav } from "@/components/crm/crm-nav";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getRepository } from "@/lib/data/repository";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

export default async function ConversationsPage() {
  const scope = await getTenantScope();
  const [contacts, conversations] = await Promise.all([
    getCrmRepository().listContacts(scope),
    getRepository().listConversations(scope),
  ]);

  const contactById = new Map(contacts.map((c) => [c.id, c]));
  const linked = conversations
    .filter((c) => contactById.has(c.contact.id))
    .sort(
      (a, b) =>
        new Date(b.lastActivityAt).getTime() -
        new Date(a.lastActivityAt).getTime()
    );

  return (
    <>
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              Conversations
            </h2>
            <p className="text-xs text-muted sm:text-sm">
              Inbox threads linked to people in CRM.
            </p>
          </div>
          <AskAiButton module="crm" />
        </div>
      </header>
      <CrmNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
        <ul className="mx-auto max-w-3xl space-y-2">
          {linked.map((conv) => {
            const person = contactById.get(conv.contact.id);
            return (
              <li key={conv.id}>
                <Link
                  href={`/inbox/${conv.id}`}
                  className="block rounded-xl border border-border bg-surface-elevated px-4 py-3 transition hover:border-gold/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {person
                          ? contactDisplayName(person)
                          : conv.contact.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {conv.channels.join(", ")}
                        {conv.sentiment ? ` · ${conv.sentiment}` : ""}
                        {" · "}
                        {conv.timelineEventCount ?? conv.timeline.length} events
                      </p>
                    </div>
                    <time className="shrink-0 text-[10px] text-muted">
                      {new Date(conv.lastActivityAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </Link>
              </li>
            );
          })}
          {linked.length === 0 && (
            <p className="py-12 text-center text-sm text-muted">
              No CRM-linked conversations yet. Qualify inbox threads or link
              people to start a relationship timeline.
            </p>
          )}
        </ul>
      </div>
    </>
  );
}

export const metadata = { title: "Conversations" };
