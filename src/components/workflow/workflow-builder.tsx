"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";

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
    <div className="rounded-xl border border-[#3d3528] bg-[#141414] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#D4AF37]" />
        <h3 className="text-sm font-semibold text-[#F5E6C8]">AI Workflow Builder</h3>
      </div>
      <p className="mt-1 text-xs text-[#A89878]">
        Describe what you want to automate — we map it to triggers, agents, and approvals.
      </p>
      <form onSubmit={handleGenerate} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g. When a deal closes, notify ops and create onboarding tasks"
          className="min-w-0 flex-1 rounded-lg border border-[#3d3528] bg-[#0a0a0a] px-3 py-2 text-sm text-[#F5E6C8] outline-none focus:border-[#D4AF37]"
        />
        <button
          type="submit"
          disabled={loading || !intent.trim()}
          className="shrink-0 rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:bg-[#F9E076] disabled:opacity-50"
        >
          {loading ? "Generating…" : "Generate workflow"}
        </button>
      </form>
      {error ? (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
