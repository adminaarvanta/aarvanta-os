import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { AskAiButton } from "@/components/ai-team/ask-ai-button";
import {
  CrmAvatar,
  CrmEmptyState,
  CrmShell,
  CrmTag,
  CrmToolbar,
} from "@/components/crm/crm-shell";
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
    <CrmShell
      title="Conversations"
      description="Inbox threads linked to people in CRM."
      actions={<AskAiButton module="crm" />}
    >
      <CrmToolbar>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Link
            href="/inbox"
            className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#1a2f59] to-[#2f7f92] px-3 py-1.5 text-xs font-medium text-white shadow-[0_6px_16px_rgba(26,47,89,0.24)] hover:brightness-[1.06]"
          >
            Open Inbox
          </Link>
        </div>
      </CrmToolbar>
      {linked.length === 0 ? (
        <CrmEmptyState
          icon={MessageSquare}
          accent="navy"
          title="No linked conversations"
          description="Qualify inbox threads or link people to start a relationship timeline."
          action={
            <Link
              href="/inbox"
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-[#1a2f59] to-[#2f7f92] px-4 py-2 text-sm font-medium text-white shadow-[0_6px_16px_rgba(26,47,89,0.24)] hover:brightness-[1.06]"
            >
              Open Inbox
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {linked.map((conv) => {
            const person = contactById.get(conv.contact.id);
            const name = person
              ? contactDisplayName(person)
              : conv.contact.name;
            return (
              <li key={conv.id}>
                <Link
                  href={`/inbox/${conv.id}`}
                  className="flex items-start gap-3 rounded-2xl border border-border/80 bg-surface-elevated px-4 py-3 transition hover:border-[#2f7f92]/40 hover:bg-sky-500/[0.04]"
                >
                  <CrmAvatar name={name} seed={person?.id ?? conv.id} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate font-medium text-foreground">
                        {name}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        {conv.unreadCount > 0 ? (
                          <span className="rounded-full bg-gradient-to-r from-[#1a2f59] to-[#2f7f92] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                            {conv.unreadCount} new
                          </span>
                        ) : null}
                        <time className="text-[11px] text-muted">
                          {new Date(conv.lastActivityAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </div>
                    <p className="mt-0.5 text-xs font-medium text-foreground/80">
                      {conv.timelineEventCount ?? conv.timeline.length} events
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {conv.channels.map((channel) => (
                        <CrmTag key={channel}>{channel}</CrmTag>
                      ))}
                      {conv.sentiment ? (
                        <CrmTag>{conv.sentiment}</CrmTag>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </CrmShell>
  );
}

export const metadata = { title: "Conversations" };
