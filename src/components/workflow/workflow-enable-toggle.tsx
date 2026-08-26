"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Workflow } from "@/types/workflow";

export function WorkflowEnableToggle({ workflow }: { workflow: Workflow }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(workflow.enabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !enabled;
    setEnabled(next);
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) setEnabled(!next);
      else router.refresh();
    } catch {
      setEnabled(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`${workflow.name} is ${enabled ? "on" : "off"}`}
      onClick={() => void toggle()}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full px-1 py-0.5 text-xs font-semibold transition disabled:opacity-60"
    >
      <span
        className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{ background: enabled ? "var(--flow-ok)" : "#D1D5DB" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-[left]"
          style={{ left: enabled ? "18px" : "2px" }}
        />
      </span>
      <span style={{ color: enabled ? "var(--flow-ok)" : "var(--flow-muted)" }}>
        {busy ? "…" : enabled ? "On" : "Off"}
      </span>
    </button>
  );
}

export function DeleteWorkflowButton({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this automation? Past history will still be here.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/automation");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onDelete()}
      className="rounded-full px-4 py-2 text-sm font-semibold transition hover:opacity-80 disabled:opacity-50"
      style={{ color: "var(--flow-danger)" }}
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
