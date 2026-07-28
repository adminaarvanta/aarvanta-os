"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import {
  FlowPanel,
  FlowPrimaryButton,
  flowInputClass,
} from "@/components/workflow/workflow-shell";

export function WorkflowBuilder() {
  const router = useRouter();
  const [intent, setIntent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!intent.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/workflows/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: intent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message ?? "Failed to generate workflow");
      }
      router.push(`/workflows/${data.workflow.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FlowPanel
      className="!p-5"
      style={{
        background:
          "linear-gradient(135deg, var(--flow-accent-soft) 0%, #FFFFFF 55%, var(--flow-cyan-soft) 100%)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "var(--flow-accent)", color: "#fff" }}
        >
          <Sparkles className="h-4 w-4" />
        </div>
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--flow-ink)" }}
        >
          Describe a BDM play
        </h3>
      </div>
      <p className="mt-2 text-xs" style={{ color: "var(--flow-muted)" }}>
        Example: “When a lead scores hot, send WhatsApp and create a follow-up
        task” — then edit steps.
      </p>
      <form
        onSubmit={handleGenerate}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g. WhatsApp intro to a new prospect, then book a discovery call"
          className={flowInputClass}
          style={{ borderColor: "var(--flow-line)", color: "var(--flow-ink)" }}
        />
        <FlowPrimaryButton
          type="submit"
          disabled={loading || !intent.trim()}
          className="shrink-0"
        >
          {loading ? "Building…" : "Build playbook"}
        </FlowPrimaryButton>
      </form>
      {error ? (
        <p
          className="mt-2 text-xs"
          role="alert"
          style={{ color: "var(--flow-danger)" }}
        >
          {error}
        </p>
      ) : null}
    </FlowPanel>
  );
}
