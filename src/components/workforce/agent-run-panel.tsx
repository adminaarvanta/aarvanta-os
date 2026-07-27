"use client";

import { useState } from "react";
import { RunAgentButton } from "@/components/workforce/run-agent-button";
import { WfPanel } from "@/components/workforce/workforce-shell";
import type { AgentDefinition } from "@/types/workforce";

const selectClass =
  "mt-1.5 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[var(--wf-accent)]";

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
    <WfPanel className="space-y-4">
      <div>
        <h3 className="text-[15px] font-bold" style={{ color: "var(--wf-ink)" }}>
          Run {agent.name}
        </h3>
        <p className="mt-0.5 text-sm" style={{ color: "var(--wf-muted)" }}>
          {agent.primaryFunction}
        </p>
      </div>

      {(needsContact || !needsConversation) && contacts.length > 0 && (
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
        </div>
      )}

      {(needsConversation || needsContact) && conversations.length > 0 && (
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--wf-muted)" }}
          >
            Conversation {needsConversation ? "(required)" : "(optional)"}
          </label>
          <select
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            className={selectClass}
            style={{ borderColor: "var(--wf-line)", color: "var(--wf-ink)" }}
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
        <p className="text-sm" style={{ color: "var(--wf-muted)" }}>
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
        <p className="text-sm font-medium" style={{ color: "var(--wf-accent)" }}>
          Select the required context above to run this agent.
        </p>
      )}
    </WfPanel>
  );
}
