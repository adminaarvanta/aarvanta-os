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
        throw new Error(data.error?.message ?? "Couldn’t create that. Try again.");
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
    <FlowPanel className="overflow-hidden !p-0">
      <div className="h-1.5 bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500" />
      <div
        className="p-5"
        style={{
          background:
            "linear-gradient(135deg, var(--flow-accent-soft) 0%, var(--flow-panel) 52%, var(--flow-cyan-soft) 100%)",
        }}
      >
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-[0_6px_14px_rgba(109,94,246,0.28)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--flow-ink)" }}
        >
          Want something else?
        </h3>
      </div>
      <p className="mt-2 text-xs" style={{ color: "var(--flow-muted)" }}>
        Type it the way you’d tell an assistant. We’ll set it up, then you can tweak it.
      </p>
      <form
        onSubmit={handleGenerate}
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g. Call people back if they miss us, and send an email"
          className={flowInputClass}
          style={{ borderColor: "var(--flow-line)", color: "var(--flow-ink)" }}
        />
        <FlowPrimaryButton
          type="submit"
          disabled={loading || !intent.trim()}
          className="shrink-0"
        >
          {loading ? "Creating…" : "Create it"}
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
      </div>
    </FlowPanel>
  );
}
