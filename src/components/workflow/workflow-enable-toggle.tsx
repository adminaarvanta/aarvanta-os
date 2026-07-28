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
      onClick={() => void toggle()}
      disabled={busy}
      className="rounded-full px-3 py-1 text-xs font-semibold transition"
      style={{
        background: enabled ? "var(--flow-ok-soft)" : "var(--flow-danger-soft)",
        color: enabled ? "var(--flow-ok)" : "var(--flow-danger)",
      }}
      title="Toggle automation on/off"
    >
      {busy ? "…" : enabled ? "On" : "Off"}
    </button>
  );
}

export function DeleteWorkflowButton({ workflowId }: { workflowId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this workflow? Run history will remain.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/workflows");
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
