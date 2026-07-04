import { crmNewId } from "@/lib/data/crm-helpers";
import { WORKFLOW_TEMPLATES } from "@/lib/data/workflow-demo-seed";
import type { CreateWorkflowInput } from "@/lib/data/workflow-repository";
import type { WorkflowStep } from "@/types/workflow";

const INTENT_KEYWORDS: Array<{
  keywords: string[];
  templateId: string;
}> = [
  { keywords: ["lead", "nurture", "sales", "follow"], templateId: "lead_nurturing" },
  { keywords: ["onboard", "customer", "welcome"], templateId: "customer_onboarding" },
  { keywords: ["proposal", "deal", "approval"], templateId: "proposal_approval" },
  { keywords: ["invoice", "payment", "finance"], templateId: "proposal_approval" },
  { keywords: ["payroll", "salary", "hr"], templateId: "customer_onboarding" },
];

function buildCustomSteps(intent: string): WorkflowStep[] {
  const lower = intent.toLowerCase();
  const steps: WorkflowStep[] = [
    {
      id: crmNewId("step"),
      type: "agent",
      label: "AI operations review",
      config: { agentType: "coo", prompt: intent },
    },
  ];

  if (lower.includes("approval") || lower.includes("sign")) {
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
      priority: "medium",
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

  const name = template?.name ?? `Workflow: ${intent.slice(0, 48)}`;
  const steps = template?.steps ?? buildCustomSteps(intent);

  return {
    name,
    description: template?.description ?? `AI-generated workflow for: ${intent}`,
    enabled: true,
    templateId: template?.templateId,
    trigger: template?.trigger ?? { type: "manual", label: "Manual run" },
    steps: steps.map((step) => ({ ...step, id: crmNewId("step") })),
    tags: [...(template?.tags ?? []), "ai-generated"],
  };
}
