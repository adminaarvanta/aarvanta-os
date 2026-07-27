"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOAL_OBJECTIVE_LABELS } from "@/lib/workforce/pipeline/labels";
import { agentLabel } from "@/lib/workforce/pipeline/labels";
import type { GoalObjective, WorkforceExecution } from "@/types/workforce";
import { cn } from "@/lib/utils";

const OBJECTIVES: GoalObjective[] = [
  "close_lead",
  "follow_up",
  "recover_customer",
  "book_meeting",
  "generate_proposal",
  "custom",
];

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";

export function StartTaskPanel({
  defaultOpen = false,
  contactId,
  dealId,
  conversationId,
}: {
  defaultOpen?: boolean;
  contactId?: string;
  dealId?: string;
  conversationId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [objective, setObjective] = useState<GoalObjective>("close_lead");
  const [customObjective, setCustomObjective] = useState("");
  const [instructions, setInstructions] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<WorkforceExecution | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/workforce/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective,
          customObjective:
            objective === "custom" ? customObjective.trim() : undefined,
          instructions: instructions.trim() || undefined,
          relatedContactId: contactId,
          relatedDealId: dealId,
          relatedConversationId: conversationId,
        }),
      });
      const data = (await res.json()) as {
        error?: { message?: string };
        execution?: WorkforceExecution;
      };
      if (!res.ok || !data.execution) {
        setError(data.error?.message ?? "Failed to start task");
        return;
      }
      setCreated(data.execution);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-xl border border-border bg-surface-elevated p-6 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Task created successfully
          </h3>
          <p className="mt-1 text-sm text-muted">
            Assigned{" "}
            {created.assignedAgents.map(agentLabel).join(", ")}
            {created.monitoringAgents.length > 0
              ? ` · Monitored by ${created.monitoringAgents.map(agentLabel).join(", ")}`
              : ""}
          </p>
        </div>
        <dl className="mx-auto grid max-w-md grid-cols-2 gap-3 text-left text-sm">
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <dt className="text-xs text-muted">Estimated time</dt>
            <dd className="font-medium text-foreground">
              {created.estimatedMinutesMin}–{created.estimatedMinutesMax} min
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-surface-muted p-3">
            <dt className="text-xs text-muted">Status</dt>
            <dd className="font-medium capitalize text-foreground">
              {created.status.replace(/_/g, " ")}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            onClick={() => router.push(`/workforce/tasks/${created.id}`)}
          >
            View execution
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setCreated(null);
              setInstructions("");
              setOpen(true);
            }}
          >
            Start another
          </Button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated p-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            What do you want to achieve?
          </p>
          <p className="text-xs text-muted">
            Assign a business goal — AI employees are selected automatically.
          </p>
        </div>
        <Button type="button" onClick={() => setOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" />
          Start task
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-border bg-surface-elevated p-5"
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Ask AI Workforce
        </h3>
        <p className="text-xs text-muted">
          Select a goal. Optional instructions guide execution and approvals.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {OBJECTIVES.map((obj) => (
          <button
            key={obj}
            type="button"
            onClick={() => setObjective(obj)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
              objective === obj
                ? "border-gold bg-gold/10 text-foreground"
                : "border-border bg-background text-muted hover:border-gold/40 hover:text-foreground"
            )}
          >
            {GOAL_OBJECTIVE_LABELS[obj]}
          </button>
        ))}
      </div>

      {objective === "custom" && (
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">
            Custom goal
          </label>
          <input
            className={inputClass}
            value={customObjective}
            onChange={(e) => setCustomObjective(e.target.value)}
            placeholder="e.g. Collect outstanding payment from Acme"
            required
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">
          Instructions (optional)
        </label>
        <textarea
          className={cn(inputClass, "min-h-[88px] resize-y")}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={"Offer maximum 10% discount\nDo not call after 7 PM\nFocus on CRM package"}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Starting…" : "Start task"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => setOpen(false)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
