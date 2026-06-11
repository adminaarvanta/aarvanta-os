"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <Button
        type="button"
        onClick={run}
        disabled={pending}
        className="w-full gap-2 bg-[#D4AF37] text-black hover:bg-[#F9E076] sm:w-auto"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {pending ? "Running…" : label}
      </Button>
      {error && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
