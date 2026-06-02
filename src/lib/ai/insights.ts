import { getOpenAI, isOpenAIConfigured } from "@/lib/ai/client";
import type { Conversation, Sentiment, TimelineEvent } from "@/types/communication";

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

function heuristicSentiment(text: string): Sentiment {
  const lower = text.toLowerCase();
  if (
    /\burgent|asap|immediately|today\b|escalat/i.test(lower) ||
    /\bthird time|still broken|unacceptable/i.test(lower)
  ) {
    return "urgent";
  }
  if (
    /\bfrustrat|angry|disappoint|failed|broken|unhappy/i.test(lower)
  ) {
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

export async function generateConversationInsights(
  conversation: Conversation
): Promise<{ summary: string; sentiment: Sentiment }> {
  const transcript = timelineToText(conversation.timeline);

  if (!isOpenAIConfigured()) {
    return {
      summary: heuristicSummary(conversation),
      sentiment: heuristicSentiment(transcript),
    };
  }

  const openai = getOpenAI()!;
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You analyze business communication timelines for Aarvanta OS Communication Hub.
Return JSON: { "summary": string (2-3 sentences), "sentiment": "positive"|"neutral"|"frustrated"|"urgent" }`,
      },
      {
        role: "user",
        content: `Contact: ${conversation.contact.name}\nTags: ${conversation.tags.join(", ") || "none"}\n\nTimeline:\n${transcript}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return {
      summary: heuristicSummary(conversation),
      sentiment: heuristicSentiment(transcript),
    };
  }

  try {
    const parsed = JSON.parse(raw) as { summary?: string; sentiment?: Sentiment };
    const sentiment = parsed.sentiment ?? heuristicSentiment(transcript);
    const valid: Sentiment[] = ["positive", "neutral", "frustrated", "urgent"];
    return {
      summary: parsed.summary ?? heuristicSummary(conversation),
      sentiment: valid.includes(sentiment) ? sentiment : "neutral",
    };
  } catch {
    return {
      summary: heuristicSummary(conversation),
      sentiment: heuristicSentiment(transcript),
    };
  }
}
