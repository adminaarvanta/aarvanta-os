"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold focus:ring-1 focus:ring-gold/30";

const DEFAULT_STAGES = "New, Qualified, Proposal, Negotiation, Won";

export function CreatePipelineForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [stagesText, setStagesText] = useState(DEFAULT_STAGES);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const stageNames = stagesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const stages = stageNames.map((stageName, i) => ({
        name: stageName,
        order: i,
        probability: Math.min(100, Math.round(((i + 1) / stageNames.length) * 100)),
      }));
      const res = await fetch("/api/pipelines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), stages }),
      });
      if (res.ok) {
        const data = (await res.json()) as { pipeline?: { id: string } };
        setName("");
        setStagesText(DEFAULT_STAGES);
        setOpen(false);
        if (data.pipeline?.id) {
          router.push(`/crm/pipelines?pipeline=${data.pipeline.id}`);
        }
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Add pipeline
      </Button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-surface-elevated p-4 space-y-3"
    >
      <p className="text-sm font-medium text-foreground">New pipeline</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Pipeline name *"
        required
        className={inputClass}
      />
      <div>
        <label className="mb-1 block text-xs text-muted">
          Stages (comma-separated)
        </label>
        <input
          value={stagesText}
          onChange={(e) => setStagesText(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? "Saving…" : "Create pipeline"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
