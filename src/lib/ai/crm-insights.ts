import { completeJson } from "@/lib/ai/provider";
import { isAiConfigured } from "@/lib/ai/config";
import type { CrmActivity, CrmContact, CrmDeal } from "@/types/crm";
import { contactDisplayName } from "@/types/crm";

export type CrmContactInsights = {
  summary: string;
  suggestedActions: string[];
};

function heuristicInsights(
  contact: CrmContact,
  deals: CrmDeal[],
  activities: CrmActivity[]
): CrmContactInsights {
  const name = contactDisplayName(contact);
  const openDeals = deals.filter((d) => d.status === "open");
  const actions: string[] = [];

  if ((contact.leadScore ?? 0) >= 70) {
    actions.push(`Schedule a discovery call with ${name} within 48 hours.`);
  } else {
    actions.push(`Send a personalised follow-up email to ${name}.`);
  }

  if (openDeals.length > 0) {
    actions.push(`Review open deal "${openDeals[0]!.title}" and confirm next steps.`);
  }

  if (activities.length === 0) {
    actions.push("Log an initial outreach activity to track engagement.");
  }

  if (contact.tags.includes("follow_up")) {
    actions.push("Prioritise this contact — tagged for follow-up.");
  }

  const summary = `${name} has a lead score of ${contact.leadScore ?? "unscored"}. ${
    openDeals.length
      ? `${openDeals.length} open deal(s) worth £${openDeals.reduce((s, d) => s + d.value, 0).toLocaleString()}.`
      : "No open deals yet."
  } ${activities.length} logged activities.`;

  return { summary, suggestedActions: actions.slice(0, 4) };
}

export async function generateContactInsights(input: {
  contact: CrmContact;
  deals: CrmDeal[];
  activities: CrmActivity[];
}): Promise<CrmContactInsights> {
  if (!isAiConfigured()) {
    return heuristicInsights(input.contact, input.deals, input.activities);
  }

  const result = await completeJson<{
    summary?: string;
    suggestedActions?: string[];
  }>({
    system: `You are an AI CRM assistant for Aarvanta OS.
Return JSON: { "summary": "2-3 sentence lead summary", "suggestedActions": ["action 1", "action 2", ...] }
Provide 2-4 specific, actionable sales recommendations.`,
    user: JSON.stringify({
      contact: {
        name: contactDisplayName(input.contact),
        tags: input.contact.tags,
        leadScore: input.contact.leadScore,
        leadScoreReason: input.contact.leadScoreReason,
        purchaseTotal: input.contact.purchaseTotal,
        jobTitle: input.contact.jobTitle,
      },
      openDeals: input.deals
        .filter((d) => d.status === "open")
        .map((d) => ({ title: d.title, value: d.value, probability: d.probability })),
      recentActivities: input.activities.slice(0, 6).map((a) => ({
        type: a.type,
        title: a.title,
      })),
    }),
  });

  const fallback = heuristicInsights(
    input.contact,
    input.deals,
    input.activities
  );

  return {
    summary: result.summary?.trim() || fallback.summary,
    suggestedActions: (result.suggestedActions ?? fallback.suggestedActions).slice(
      0,
      5
    ),
  };
}
