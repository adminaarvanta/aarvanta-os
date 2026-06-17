import { completeJson } from "@/lib/ai/provider";
import { isAiConfigured } from "@/lib/ai/config";
import { getAgentDefinition } from "@/lib/workforce/agents";
import type { WorkforceContext } from "@/lib/workforce/context";
import type {
  AgentAction,
  AgentActionType,
  AgentType,
} from "@/types/workforce";
import { crmNewId } from "@/lib/data/crm-helpers";

type AiAgentResponse = {
  summary?: string;
  recommendations?: string[];
  actions?: Array<{
    type?: string;
    label?: string;
    payload?: Record<string, unknown>;
  }>;
};

const ACTION_TYPES: AgentActionType[] = [
  "create_task",
  "create_activity",
  "suggest_reply",
  "alert",
];

function agentSystemPrompt(type: AgentType): string {
  const agent = getAgentDefinition(type);
  const base = `You are ${agent.name} (${agent.title}) in Aarvanta OS — a multi-tenant business operating system.
Primary function: ${agent.primaryFunction}.
Respond ONLY with valid JSON:
{
  "summary": "2-4 sentence executive summary of your analysis",
  "recommendations": ["actionable bullet 1", "actionable bullet 2", ...],
  "actions": [
    {
      "type": "create_task" | "create_activity" | "suggest_reply" | "alert",
      "label": "short human label for the action button",
      "payload": { ... type-specific fields ... }
    }
  ]
}

Action payload schemas:
- create_task: { "title": string, "description"?: string, "priority"?: "low"|"medium"|"high", "dueDate"?: "YYYY-MM-DD", "contactId"?: string }
- create_activity: { "type": "call"|"meeting"|"note", "title": string, "description"?: string, "contactId"?: string }
- suggest_reply: { "channel": "email"|"sms"|"whatsapp"|"website_chat", "content": string, "subject"?: string }
- alert: { "severity": "info"|"warning"|"critical", "message": string }

Include 1-3 concrete actions when appropriate. Use contactId/conversationId from context when provided.`;

  const roles: Record<AgentType, string> = {
    ceo: `${base}\n\nRole: AI CEO. Deliver a daily business briefing covering revenue, pipeline, risks, and strategic priorities. Use alert for critical business risks.`,
    coo: `${base}\n\nRole: AI COO. Review operations, task backlog, bottlenecks, and process efficiency. Prefer create_task for operational follow-ups.`,
    sales_manager: `${base}\n\nRole: AI Sales Manager. Review pipeline, qualify leads, suggest follow-ups, and recommend deal actions.`,
    marketing_manager: `${base}\n\nRole: AI Marketing Manager. Suggest campaigns, content themes, channel priorities, and audience targeting from CRM data.`,
    hr_manager: `${base}\n\nRole: AI HR Manager. Support recruitment, onboarding, JD drafting, and hiring pipeline review.`,
  };

  return roles[type];
}

function heuristicRun(
  type: AgentType,
  context: WorkforceContext
): AiAgentResponse {
  const recs: string[] = [];
  const actions: AiAgentResponse["actions"] = [];

  if (context.contact) {
    recs.push(`Review ${context.contact.name}'s profile and recent activity.`);
    if ((context.contact.leadScore ?? 0) >= 70) {
      recs.push("High lead score — prioritise personal outreach within 24 hours.");
    }
    actions.push({
      type: "create_task",
      label: `Follow up with ${context.contact.name}`,
      payload: {
        title: `Follow up: ${context.contact.name}`,
        priority: "high",
        contactId: context.contact.id,
      },
    });
  }

  if (context.conversation) {
    recs.push(
      `Conversation with ${context.conversation.contactName} is ${context.conversation.sentiment}.`
    );
    if (
      context.conversation.sentiment === "urgent" ||
      context.conversation.sentiment === "frustrated"
    ) {
      actions.push({
        type: "alert",
        label: "Urgent conversation flagged",
        payload: {
          severity: "warning",
          message: `${context.conversation.contactName} needs immediate attention.`,
        },
      });
    }
  }

  if (type === "ceo") {
    recs.push(
      `Pipeline: £${context.business.pipelineValue.toLocaleString()} across ${context.business.openDealCount} open deals.`
    );
    recs.push(
      `${context.business.hotLeadCount} hot leads and ${context.business.urgentConversationCount} urgent threads.`
    );
  }

  if (type === "coo" && context.business.openTaskCount > 0) {
    recs.push(`${context.business.openTaskCount} open tasks — review priorities and bottlenecks.`);
  }

  if (type === "sales_manager" && context.business.openDealCount > 0) {
    recs.push(`Review ${context.business.openDealCount} open deals in the pipeline.`);
  }

  if (type === "marketing_manager") {
    recs.push("Consider a LinkedIn campaign targeting your top prospect segments.");
  }

  if (type === "hr_manager") {
    recs.push("Review open roles and candidate pipeline for upcoming interviews.");
  }

  if (recs.length === 0) {
    recs.push("Limited context available — run with a contact selected or review business-wide metrics.");
  }

  return {
    summary: `Heuristic ${getAgentDefinition(type).name} analysis (set OPENAI_API_KEY for full AI).`,
    recommendations: recs,
    actions: actions.slice(0, 2),
  };
}

function normalizeActions(raw: AiAgentResponse["actions"]): AgentAction[] {
  if (!raw?.length) return [];

  return raw
    .filter((a) => a.type && a.label && ACTION_TYPES.includes(a.type as AgentActionType))
    .map((a) => ({
      id: crmNewId("action"),
      type: a.type as AgentActionType,
      label: a.label!,
      payload: a.payload ?? {},
      applied: false,
    }));
}

export async function executeAgentRun(input: {
  agentType: AgentType;
  context: WorkforceContext;
}): Promise<{
  summary: string;
  recommendations: string[];
  actions: AgentAction[];
}> {
  const { agentType, context } = input;
  const agent = getAgentDefinition(agentType);

  let result: AiAgentResponse;

  if (isAiConfigured()) {
    result = await completeJson<AiAgentResponse>({
      system: agentSystemPrompt(agentType),
      user: JSON.stringify({
        agent: agent.name,
        primaryFunction: agent.primaryFunction,
        context,
      }),
    });
  } else {
    result = heuristicRun(agentType, context);
  }

  return {
    summary: result.summary?.trim() || `${agent.name} completed analysis.`,
    recommendations: (result.recommendations ?? []).filter(Boolean).slice(0, 6),
    actions: normalizeActions(result.actions),
  };
}
