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
  "update_deal",
  "suggest_reply",
  "alert",
  "generate_hr_document",
];

export type AgentRunMode = "analyze" | "execute_task";

function agentSystemPrompt(type: AgentType, mode: AgentRunMode): string {
  const agent = getAgentDefinition(type);
  const base = `You are ${agent.name} (${agent.title}) in Aarvanta OS — a multi-tenant business operating system.
Primary function: ${agent.primaryFunction}.
Respond ONLY with valid JSON:
{
  "summary": "2-4 sentence executive summary",
  "recommendations": ["actionable bullet 1", "actionable bullet 2", ...],
  "actions": [
    {
      "type": "create_task" | "create_activity" | "update_deal" | "suggest_reply" | "alert" | "generate_hr_document",
      "label": "short human label for the action button",
      "payload": { ... type-specific fields ... }
    }
  ]
}

Action payload schemas:
- create_task: { "title": string, "description"?: string, "priority"?: "low"|"medium"|"high", "dueDate"?: "YYYY-MM-DD", "contactId"?: string, "dealId"?: string }
- create_activity: { "type": "call"|"meeting"|"note", "title": string, "description"?: string, "contactId"?: string, "dealId"?: string }
- update_deal: { "dealId": string, "stageName"?: string, "stageId"?: string, "status"?: "open"|"won"|"lost", "notes"?: string, "value"?: number, "title"?: string }
- suggest_reply: { "channel": "email"|"sms"|"whatsapp"|"website_chat", "content": string, "subject"?: string }
- alert: { "severity": "info"|"warning"|"critical", "message": string }
- generate_hr_document: { "documentType": string, "subjectName": string, "contextFields"?: object, "conversationId"?: string, "instructions"?: string }

Use contactId/dealId/conversationId from context when provided.`;

  if (mode === "execute_task") {
    return `${base}

MODE: TASK EXECUTION
You have been assigned a concrete CRM task (see context.assignedTask). Your job is to COMPLETE that work now.
- Prefer create_activity (note) documenting what you did.
- If context.deal exists, use update_deal to advance the pipeline (next stage) or update notes when appropriate.
- Only create_task for genuine NEW follow-ups a human must do later — do not recreate the same assigned task.
- Do not refuse the assignment; produce concrete completion work.
- Summary should state what was completed.`;
  }

  const roles: Record<AgentType, string> = {
    ceo: `${base}\n\nRole: AI CEO. Deliver a daily business briefing covering revenue, pipeline, risks, and strategic priorities. Use alert for critical business risks.`,
    coo: `${base}\n\nRole: AI COO. Review operations, task backlog, bottlenecks, and process efficiency. Prefer create_task for operational follow-ups.`,
    sales_manager: `${base}\n\nRole: AI Sales Manager. Review pipeline, qualify leads, suggest follow-ups, and recommend deal actions. Use update_deal when stage changes are warranted.`,
    marketing_manager: `${base}\n\nRole: AI Marketing Manager. Suggest campaigns, content themes, channel priorities, and audience targeting from CRM data.`,
    hr_manager: `${base}\n\nRole: AI HR Manager. Support recruitment, onboarding, JD drafting, and hiring pipeline review. Use generate_hr_document when a formal HR letter is needed (offer, experience, relieving, etc.).`,
    cfo: `${base}\n\nRole: AI CFO. Review revenue forecast, expenses, invoices, budgets, and cashflow risks. Recommend margin and collections actions.`,
    customer_success_manager: `${base}\n\nRole: AI Customer Success Manager. Review customer health, renewals, support tickets, and churn risk. Suggest nurture and expansion plays.`,
  };

  return roles[type];
}

function heuristicRun(
  type: AgentType,
  context: WorkforceContext,
  mode: AgentRunMode
): AiAgentResponse {
  if (mode === "execute_task" && context.assignedTask) {
    const task = context.assignedTask;
    const actions: AiAgentResponse["actions"] = [
      {
        type: "create_activity",
        label: "Log completion note",
        payload: {
          type: "note",
          title: `Completed: ${task.title}`,
          description:
            context.assignedTask.description ??
            `${getAgentDefinition(type).name} completed this CRM task.`,
          contactId: task.contactId,
          dealId: task.dealId,
        },
      },
    ];

    if (context.deal && context.deal.status === "open" && context.deal.stages.length > 0) {
      const currentIdx = context.deal.stages.findIndex(
        (s) => s.id === context.deal!.stageId
      );
      const next = context.deal.stages[currentIdx + 1];
      if (next && type === "sales_manager") {
        actions.push({
          type: "update_deal",
          label: `Move deal to ${next.name}`,
          payload: {
            dealId: context.deal.id,
            stageId: next.id,
            stageName: next.name,
            notes: `Advanced by ${getAgentDefinition(type).name} while completing: ${task.title}`,
          },
        });
      } else {
        actions.push({
          type: "update_deal",
          label: "Update deal notes",
          payload: {
            dealId: context.deal.id,
            notes: `Agent progress on "${task.title}": ${
              task.description ?? "Task completed."
            }`,
          },
        });
      }
    }

    return {
      summary: `${getAgentDefinition(type).name} completed CRM task "${task.title}".`,
      recommendations: [
        "Review the logged activity on the related contact or deal.",
        ...(context.deal
          ? ["Confirm the pipeline stage still reflects the latest customer conversation."]
          : []),
      ],
      actions,
    };
  }

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
    if (context.hr?.openCases?.length) {
      recs.push(`${context.hr.openCases.length} open HR inbox cases need review.`);
    }
  }

  if (type === "cfo") {
    recs.push("Review open invoices, budget burn, and weighted pipeline for cashflow forecast.");
  }

  if (type === "customer_success_manager") {
    recs.push("Check customer health scores and accounts due for renewal within 90 days.");
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
  mode?: AgentRunMode;
}): Promise<{
  summary: string;
  recommendations: string[];
  actions: AgentAction[];
}> {
  const { agentType, context, mode = "analyze" } = input;
  const agent = getAgentDefinition(agentType);

  let result: AiAgentResponse;

  if (isAiConfigured()) {
    result = await completeJson<AiAgentResponse>({
      system: agentSystemPrompt(agentType, mode),
      user: JSON.stringify({
        agent: agent.name,
        primaryFunction: agent.primaryFunction,
        mode,
        context,
      }),
    });
  } else {
    result = heuristicRun(agentType, context, mode);
  }

  return {
    summary:
      result.summary?.trim() ||
      (mode === "execute_task"
        ? `${agent.name} completed the assigned CRM task.`
        : `${agent.name} completed analysis.`),
    recommendations: (result.recommendations ?? []).filter(Boolean).slice(0, 6),
    actions: normalizeActions(result.actions),
  };
}
