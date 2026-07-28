"use client";

import { AgentChatPanel } from "@/components/workforce/agent-chat-panel";
import { AgentMemoryPanel } from "@/components/workforce/agent-memory-panel";
import { AgentRunPanel } from "@/components/workforce/agent-run-panel";
import {
  AgentProfileTabs,
  type AgentProfileTab,
} from "@/components/workforce/agent-profile-tabs";
import { AgentTasksPanel } from "@/components/workforce/agent-tasks-panel";
import { RunList } from "@/components/workforce/run-list";
import type { AgentDefinition, AgentMemoryEntry, AgentRun } from "@/types/workforce";
import type { CrmTask } from "@/types/crm";
import { useState } from "react";

export function AgentProfileView({
  agent,
  contacts,
  conversations,
  runs,
  memory,
  tasks,
}: {
  agent: AgentDefinition;
  contacts: { id: string; name: string }[];
  conversations: {
    id: string;
    name: string;
    contactId: string;
    lastActivityAt?: string;
  }[];
  runs: AgentRun[];
  memory: AgentMemoryEntry[];
  tasks: CrmTask[];
}) {
  const [tab, setTab] = useState<AgentProfileTab>("run");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="pt-4">
        <AgentProfileTabs active={tab} onChange={setTab} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          {tab === "run" && (
            <>
              <AgentRunPanel
                agent={agent}
                contacts={contacts}
                conversations={conversations}
              />
              <section
                className="overflow-hidden rounded-xl border bg-white shadow-[0_1px_3px_rgba(14,21,37,0.04)]"
                style={{ borderColor: "var(--wf-line)" }}
              >
                <div
                  className="border-b px-5 py-3"
                  style={{ borderColor: "var(--wf-line)" }}
                >
                  <h3
                    className="text-sm font-bold"
                    style={{ color: "var(--wf-ink)" }}
                  >
                    Recent runs
                  </h3>
                </div>
                <RunList runs={runs} />
              </section>
            </>
          )}
          {tab === "chat" && (
            <AgentChatPanel agentType={agent.type} agentName={agent.name} />
          )}
          {tab === "memory" && (
            <AgentMemoryPanel agentType={agent.type} initialMemory={memory} />
          )}
          {tab === "tasks" && (
            <AgentTasksPanel tasks={tasks} agentType={agent.type} />
          )}
        </div>
      </div>
    </div>
  );
}
