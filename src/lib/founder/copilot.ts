import { completeJson, completeText } from "@/lib/ai/provider";
import { isAiConfigured } from "@/lib/ai/config";
import type { FounderCopilotContext } from "@/lib/founder/build-snapshot";
import type { FounderCopilotResult } from "@/types/founder";

function heuristicCopilot(
  question: string,
  context: FounderCopilotContext
): FounderCopilotResult {
  const { snapshot } = context;
  const q = question.toLowerCase();

  if (q.includes("pipeline") || q.includes("revenue") || q.includes("deal")) {
    return {
      answer: `[Demo mode] Pipeline: £${snapshot.revenue.pipelineValue.toLocaleString()} across ${snapshot.revenue.openDeals} open deals. Weighted forecast: £${snapshot.revenue.weightedForecast.toLocaleString()}. Top opportunity: ${snapshot.sales.topOpportunities[0]?.title ?? "none yet"}.`,
      method: "heuristic",
      suggestedActions: ["Review hot leads in CRM", "Run AI Sales Manager"],
    };
  }

  if (q.includes("lead") || q.includes("opportunit")) {
    return {
      answer: `[Demo mode] ${snapshot.sales.hotLeads} hot leads from ${snapshot.sales.totalContacts} contacts. ${snapshot.sales.topOpportunities.map((o) => `${o.title} (£${o.value.toLocaleString()})`).join("; ") || "No open deals."}`,
      method: "heuristic",
      suggestedActions: ["Open Leads page", "Score contacts with AI"],
    };
  }

  if (q.includes("project") || q.includes("task") || q.includes("delay")) {
    return {
      answer: `[Demo mode] ${snapshot.projects.active} active projects, ${snapshot.projects.openTasks} open tasks, ${snapshot.projects.overdueTasks} overdue.`,
      method: "heuristic",
      suggestedActions: ["Open Projects board"],
    };
  }

  if (q.includes("focus") || q.includes("today") || q.includes("priorit")) {
    return {
      answer: `[Demo mode] Today's focus:\n${snapshot.focus.map((f) => `• ${f}`).join("\n")}`,
      method: "heuristic",
      suggestedActions: snapshot.focus.slice(0, 2),
    };
  }

  if (q.includes("inbox") || q.includes("urgent") || q.includes("customer")) {
    return {
      answer: `[Demo mode] ${snapshot.inbox.totalConversations} conversations, ${snapshot.inbox.urgentCount} urgent, ${snapshot.inbox.unreadEstimate} with unread messages.`,
      method: "heuristic",
      suggestedActions: ["Open Unified Inbox"],
    };
  }

  return {
    answer: `[Demo mode] Set OPENAI_API_KEY for full Founder Copilot. Quick stats: £${snapshot.revenue.pipelineValue.toLocaleString()} pipeline, ${snapshot.sales.hotLeads} hot leads, ${snapshot.projects.active} active projects.\n\nFocus: ${snapshot.focus[0]}`,
    method: "heuristic",
    suggestedActions: snapshot.focus.slice(0, 3),
  };
}

export async function askFounderCopilot(input: {
  question: string;
  context: FounderCopilotContext;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<FounderCopilotResult> {
  const { question, context, history } = input;

  if (!isAiConfigured()) {
    return heuristicCopilot(question, context);
  }

  const system = `You are the Founder Copilot for Aarvanta OS — the executive AI assistant for business owners.
You have access to a live snapshot of CRM, inbox, projects, knowledge, AI workforce, and workflows.
Answer concisely and actionably. Reference specific numbers from the data.
When helpful, suggest 2-3 concrete next steps.
Do not invent data not present in the context.`;

  const answer = await completeText({
    system,
    messages: [
      ...history.slice(-8),
      {
        role: "user",
        content: `Business context:\n${JSON.stringify(context, null, 2)}\n\nQuestion: ${question}`,
      },
    ],
    temperature: 0.3,
  });

  let suggestedActions: string[] | undefined;
  try {
    const parsed = await completeJson<{ actions?: string[] }>({
      system: 'Return JSON: { "actions": ["suggestion 1", "suggestion 2"] }',
      user: `Based on this answer, list 2-3 short action labels:\n${answer}`,
    });
    suggestedActions = parsed.actions?.slice(0, 3);
  } catch {
    suggestedActions = context.snapshot.focus.slice(0, 2);
  }

  return { answer, method: "rag", suggestedActions };
}

export async function generateDailyBriefing(
  context: FounderCopilotContext
): Promise<string> {
  if (!isAiConfigured()) {
    const s = context.snapshot;
    return `Daily Briefing (demo)\n\nPipeline: £${s.revenue.pipelineValue.toLocaleString()} · ${s.revenue.openDeals} deals\nHot leads: ${s.sales.hotLeads}\nUrgent inbox: ${s.inbox.urgentCount}\n\nFocus:\n${s.focus.map((f) => `• ${f}`).join("\n")}`;
  }

  return completeText({
    system:
      "You are AI CEO delivering a concise daily business briefing for a founder. Use bullet points. 150 words max.",
    messages: [
      {
        role: "user",
        content: JSON.stringify(context.snapshot),
      },
    ],
    temperature: 0.3,
  });
}
