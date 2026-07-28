"use client";

import { useState } from "react";
import { RunAgentButton } from "@/components/workforce/run-agent-button";
import { WfPanel } from "@/components/workforce/workforce-shell";
import type { AgentDefinition } from "@/types/workforce";

const selectClass =
  "mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[var(--wf-accent)]";

type ContactOption = { id: string; name: string };
type ConversationOption = {
  id: string;
  name: string;
  contactId: string;
  lastActivityAt?: string;
};

function conversationForContact(
  contactId: string,
  conversations: ConversationOption[]
): ConversationOption | undefined {
  const matches = conversations.filter((c) => c.contactId === contactId);
  if (!matches.length) return undefined;
  return [...matches].sort((a, b) => {
    const aAt = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
    const bAt = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
    return bAt - aAt;
  })[0];
}

export function AgentRunPanel({
  agent,
  contacts,
  conversations,
}: {
  agent: AgentDefinition;
  contacts: ContactOption[];
  conversations: ConversationOption[];
}) {
  const [contactId, setContactId] = useState("");

  const needsContact = agent.requiresContact;
  const linkedConversation = contactId
    ? conversationForContact(contactId, conversations)
    : undefined;
  const canRun = !needsContact || Boolean(contactId);

  return (
    <WfPanel className="space-y-4">
      <div>
        <h3 className="text-[15px] font-bold" style={{ color: "var(--wf-ink)" }}>
          Run {agent.name}
        </h3>
        <p className="mt-0.5 text-sm" style={{ color: "var(--wf-muted)" }}>
          {agent.primaryFunction}
        </p>
      </div>

      {contacts.length > 0 ? (
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--wf-muted)" }}
          >
            Contact {needsContact ? "(required)" : "(optional)"}
          </label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className={selectClass}
            style={{ borderColor: "var(--wf-line)", color: "var(--wf-ink)" }}
          >
            <option value="">Select contact…</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {contactId ? (
            <p className="mt-1.5 text-xs" style={{ color: "var(--wf-muted)" }}>
              {linkedConversation
                ? "Inbox thread for this contact will be included automatically."
                : "No inbox thread found for this contact — running on CRM context only."}
            </p>
          ) : null}
        </div>
      ) : null}

      {!needsContact && !contactId ? (
        <p className="text-sm" style={{ color: "var(--wf-muted)" }}>
          Runs a business-wide analysis using CRM and inbox data.
        </p>
      ) : null}

      {canRun ? (
        <RunAgentButton
          agentType={agent.type}
          contactId={contactId || undefined}
          conversationId={linkedConversation?.id}
          label={`Run ${agent.name}`}
        />
      ) : (
        <p className="text-sm font-medium" style={{ color: "var(--wf-accent)" }}>
          Select a contact to run this agent.
        </p>
      )}
    </WfPanel>
  );
}
