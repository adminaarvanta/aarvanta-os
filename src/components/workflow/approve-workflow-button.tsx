"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkflowRun } from "@/types/workflow";

export function ApproveWorkflowButton({ run }: { run: WorkflowRun }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (run.status !== "awaiting_approval") return null;

  async function approve() {
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/runs/${run.id}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Approve failed");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-amber-800/50 bg-amber-950/30 p-4">
      <p className="text-sm font-medium text-amber-200">Approval required</p>
      <p className="mt-1 text-xs text-amber-200/80">
        {run.pendingApproval?.message}
      </p>
      <Button type="button" className="mt-3" onClick={approve} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        Approve &amp; continue
      </Button>
    </div>
  );
}
