"use client";

import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { useState } from "react";
import { FlowPrimaryButton } from "@/components/workflow/workflow-shell";

export function RunWorkflowButton({
  workflowId,
  label = "Try it",
}: {
  workflowId: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        run?: { id: string };
        error?: string | { message?: string };
      };
      if (!res.ok || !data.run) {
        setError(
          typeof data.error === "string"
            ? data.error
            : typeof data.error === "object" && data.error?.message
              ? data.error.message
              : "Run failed"
        );
        return;
      }
      router.push(`/workflows/runs/${data.run.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <FlowPrimaryButton
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="!px-4 !py-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {label}
      </FlowPrimaryButton>
      {error && (
        <p className="text-[10px]" style={{ color: "var(--flow-danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
