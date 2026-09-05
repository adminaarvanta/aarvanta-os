"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AgentVoiceCloneCard } from "@/components/voice/agent-voice-clone-card";
import {
  PLAYBOOK_STEP_HINTS,
  playbookNextLabel,
  playbookWhenLabel,
} from "@/lib/calling/call-playbook";
import type {
  ConversationStageId,
  VoiceAgent,
  VoiceAgentFlowConfig,
} from "@/types/calling-agent";

export function FlowBuilder({
  agent,
  isPrimary = false,
}: {
  agent: VoiceAgent;
  isPrimary?: boolean;
}) {
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

  function updateSamplePrompt(id: ConversationStageId, samplePrompt: string) {
    setFlow((prev) => ({
      ...prev,
      stages: prev.stages.map((s) =>
        s.id === id ? { ...s, samplePrompt } : s
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
      setMessage("Playbook saved");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <AgentVoiceCloneCard agent={agent} isPrimary={isPrimary} />

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Call playbook
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            These are coaching notes for each part of the call — not a script to
            read aloud. {agent.name} will paraphrase in its own words. Defaults
            already work; edit a step only if you want a different goal.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {flow.stages.map((stage, index) => {
            const hint = PLAYBOOK_STEP_HINTS[stage.id];
            const isEntry = flow.entryStage === stage.id;
            const isEnd = stage.transitions.length === 0;
            return (
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
                  {isEntry ? (
                    <span className="rounded-full bg-[rgba(168,137,79,0.16)] px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-dark dark:text-gold-bright">
                      Starts here
                    </span>
                  ) : null}
                  {isEnd ? (
                    <span className="rounded-full bg-[var(--chart-ai-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--chart-ai)]">
                      Hang up
                    </span>
                  ) : null}
                </div>
                {hint ? (
                  <p className="mb-2 pl-2 text-[11px] text-muted">{hint}</p>
                ) : null}
                <label className="block pl-2 text-[11px] font-medium text-muted">
                  What to accomplish
                  <textarea
                    className="mt-1 min-h-[72px] w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                    value={stage.objective}
                    placeholder="Coaching note — not read word-for-word"
                    onChange={(e) =>
                      updateObjective(stage.id, e.target.value)
                    }
                  />
                </label>
                <details
                  className="mt-2 pl-2"
                  open={Boolean(stage.samplePrompt?.trim())}
                >
                  <summary className="cursor-pointer text-[11px] font-medium text-muted">
                    Optional example line
                  </summary>
                  <input
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
                    value={stage.samplePrompt ?? ""}
                    placeholder="A sentence they might say — they will paraphrase it"
                    onChange={(e) =>
                      updateSamplePrompt(stage.id, e.target.value)
                    }
                  />
                </details>
                <div className="mt-2 flex flex-wrap gap-1 pl-2">
                  {stage.transitions.map((t) => (
                    <span
                      key={`${stage.id}-${t.when}-${t.to}`}
                      className="rounded-full bg-[var(--chart-ops-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--chart-ops)]"
                    >
                      If {playbookWhenLabel(t.when)} →{" "}
                      {playbookNextLabel(t.to, flow.stages)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save playbook"}
          </Button>
          {message ? <p className="text-sm text-muted">{message}</p> : null}
        </div>
      </section>
    </div>
  );
}
