import { getAiConfig, isAiConfigured } from "@/lib/ai/config";
import {
  heuristicQualification,
  type QualificationResult,
} from "@/lib/ai/qualification";
import {
  AiNotConfiguredError,
  AiRequestError,
  completeJson,
} from "@/lib/ai/provider";
import type {
  Conversation,
  ConversationIntent,
  Sentiment,
  TimelineEvent,
} from "@/types/communication";

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
): {
  summary: string;
  sentiment: Sentiment;
  intent: ConversationIntent;
  qualificationScore: number;
} {
  const sentiment = heuristicSentiment(transcript);
  const { intent, qualificationScore } = heuristicQualification(
    transcript,
    sentiment
  );

  return {
    summary: heuristicSummary(conversation),
    sentiment,
    intent,
    qualificationScore,
  };
}

const INSIGHTS_SYSTEM_PROMPT = `You analyze business communication timelines for Aarvanta OS Communication Hub.
Summarize what the customer wants, what was promised, blockers, and recommended next action.
Classify whether this thread is a sales lead, support request, spam, or other.
Score sales intent from 0-100 (0 = not a lead, 100 = ready to buy).

Return JSON only:
{
  "summary": "2-3 concise sentences for a sales or support agent",
  "sentiment": "positive" | "neutral" | "frustrated" | "urgent",
  "intent": "sales" | "support" | "spam" | "other",
  "qualificationScore": number
}
Use "urgent" when time-sensitive or escalation is implied. Use "frustrated" for complaints or repeated issues.
Use intent "spam" for marketing junk, scams, or irrelevant bulk mail. Use "sales" for pricing, demos, partnerships, or buying interest.`;

export type ConversationInsights = {
  summary: string;
  sentiment: Sentiment;
  intent: ConversationIntent;
  qualificationScore: number;
  source: "openai" | "heuristic";
};

type InsightsResponse = {
  summary?: string;
  sentiment?: string;
  intent?: string;
  qualificationScore?: number;
};

const VALID_SENTIMENTS: Sentiment[] = [
  "positive",
  "neutral",
  "frustrated",
  "urgent",
];
const VALID_INTENTS: ConversationIntent[] = [
  "sales",
  "support",
  "spam",
  "other",
];

function resolveQualification(
  parsed: InsightsResponse,
  transcript: string,
  sentiment: Sentiment
): QualificationResult {
  const intent = VALID_INTENTS.includes(parsed.intent as ConversationIntent)
    ? (parsed.intent as ConversationIntent)
    : heuristicQualification(transcript, sentiment).intent;

  const rawScore = parsed.qualificationScore;
  const qualificationScore =
    typeof rawScore === "number" && Number.isFinite(rawScore)
      ? Math.min(100, Math.max(0, Math.round(rawScore)))
      : heuristicQualification(transcript, sentiment).qualificationScore;

  return { intent, qualificationScore };
}

export async function generateConversationInsights(
  conversation: Conversation
): Promise<ConversationInsights> {
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

    const sentiment = VALID_SENTIMENTS.includes(parsed.sentiment as Sentiment)
      ? (parsed.sentiment as Sentiment)
      : heuristicSentiment(transcript);
    const { intent, qualificationScore } = resolveQualification(
      parsed,
      transcript,
      sentiment
    );

    return {
      summary: parsed.summary?.trim() || heuristicSummary(conversation),
      sentiment,
      intent,
      qualificationScore,
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
