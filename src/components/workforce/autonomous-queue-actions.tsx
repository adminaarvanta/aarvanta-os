"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import type { AgentType } from "@/types/workforce";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";

export function AutonomousQueueActions() {
  const router = useRouter();
  const [agentType, setAgentType] = useState<AgentType>("coo");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [processBusy, setProcessBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function enqueueAndRun(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/autonomous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentType,
          goal: goal.trim(),
          executeNow: true,
        }),
      });
      const data = (await res.json()) as {
        error?: { message?: string };
        task?: { status?: string };
        run?: { id?: string };
      };
      if (!res.ok && !data.task) {
        setMessage(
          typeof data.error?.message === "string"
            ? data.error.message
            : "Failed to queue task"
        );
        return;
      }
      setGoal("");
      setMessage(
        data.task?.status === "completed"
          ? `Agent finished the goal${data.run?.id ? " and saved a workforce run" : ""}.`
          : data.task?.status === "failed"
            ? data.error?.message ?? "Agent failed — check CRM task to retry"
            : "Queued for the agent"
      );
      router.refresh();
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function processCrmQueue() {
    setProcessBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/workforce/tasks/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 10 }),
      });
      const data = (await res.json()) as {
        processedCount?: number;
        failedCount?: number;
      };
      if (!res.ok) {
        setMessage("Could not process CRM agent tasks");
        return;
      }
      setMessage(
        `Processed ${data.processedCount ?? 0} CRM agent task(s)${
          data.failedCount ? `, ${data.failedCount} failed` : ""
        }.`
      );
      router.refresh();
    } catch {
      setMessage("Network error");
    } finally {
      setProcessBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface-elevated p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Give an agent work
          </h3>
          <p className="mt-1 text-xs text-muted">
            Goals become CRM tasks assigned to the agent, then the agent works
            and marks them done (pipeline updates when a deal is linked).
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={processBusy || busy}
          onClick={() => void processCrmQueue()}
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {processBusy ? "Processing…" : "Process open CRM agent tasks"}
        </Button>
      </div>

      <form onSubmit={enqueueAndRun} className="space-y-3">
        <select
          value={agentType}
          onChange={(e) => setAgentType(e.target.value as AgentType)}
          className={inputClass}
        >
          {AGENT_DEFINITIONS.map((agent) => (
            <option key={agent.type} value={agent.type}>
              {agent.name} — {agent.primaryFunction}
            </option>
          ))}
        </select>
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Goal for the agent (e.g. Review open pipeline and follow up hot leads)"
          required
          className={inputClass}
        />
        <Button type="submit" size="sm" disabled={busy || !goal.trim()}>
          {busy ? "Running…" : "Queue & run now"}
        </Button>
      </form>
      {message && <p className="text-xs text-muted">{message}</p>}
    </div>
  );
}
