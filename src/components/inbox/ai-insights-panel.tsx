"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SentimentBadge } from "@/components/inbox/sentiment-badge";
import { apiFetch } from "@/lib/api/client-fetch";
import { formatRelative } from "@/lib/utils";
import type { Conversation } from "@/types/communication";

export function AiInsightsPanel({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refreshInsights() {
    startTransition(async () => {
      setError(null);
      const result = await apiFetch<{ source?: string }>(
        `/api/conversations/${conversation.id}/summarize`,
        { method: "POST" }
      );

      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#F5E6C8]">
          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
          AI insights
        </h3>
        <SentimentBadge sentiment={conversation.sentiment} />
      </div>

      <div className="rounded-xl border border-[#3d3528] bg-[#141414] p-3 text-sm text-[#F5E6C8] leading-relaxed">
        {conversation.aiSummary ?? (
          <span className="text-[#A89878]">
            No summary yet. Send a message or wait for an inbound event — summaries
            generate automatically when OpenAI is configured.
          </span>
        )}
      </div>

      {conversation.aiSummaryUpdatedAt && (
        <p className="text-[10px] text-[#A89878]">
          Updated {formatRelative(conversation.aiSummaryUpdatedAt)}
        </p>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        disabled={pending}
        onClick={refreshInsights}
      >
        {pending ? "Analyzing with OpenAI…" : "Refresh summary & sentiment"}
      </Button>
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      <p className="text-[10px] text-[#A89878] leading-relaxed">
        Requires <code className="text-[#D4AF37]">OPENAI_API_KEY</code>. Check{" "}
        <code className="text-[#D4AF37]">/api/health</code> →{" "}
        <code className="text-[#D4AF37]">ai.status</code>.
      </p>
    </div>
  );
}
