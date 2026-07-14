"use client";

import { useState } from "react";
import { RunAgentButton } from "@/components/workforce/run-agent-button";
import type { AgentDefinition } from "@/types/workforce";

export function AgentRunPanel({
  agent,
  contacts,
  conversations,
}: {
  agent: AgentDefinition;
  contacts: { id: string; name: string }[];
  conversations: { id: string; name: string }[];
}) {
  const [contactId, setContactId] = useState("");
  const [conversationId, setConversationId] = useState("");

  const needsContact = agent.requiresContact;
  const needsConversation = agent.requiresConversation;
  const canRun =
    (!needsContact || contactId) && (!needsConversation || conversationId);

  return (
    <section className="rounded-xl border border-border bg-surface-elevated p-5 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Run {agent.name}</h3>

      {(needsContact || !needsConversation) && contacts.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-muted">
            Contact {needsContact ? "(required)" : "(optional)"}
          </label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select contact…</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {(needsConversation || needsContact) && conversations.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-muted">
            Conversation {needsConversation ? "(required)" : "(optional)"}
          </label>
          <select
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select conversation…</option>
            {conversations.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!needsContact && !needsConversation && (
        <p className="text-xs text-muted">
          Runs a business-wide analysis using CRM and inbox data.
        </p>
      )}

      {canRun ? (
        <RunAgentButton
          agentType={agent.type}
          contactId={contactId || undefined}
          conversationId={conversationId || undefined}
          label={`Run ${agent.name}`}
        />
      ) : (
        <p className="text-xs text-gold-bright">
          Select the required context above to run this agent.
        </p>
      )}
    </section>
  );
}
