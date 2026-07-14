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
  conversations: { id: string; name: string }[];
  runs: AgentRun[];
  memory: AgentMemoryEntry[];
  tasks: CrmTask[];
}) {
  const [tab, setTab] = useState<AgentProfileTab>("run");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AgentProfileTabs active={tab} onChange={setTab} />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        {tab === "run" && (
          <>
            <AgentRunPanel
              agent={agent}
              contacts={contacts}
              conversations={conversations}
            />
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Recent runs
              </h3>
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
        {tab === "tasks" && <AgentTasksPanel tasks={tasks} />}
      </div>
    </div>
  );
}
