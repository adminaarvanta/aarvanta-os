"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client-fetch";
import type { AgentAction } from "@/types/workforce";

export function ApplyActionButton({
  runId,
  action,
}: {
  runId: string;
  action: AgentAction;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isInfoOnly = action.type === "suggest_reply" || action.type === "alert";

  function apply() {
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await apiFetch<{ result?: { message: string } }>(
        `/api/workforce/runs/${runId}/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionId: action.id }),
        }
      );

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setMessage(result.data.result?.message ?? "Applied.");
      router.refresh();
    });
  }

  if (action.applied) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-accent-cyan">
        <Check className="h-3.5 w-3.5" />
        Applied
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={apply}
        className="w-full sm:w-auto"
      >
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isInfoOnly ? "Acknowledge" : "Apply"}
      </Button>
      {message && <p className="text-xs text-accent-cyan">{message}</p>}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
