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
          <h3 className="text-sm font-semibold text-foreground">Shared memory</h3>
          <Badge className="bg-surface-muted text-muted ring-border">
            Cross-agent
          </Badge>
        </div>
        <ul className="grid gap-4 lg:grid-cols-2">
          {sharedMemory.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-border bg-surface-elevated p-4"
            >
              <p className="font-medium text-foreground">{entry.title}</p>
              <p className="mt-2 text-xs text-muted line-clamp-3">
                {entry.content}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {entry.contributedBy.map((a) => (
                  <Badge
                    key={a}
                    className="bg-gold/10 text-gold-bright ring-gold/30"
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
          <h3 className="text-sm font-semibold text-foreground">Agent collaboration</h3>
          <Button size="sm" onClick={runCollaboration} disabled={busy}>
            Run collaboration
          </Button>
        </div>
        <ul className="space-y-4">
          {collaborations.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-border bg-surface-elevated p-4"
            >
              <p className="font-medium text-foreground">{c.title}</p>
              <p className="mt-1 text-xs text-muted">
                Lead: {getAgentDefinition(c.leadAgent).name} ·{" "}
                {formatRelative(c.createdAt)}
              </p>
              <p className="mt-2 text-sm text-gold-bright">{c.summary}</p>
              <ul className="mt-3 space-y-1">
                {c.insights.map((insight) => (
                  <li key={insight} className="text-xs text-muted">
                    · {insight}
                  </li>
                ))}
              </ul>
              {c.assignedTaskIds.length > 0 && (
                <p className="mt-2 text-[10px] text-gold">
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
