"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { WfPrimaryButton } from "@/components/workforce/workforce-shell";
import { apiFetch } from "@/lib/api/client-fetch";
import type { AgentType } from "@/types/workforce";

export function RunAgentButton({
  agentType,
  contactId,
  conversationId,
  label = "Run agent",
  className,
}: {
  agentType: AgentType;
  contactId?: string;
  conversationId?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      setError(null);
      const result = await apiFetch<{ run?: { id: string } }>(
        "/api/workforce/runs",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentType, contactId, conversationId }),
        }
      );

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (result.data.run?.id) {
        router.push(`/workforce/runs/${result.data.run.id}`);
        router.refresh();
      }
    });
  }

  return (
    <div className={className}>
      <WfPrimaryButton
        type="button"
        onClick={run}
        disabled={pending}
        className="gap-2 sm:w-auto"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {pending ? "Running…" : label}
      </WfPrimaryButton>
      {error && (
        <p
          className="mt-2 text-xs font-medium"
          style={{ color: "var(--wf-danger)" }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
