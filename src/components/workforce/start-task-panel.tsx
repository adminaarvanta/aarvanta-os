"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import {
  WfPrimaryButton,
  WfSecondaryButton,
} from "@/components/workforce/workforce-shell";
import { GOAL_OBJECTIVE_LABELS, agentLabel } from "@/lib/workforce/pipeline/labels";
import type { GoalObjective, WorkforceExecution } from "@/types/workforce";

const OBJECTIVES: GoalObjective[] = [
  "close_lead",
  "follow_up",
  "recover_customer",
  "book_meeting",
  "generate_proposal",
  "custom",
];

const LABELS: Record<GoalObjective, string> = {
  close_lead: "Close this Lead",
  follow_up: "Follow Up",
  recover_customer: "Recover Customer",
  book_meeting: "Book Meeting",
  generate_proposal: "Generate Proposal",
  custom: "Custom Goal",
};

export function StartTaskPanel({
  defaultOpen = true,
  contactId,
  dealId,
  conversationId,
  contactName,
}: {
  defaultOpen?: boolean;
  contactId?: string;
  dealId?: string;
  conversationId?: string;
  contactName?: string;
}) {
  const router = useRouter();
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
        setError(data.error?.message ?? "Failed to start job");
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
    const lead = created.assignedAgents[0];
    return (
      <div
        className="rounded-xl border bg-white p-8 text-center shadow-[0_1px_3px_rgba(14,21,37,0.04)]"
        style={{ borderColor: "var(--wf-line)" }}
      >
        <div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl"
          style={{ background: "var(--wf-accent-soft)" }}
        >
          <Bot className="h-12 w-12" style={{ color: "var(--wf-accent)" }} strokeWidth={1.5} />
        </div>
        <h3 className="mt-5 text-xl font-bold" style={{ color: "var(--wf-ink)" }}>
          Job Created Successfully!
        </h3>
        <dl
          className="mx-auto mt-6 max-w-sm space-y-2 rounded-xl border p-4 text-left text-sm"
          style={{ borderColor: "var(--wf-line)", background: "var(--wf-bg)" }}
        >
          <div className="flex justify-between gap-2">
            <dt style={{ color: "var(--wf-muted)" }}>Job</dt>
            <dd className="font-semibold">{GOAL_OBJECTIVE_LABELS[objective]}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt style={{ color: "var(--wf-muted)" }}>Assigned AI</dt>
            <dd className="font-semibold">
              {lead ? agentLabel(lead) : "AI Team"}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt style={{ color: "var(--wf-muted)" }}>Est. time</dt>
            <dd className="font-semibold">
              {created.estimatedMinutesMin}–{created.estimatedMinutesMax} min
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt style={{ color: "var(--wf-muted)" }}>Priority</dt>
            <dd
              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{
                background: "var(--wf-danger-soft)",
                color: "var(--wf-danger)",
              }}
            >
              High
            </dd>
          </div>
        </dl>
        <WfPrimaryButton
          type="button"
          className="mt-6"
          onClick={() => router.push(`/workforce/jobs/${created.id}`)}
        >
          View Job
        </WfPrimaryButton>
      </div>
    );
  }

  // defaultOpen unused when always shown as focused page — keep API stable
  void defaultOpen;

  return (
    <form
      onSubmit={onSubmit}
      className="overflow-hidden rounded-xl border bg-white shadow-[0_1px_3px_rgba(14,21,37,0.04)]"
      style={{ borderColor: "var(--wf-line)" }}
    >
      <div
        className="flex items-center gap-3 border-b px-5 py-4"
        style={{ borderColor: "var(--wf-line)" }}
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: "var(--wf-accent)" }}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: "var(--wf-ink)" }}>
            Ask AI Team
          </h3>
          {contactName ? (
            <p className="text-xs" style={{ color: "var(--wf-muted)" }}>
              For {contactName}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 p-5">
        <fieldset>
          <legend
            className="mb-3 text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--wf-muted)" }}
          >
            What do you want to achieve?
          </legend>
          <div className="space-y-2">
            {OBJECTIVES.map((obj) => {
              const selected = objective === obj;
              return (
                <label
                  key={obj}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition"
                  style={{
                    borderColor: selected ? "var(--wf-accent)" : "var(--wf-line)",
                    background: selected ? "var(--wf-accent-soft)" : "#fff",
                    color: "var(--wf-ink)",
                  }}
                >
                  <input
                    type="radio"
                    name="objective"
                    className="accent-[var(--wf-accent)]"
                    checked={selected}
                    onChange={() => setObjective(obj)}
                  />
                  {LABELS[obj]}
                </label>
              );
            })}
          </div>
        </fieldset>

        {objective === "custom" && (
          <input
            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[var(--wf-accent)]"
            style={{ borderColor: "var(--wf-line)" }}
            value={customObjective}
            onChange={(e) => setCustomObjective(e.target.value)}
            placeholder="Describe your goal"
            required
          />
        )}

        <div>
          <label
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--wf-muted)" }}
          >
            Instructions (Optional)
          </label>
          <textarea
            className="min-h-[88px] w-full resize-y rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[var(--wf-accent)]"
            style={{ borderColor: "var(--wf-line)" }}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={"Offer 10% discount if needed\nDon't call after 7 PM"}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--wf-danger)" }}>
            {error}
          </p>
        )}

        <WfPrimaryButton type="submit" disabled={busy} className="w-full">
          {busy ? "Starting…" : "Start AI Job"}
        </WfPrimaryButton>
      </div>
    </form>
  );
}
