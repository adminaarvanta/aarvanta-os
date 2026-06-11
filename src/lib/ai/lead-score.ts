import { getOpenAI, isOpenAIConfigured } from "@/lib/ai/client";
import type { CrmActivity, CrmContact, CrmDeal } from "@/types/crm";
import { contactDisplayName } from "@/types/crm";

function heuristicLeadScore(
  contact: CrmContact,
  deals: CrmDeal[],
  activities: CrmActivity[]
): { score: number; reason: string } {
  let score = 20;
  const signals: string[] = [];

  if (contact.tags.includes("hot_lead")) {
    score += 25;
    signals.push("tagged hot lead");
  }
  if (contact.tags.includes("vip")) {
    score += 15;
    signals.push("VIP contact");
  }
  if (contact.tags.includes("customer")) {
    score += 20;
    signals.push("existing customer");
  }
  if (contact.purchaseTotal > 0) {
    score += Math.min(20, Math.floor(contact.purchaseTotal / 1000));
    signals.push(`£${contact.purchaseTotal.toLocaleString()} purchase history`);
  }
  if (contact.conversationIds.length > 0) {
    score += 10;
    signals.push("active communication history");
  }

  const openDeals = deals.filter((d) => d.status === "open");
  if (openDeals.length > 0) {
    score += 15;
    const total = openDeals.reduce((s, d) => s + d.value, 0);
    signals.push(`£${total.toLocaleString()} in open pipeline`);
  }

  if (activities.length >= 3) {
    score += 10;
    signals.push("high engagement (3+ activities)");
  }

  score = Math.min(100, Math.max(0, score));
  const reason =
    signals.length > 0
      ? signals.join("; ") + "."
      : "Limited engagement data — nurture recommended.";

  return { score, reason };
}

export async function generateLeadScore(input: {
  contact: CrmContact;
  deals: CrmDeal[];
  activities: CrmActivity[];
}): Promise<{ score: number; reason: string }> {
  const { contact, deals, activities } = input;

  if (!isOpenAIConfigured()) {
    return heuristicLeadScore(contact, deals, activities);
  }

  const openai = getOpenAI()!;
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You score B2B sales leads for Aarvanta OS CRM (0-100).
Return JSON: { "score": number, "reason": string (1-2 sentences explaining the score) }`,
      },
      {
        role: "user",
        content: JSON.stringify({
          contact: {
            name: contactDisplayName(contact),
            tags: contact.tags,
            purchaseTotal: contact.purchaseTotal,
            jobTitle: contact.jobTitle,
            hasConversations: contact.conversationIds.length > 0,
          },
          openDeals: deals
            .filter((d) => d.status === "open")
            .map((d) => ({ title: d.title, value: d.value, stage: d.stageId })),
          recentActivities: activities.slice(0, 5).map((a) => ({
            type: a.type,
            title: a.title,
          })),
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return heuristicLeadScore(contact, deals, activities);

  try {
    const parsed = JSON.parse(raw) as { score?: number; reason?: string };
    const score = Math.min(100, Math.max(0, Math.round(parsed.score ?? 50)));
    return {
      score,
      reason: parsed.reason ?? heuristicLeadScore(contact, deals, activities).reason,
    };
  } catch {
    return heuristicLeadScore(contact, deals, activities);
  }
}
