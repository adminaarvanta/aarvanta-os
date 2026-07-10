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
    <div className="rounded-xl border border-[#243656] bg-[#121E32] p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#B8965D]" />
        <h3 className="text-sm font-semibold text-[#FFFFFF]">AI Workflow Builder</h3>
      </div>
      <p className="mt-1 text-xs text-[#9AABC4]">
        Describe what you want to automate — we map it to triggers, agents, and approvals.
      </p>
      <form onSubmit={handleGenerate} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g. When a deal closes, notify ops and create onboarding tasks"
          className="min-w-0 flex-1 rounded-lg border border-[#243656] bg-[#040608] px-3 py-2 text-sm text-[#FFFFFF] outline-none focus:border-[#B8965D]"
        />
        <button
          type="submit"
          disabled={loading || !intent.trim()}
          className="shrink-0 rounded-lg bg-[#B8965D] px-4 py-2 text-sm font-semibold text-black hover:bg-[#C9AA72] disabled:opacity-50"
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
