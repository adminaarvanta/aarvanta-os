"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SentimentBadge } from "@/components/inbox/sentiment-badge";
import { apiFetch } from "@/lib/api/client-fetch";
import { formatRelative } from "@/lib/utils";
import type { AiRuntimeStatus } from "@/lib/ai/config";
import type { Conversation } from "@/types/communication";

function emptySummaryMessage(ai: AiRuntimeStatus): string {
  if (ai.status === "live") {
    return ai.autoSummarize
      ? "No summary yet. Summaries generate automatically when new messages arrive — or refresh below."
      : "No summary yet. Click refresh below to generate a summary and sentiment with OpenAI.";
  }
  if (ai.status === "heuristic") {
    return "No summary yet. Demo mode uses keyword heuristics — set OPENAI_API_KEY for full AI summaries.";
  }
  return "No summary yet. Add OPENAI_API_KEY in production to enable AI summaries.";
}

export function AiInsightsPanel({
  conversation,
  aiStatus,
}: {
  conversation: Conversation;
  aiStatus: AiRuntimeStatus;
}) {
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

  const aiLive = aiStatus.status === "live";
  const qualificationThreshold = 50;
  const qualification =
    conversation.aiIntent !== undefined &&
    conversation.aiQualificationScore !== undefined
      ? {
          intent: conversation.aiIntent,
          qualificationScore: conversation.aiQualificationScore,
        }
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#FFFFFF]">
          <Sparkles className="h-4 w-4 text-[#B8965D]" />
          AI insights
        </h3>
        <SentimentBadge sentiment={conversation.sentiment} />
      </div>

      {aiLive && (
        <p className="text-[10px] text-[#9AABC4]">
          OpenAI · {aiStatus.model}
          {aiStatus.autoSummarize ? " · auto-updates on new messages" : ""}
        </p>
      )}

      <div className="rounded-xl border border-[#243656] bg-[#121E32] p-3 text-sm text-[#FFFFFF] leading-relaxed">
        {conversation.aiSummary ?? (
          <span className="text-[#9AABC4]">{emptySummaryMessage(aiStatus)}</span>
        )}
      </div>

      {conversation.aiSummaryUpdatedAt && (
        <p className="text-[10px] text-[#9AABC4]">
          Updated {formatRelative(conversation.aiSummaryUpdatedAt)}
        </p>
      )}

      {qualification ? (
        <div className="rounded-lg border border-[#243656] bg-[#0D1524] px-3 py-2 text-xs text-[#9AABC4]">
          <p>
            Intent:{" "}
            <span className="capitalize text-[#FFFFFF]">{qualification.intent}</span>
            {" · "}
            Score:{" "}
            <span className="text-[#FFFFFF]">
              {qualification.qualificationScore}/{qualificationThreshold}
            </span>
          </p>
          <p className="mt-1">
            CRM lead:{" "}
            {qualification.intent === "sales" &&
            qualification.qualificationScore >= qualificationThreshold ? (
              <span className="text-emerald-400">qualified</span>
            ) : (
              <span className="text-[#9AABC4]">inbox only</span>
            )}
          </p>
        </div>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full"
        disabled={pending || aiStatus.status === "disabled"}
        onClick={refreshInsights}
      >
        {pending
          ? "Analyzing…"
          : aiLive
            ? "Refresh summary & qualification"
            : "Refresh (AI unavailable)"}
      </Button>
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
      {aiStatus.status === "heuristic" && (
        <p className="text-[10px] text-[#9AABC4] leading-relaxed">
          Using keyword heuristics in demo mode. Production without an API key returns an error on
          refresh.
        </p>
      )}
      {aiStatus.status === "disabled" && (
        <p className="text-[10px] text-amber-400/90 leading-relaxed">
          AI is disabled. Set <code className="text-[#B8965D]">OPENAI_API_KEY</code> on the server
          and redeploy.
        </p>
      )}
    </div>
  );
}
