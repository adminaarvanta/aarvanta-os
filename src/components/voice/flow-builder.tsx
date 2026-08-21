"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentVoiceCloneCard } from "@/components/voice/agent-voice-clone-card";
import type {
  ConversationStageId,
  VoiceAgent,
  VoiceAgentFlowConfig,
} from "@/types/calling-agent";

export function FlowBuilder({ agent }: { agent: VoiceAgent }) {
  const router = useRouter();
  const [flow, setFlow] = useState<VoiceAgentFlowConfig>(agent.flowConfig);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateObjective(id: ConversationStageId, objective: string) {
    setFlow((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === id ? { ...s, objective } : s
      ),
    }));
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/voice/agents/${agent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowConfig: flow }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage("Flow saved");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <AgentVoiceCloneCard agent={agent} />
      <p className="text-sm text-muted">
        Stage machine for {agent.name}. Edit objectives and review allowed
        branches — the voice relay follows this order on campaign calls.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        {flow.stages.map((stage, index) => (
          <div
            key={stage.id}
            className="relative overflow-hidden rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm"
          >
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[var(--navy)] dark:bg-gold" />
            <div className="mb-2 flex items-center justify-between gap-2 pl-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[11px] font-bold text-[var(--navy)] dark:text-gold">
                  {index + 1}
                </span>
                <h3 className="text-sm font-semibold text-foreground">
                  {stage.label}
                </h3>
              </div>
              {flow.entryStage === stage.id ? (
                <span className="rounded-full bg-[rgba(168,137,79,0.16)] px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-dark dark:text-gold-bright">
                  Entry
                </span>
              ) : null}
            </div>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
              value={stage.objective}
              onChange={(e) =>
                updateObjective(stage.id, e.target.value)
              }
            />
            <div className="mt-2 flex flex-wrap gap-1 pl-2">
              {stage.transitions.map((t) => (
                <span
                  key={`${stage.id}-${t.when}-${t.to}`}
                  className="rounded-full bg-[var(--chart-ops-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--chart-ops)]"
                >
                  {t.when} → {t.to.replace(/_/g, " ")}
                </span>
              ))}
              {!stage.transitions.length ? (
                <span className="rounded-full bg-[var(--chart-ai-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--chart-ai)]">
                  Terminal
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save flow"}
        </Button>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </div>
    </div>
  );
}
