"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
      className={
        enabled
          ? "rounded-full bg-accent-cyan/15 px-3 py-1 text-xs font-medium text-accent-cyan ring-1 ring-accent-cyan/30"
          : "rounded-full bg-danger/15 px-3 py-1 text-xs font-medium text-danger ring-1 ring-danger/40"
      }
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
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-danger"
      disabled={busy}
      onClick={() => void onDelete()}
    >
      {busy ? "Deleting…" : "Delete"}
    </Button>
  );
}
