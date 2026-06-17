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

  async function run() {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Run failed");
      router.push(`/workflows/runs/${data.run.id}`);
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button type="button" onClick={run} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
