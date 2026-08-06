import Link from "next/link";
import { notFound } from "next/navigation";
import { ConversationReplay } from "@/components/voice/conversation-replay";
import { VoicePageShell } from "@/components/voice/voice-ui";
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
    <VoicePageShell
      title="Conversation replay"
      subtitle={
        contact
          ? `${contactDisplayName(contact)}${company ? ` · ${company.name}` : ""}`
          : "Transcript, AI decisions, and CRM updates"
      }
      tone="blue"
      actions={
        <Link
          href="/voice/history"
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-muted hover:text-foreground"
        >
          ← Call History
        </Link>
      }
    >
      <ConversationReplay
        session={{
          ...session,
          contactName: contact ? contactDisplayName(contact) : undefined,
          companyName: company?.name,
          phone: contact?.phone,
        }}
      />
    </VoicePageShell>
  );
}

export const metadata = { title: "Voice OS · Replay" };
