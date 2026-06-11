import { getAiConfig, isAiConfigured } from "@/lib/ai/config";
import {
  AiNotConfiguredError,
  AiRequestError,
  completeJson,
} from "@/lib/ai/provider";
import type { Conversation, Sentiment, TimelineEvent } from "@/types/communication";

const MAX_TRANSCRIPT_CHARS = 14_000;

function timelineToText(timeline: TimelineEvent[]): string {
  return timeline
    .map((e) => {
      switch (e.type) {
        case "message":
          return `[${e.channel} ${e.direction}] ${e.content}`;
        case "call":
          return `[call ${e.direction} ${e.durationSeconds}s] ${e.summary ?? ""}`;
        case "email":
          return `[email ${e.direction}] ${e.subject}: ${e.bodyPreview}`;
        case "note":
          return `[${e.isInternal ? "internal note" : "note"}] ${e.content}`;
        case "meeting":
          return `[meeting ${e.status}] ${e.title}`;
        default:
          return "";
      }
    })
    .join("\n");
}

function truncateTranscript(timeline: TimelineEvent[]): string {
  const full = timelineToText(timeline);
  if (full.length <= MAX_TRANSCRIPT_CHARS) return full;

  const lines = full.split("\n");
  const tail: string[] = [];
  let size = 0;

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (size + line.length + 1 > MAX_TRANSCRIPT_CHARS) break;
    tail.unshift(line);
    size += line.length + 1;
  }

  return `[Earlier timeline truncated]\n${tail.join("\n")}`;
}

function heuristicSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  if (
    /\burgent|asap|immediately|today\b|escalat/i.test(lower) ||
    /\bthird time|still broken|unacceptable/i.test(lower)
  ) {
    return "urgent";
  }
  if (/\bfrustrat|angry|disappoint|failed|broken|unhappy/i.test(lower)) {
    return "frustrated";
  }
  if (/\bthanks|great|excited|looking forward|perfect\b/i.test(lower)) {
    return "positive";
  }
  return "neutral";
}

function heuristicSummary(conversation: Conversation): string {
  const messages = conversation.timeline.filter((e) => e.type === "message");
  const lastInbound = [...messages]
    .reverse()
    .find((m) => m.type === "message" && m.direction === "inbound");
  const contact = conversation.contact.name;
  if (lastInbound && lastInbound.type === "message") {
    const preview = lastInbound.content.slice(0, 120);
    return `${contact}'s latest message: "${preview}${lastInbound.content.length > 120 ? "…" : ""}". ${conversation.timeline.length} timeline events across ${conversation.channels.join(", ")}.`;
  }
  return `Conversation with ${contact} across ${conversation.channels.join(", ")}. ${conversation.timeline.length} events on the timeline.`;
}

function fallbackInsights(
  conversation: Conversation,
  transcript: string
): { summary: string; sentiment: Sentiment } {
  return {
    summary: heuristicSummary(conversation),
    sentiment: heuristicSentiment(transcript),
  };
}

const INSIGHTS_SYSTEM_PROMPT = `You analyze business communication timelines for Aarvanta OS Communication Hub.
Summarize what the customer wants, what was promised, blockers, and recommended next action.
Return JSON only:
{
  "summary": "2-3 concise sentences for a sales or support agent",
  "sentiment": "positive" | "neutral" | "frustrated" | "urgent"
}
Use "urgent" when time-sensitive or escalation is implied. Use "frustrated" for complaints or repeated issues.`;

type InsightsResponse = { summary?: string; sentiment?: string };

export async function generateConversationInsights(
  conversation: Conversation
): Promise<{ summary: string; sentiment: Sentiment; source: "openai" | "heuristic" }> {
  const transcript = truncateTranscript(conversation.timeline);
  const { allowHeuristicFallback } = getAiConfig();

  if (!isAiConfigured()) {
    if (!allowHeuristicFallback) {
      throw new AiNotConfiguredError();
    }
    const fallback = fallbackInsights(conversation, transcript);
    return { ...fallback, source: "heuristic" };
  }

  try {
    const parsed = await completeJson<InsightsResponse>({
      system: INSIGHTS_SYSTEM_PROMPT,
      user: `Contact: ${conversation.contact.name}
Channels: ${conversation.channels.join(", ")}
Tags: ${conversation.tags.join(", ") || "none"}
Current sentiment: ${conversation.sentiment}

Timeline:
${transcript}`,
    });

    const valid: Sentiment[] = ["positive", "neutral", "frustrated", "urgent"];
    const sentiment = parsed.sentiment as Sentiment;
    const resolvedSentiment = valid.includes(sentiment)
      ? sentiment
      : heuristicSentiment(transcript);

    return {
      summary: parsed.summary?.trim() || heuristicSummary(conversation),
      sentiment: resolvedSentiment,
      source: "openai",
    };
  } catch (error) {
    if (!allowHeuristicFallback) {
      if (error instanceof AiNotConfiguredError || error instanceof AiRequestError) {
        throw error;
      }
      throw new AiRequestError(
        error instanceof Error ? error.message : "Failed to generate insights"
      );
    }

    console.warn(
      "[ai:insights] OpenAI failed, using heuristic fallback:",
      error instanceof Error ? error.message : error
    );
    const fallback = fallbackInsights(conversation, transcript);
    return { ...fallback, source: "heuristic" };
  }
}
