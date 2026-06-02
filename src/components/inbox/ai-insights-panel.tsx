"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SentimentBadge } from "@/components/inbox/sentiment-badge";
import { formatRelative } from "@/lib/utils";
import type { Conversation } from "@/types/communication";

export function AiInsightsPanel({ conversation }: { conversation: Conversation }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refreshInsights() {
    startTransition(async () => {
      await fetch(`/api/conversations/${conversation.id}/summarize`, {
        method: "POST",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#2A2418]">
          <Sparkles className="h-4 w-4 text-[#C29B40]" />
          AI insights
        </h3>
        <SentimentBadge sentiment={conversation.sentiment} />
      </div>

      <div className="rounded-xl bg-[#FCF9F2] border border-[#EDE6D6] p-3 text-sm text-[#2A2418] leading-relaxed">
        {conversation.aiSummary ?? (
          <span className="text-[#6B6356]">
            No summary yet. Generate one from the conversation timeline.
          </span>
        )}
      </div>

      {conversation.aiSummaryUpdatedAt && (
        <p className="text-[10px] text-[#6B6356]">
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
        {pending ? "Analyzing…" : "Refresh summary & sentiment"}
      </Button>
    </div>
  );
}
