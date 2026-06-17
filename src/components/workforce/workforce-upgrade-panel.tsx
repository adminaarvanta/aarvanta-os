"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAgentDefinition } from "@/lib/workforce/agents";
import type { AgentCollaboration, AgentType, SharedMemoryEntry } from "@/types/workforce";
import { formatRelative } from "@/lib/utils";

export function WorkforceUpgradePanel({
  sharedMemory,
  collaborations,
}: {
  sharedMemory: SharedMemoryEntry[];
  collaborations: AgentCollaboration[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function runCollaboration() {
    setBusy(true);
    try {
      await fetch("/api/workforce/collaborate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Cross-agent business review",
          leadAgent: "ceo",
          participantAgents: ["ceo", "sales_manager", "coo"],
        }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#F5E6C8]">Shared memory</h3>
          <Badge className="bg-[#141414] text-[#A89878] ring-[#3d3528]">
            Cross-agent
          </Badge>
        </div>
        <ul className="grid gap-4 lg:grid-cols-2">
          {sharedMemory.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-[#3d3528] bg-[#101010] p-4"
            >
              <p className="font-medium text-[#F5E6C8]">{entry.title}</p>
              <p className="mt-2 text-xs text-[#A89878] line-clamp-3">
                {entry.content}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {entry.contributedBy.map((a) => (
                  <Badge
                    key={a}
                    className="bg-[#D4AF37]/10 text-[#F9E076] ring-[#D4AF37]/30"
                  >
                    {getAgentDefinition(a as AgentType).name}
                  </Badge>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#F5E6C8]">Agent collaboration</h3>
          <Button size="sm" onClick={runCollaboration} disabled={busy}>
            Run collaboration
          </Button>
        </div>
        <ul className="space-y-4">
          {collaborations.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-[#3d3528] bg-[#101010] p-4"
            >
              <p className="font-medium text-[#F5E6C8]">{c.title}</p>
              <p className="mt-1 text-xs text-[#A89878]">
                Lead: {getAgentDefinition(c.leadAgent).name} ·{" "}
                {formatRelative(c.createdAt)}
              </p>
              <p className="mt-2 text-sm text-[#C4B896]">{c.summary}</p>
              <ul className="mt-3 space-y-1">
                {c.insights.map((insight) => (
                  <li key={insight} className="text-xs text-[#A89878]">
                    · {insight}
                  </li>
                ))}
              </ul>
              {c.assignedTaskIds.length > 0 && (
                <p className="mt-2 text-[10px] text-[#D4AF37]">
                  {c.assignedTaskIds.length} task(s) assigned to agents
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
