"use client";

import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RunWorkflowButton({
  workflowId,
  label = "Run workflow",
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
      <Button type="button" onClick={() => void run()} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {label}
      </Button>
      {error && <p className="text-[10px] text-danger">{error}</p>}
    </div>
  );
}
