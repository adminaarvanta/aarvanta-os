import { crmNewId } from "@/lib/data/crm-helpers";
import { WORKFLOW_TEMPLATES } from "@/lib/data/workflow-demo-seed";
import type { CreateWorkflowInput } from "@/lib/data/workflow-repository";
import type { WorkflowStep } from "@/types/workflow";

const INTENT_KEYWORDS: Array<{
  keywords: string[];
  templateId: string;
}> = [
  {
    keywords: ["hot", "score", "qualify", "nurture", "chase"],
    templateId: "hot_lead_chase",
  },
  {
    keywords: ["whatsapp", "outreach", "message", "intro", "prospect"],
    templateId: "first_outreach_whatsapp",
  },
  {
    keywords: ["meeting", "call", "discovery", "book", "demo"],
    templateId: "book_discovery",
  },
  {
    keywords: ["stage", "pipeline", "follow-up", "follow up", "deal update"],
    templateId: "deal_followup",
  },
  {
    keywords: ["proposal", "handoff", "approval", "send proposal"],
    templateId: "proposal_handoff",
  },
  {
    keywords: ["email", "send email"],
    templateId: "book_discovery",
  },
];

function buildBdmCustomSteps(intent: string): WorkflowStep[] {
  const lower = intent.toLowerCase();
  const steps: WorkflowStep[] = [];

  if (lower.includes("score") || lower.includes("hot")) {
    steps.push({
      id: crmNewId("step"),
      type: "condition",
      label: "Only if score ≥ 70",
      config: { field: "leadScore", operator: "gte", value: 70 },
    });
  }

  steps.push({
    id: crmNewId("step"),
    type: "agent",
    label: "AI Sales Manager (BDM assist)",
    config: { agentType: "sales_manager", applyActions: true },
  });

  if (lower.includes("whatsapp")) {
    steps.push({
      id: crmNewId("step"),
      type: "action",
      label: "Send WhatsApp",
      config: {
        actionType: "send_whatsapp",
        messageTemplate: `Hi {{name}}, ${intent.slice(0, 120)}`,
      },
    });
  } else if (lower.includes("email")) {
    steps.push({
      id: crmNewId("step"),
      type: "action",
      label: "Send email",
      config: {
        actionType: "send_email",
        emailSubject: "Following up",
        messageTemplate: `Hi {{name}},\n\n${intent.slice(0, 200)}\n\n— Aarvanta`,
      },
    });
  } else if (lower.includes("meeting") || lower.includes("call")) {
    steps.push({
      id: crmNewId("step"),
      type: "action",
      label: "Book meeting",
      config: {
        actionType: "book_meeting",
        meetingTitle: "Discovery call",
        meetingNotes: intent.slice(0, 160),
      },
    });
  } else {
    steps.push({
      id: crmNewId("step"),
      type: "action",
      label: "Draft outreach",
      config: {
        actionType: "draft_outreach",
        messageTemplate: `Hi {{name}}, ${intent.slice(0, 140)}`,
      },
    });
  }

  if (lower.includes("approval") || lower.includes("approve")) {
    steps.push({
      id: crmNewId("step"),
      type: "approval",
      label: "Manager approval",
      config: { message: `Approve: ${intent}` },
    });
  }

  steps.push({
    id: crmNewId("step"),
    type: "action",
    label: "Create follow-up task",
    config: {
      actionType: "create_task",
      title: intent.slice(0, 80),
      priority: "high",
    },
  });

  return steps;
}

export function generateWorkflowFromIntent(intent: string): CreateWorkflowInput {
  const lower = intent.toLowerCase();
  const match = INTENT_KEYWORDS.find((entry) =>
    entry.keywords.some((kw) => lower.includes(kw))
  );
  const template = match
    ? WORKFLOW_TEMPLATES.find((t) => t.templateId === match.templateId)
    : undefined;

  const name = template?.name ?? `BDM: ${intent.slice(0, 48)}`;
  const steps = template?.steps ?? buildBdmCustomSteps(intent);

  return {
    name,
    description:
      template?.description ?? `BDM automation generated for: ${intent}`,
    enabled: true,
    templateId: template?.templateId,
    trigger: template?.trigger ?? { type: "manual", label: "Manual run" },
    steps: steps.map((step) => ({ ...step, id: crmNewId("step") })),
    tags: [...(template?.tags ?? ["bdm"]), "ai-generated"],
  };
}
