/**
 * Decide when live calls may search the Knowledge Hub.
 * Generic campaign goals and TwiML briefings must not pull random documents.
 */

const GENERIC_CALL_GOAL =
  /^(book meetings?|meetings?|discovery|outbound|sales|intro(duction)?( call)?|follow[- ]?up|call(s|ing)?)$/i;

export function looksLikeCallBriefing(text: string): boolean {
  const t = text.trim();
  if (t.length > 280) return true;
  return /^(you are |campaign goal:|follow the conversation|prior context:)/i.test(
    t
  );
}

export function isUsefulKnowledgeTopic(topic: string): boolean {
  const t = topic.trim();
  if (t.length < 12) return false;
  if (GENERIC_CALL_GOAL.test(t)) return false;
  if (looksLikeCallBriefing(t)) return false;
  return true;
}

export function resolveKnowledgeSearchTopic(input: {
  topic?: string;
  campaignGoal?: string;
}): string {
  const candidates = [input.topic, input.campaignGoal];
  for (const raw of candidates) {
    const value = raw?.trim() ?? "";
    if (isUsefulKnowledgeTopic(value)) return value;
  }
  return "";
}

export function resolveVoiceKnowledgeMode(knowledgeDigest: string): "bare" | "informed" {
  return knowledgeDigest.trim() ? "informed" : "bare";
}
