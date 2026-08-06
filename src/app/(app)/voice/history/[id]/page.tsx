import Link from "next/link";
import { notFound } from "next/navigation";
import { ConversationReplay } from "@/components/voice/conversation-replay";
import { getCallingAgentRepository } from "@/lib/data/calling-agent-store";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getTenantScope } from "@/lib/tenant/context";
import { contactDisplayName } from "@/types/crm";

type Params = { params: Promise<{ id: string }> };

export default async function VoiceHistoryDetailPage({ params }: Params) {
  const { id } = await params;
  const scope = await getTenantScope();
  const session = await getCallingAgentRepository().getSession(id, scope);
  if (!session) notFound();

  const contact = session.contactId
    ? await getCrmRepository().getContact(session.contactId, scope)
    : null;
  const company =
    contact?.accountId
      ? await getCrmRepository().getCompany(contact.accountId, scope)
      : null;

  return (
    <>
      <header className="border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <p className="text-xs text-muted">
          <Link href="/voice/history" className="hover:text-gold">
            Call History
          </Link>
        </p>
        <h2 className="text-lg font-semibold text-foreground">
          Conversation replay
        </h2>
      </header>
      <ConversationReplay
        session={{
          ...session,
          contactName: contact ? contactDisplayName(contact) : undefined,
          companyName: company?.name,
          phone: contact?.phone,
        }}
      />
    </>
  );
}

export const metadata = { title: "Voice OS · Replay" };
