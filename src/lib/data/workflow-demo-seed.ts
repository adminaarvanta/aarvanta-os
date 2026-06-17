import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { crmNow } from "@/lib/data/crm-helpers";
import type { Workflow } from "@/types/workflow";

const now = crmNow();

export const WORKFLOW_TEMPLATES: Omit<
  Workflow,
  keyof typeof DEMO_TENANT | "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Lead Nurturing",
    description: "Score hot leads, run AI Sales Manager, create follow-up task.",
    enabled: true,
    templateId: "lead_nurturing",
    trigger: {
      type: "crm_lead_scored",
      label: "When a lead is scored",
    },
    tags: ["sales", "crm"],
    steps: [
      {
        id: "step_condition",
        type: "condition",
        label: "Lead score ≥ 70",
        config: { field: "leadScore", operator: "gte", value: 70 },
      },
      {
        id: "step_agent",
        type: "agent",
        label: "AI Sales Manager review",
        config: { agentType: "sales_manager" },
      },
      {
        id: "step_action",
        type: "action",
        label: "Create follow-up task",
        config: {
          actionType: "create_task",
          title: "Follow up hot lead",
          priority: "high",
        },
      },
    ],
  },
  {
    name: "Customer Onboarding",
    description: "Operations checklist with human approval gate.",
    enabled: true,
    templateId: "customer_onboarding",
    trigger: { type: "manual", label: "Manual run" },
    tags: ["onboarding", "operations"],
    steps: [
      {
        id: "step_agent_coo",
        type: "agent",
        label: "AI COO operations review",
        config: { agentType: "coo" },
      },
      {
        id: "step_action",
        type: "action",
        label: "Log onboarding kickoff",
        config: {
          actionType: "create_activity",
          title: "Customer onboarding started",
          activityType: "meeting",
        },
      },
      {
        id: "step_approval",
        type: "approval",
        label: "Manager approval",
        config: { message: "Approve customer onboarding plan before proceeding." },
      },
    ],
  },
  {
    name: "Proposal Approval",
    description: "Deal review with executive sign-off for proposals over £10k.",
    enabled: true,
    templateId: "proposal_approval",
    trigger: { type: "deal_updated", label: "When a deal is updated" },
    tags: ["sales", "approval"],
    steps: [
      {
        id: "step_condition",
        type: "condition",
        label: "Deal value ≥ £10,000",
        config: { field: "dealValue", operator: "gte", value: 10000 },
      },
      {
        id: "step_agent",
        type: "agent",
        label: "AI CEO briefing",
        config: { agentType: "ceo" },
      },
      {
        id: "step_approval",
        type: "approval",
        label: "Executive approval",
        config: { message: "Approve proposal before sending to client." },
      },
      {
        id: "step_alert",
        type: "action",
        label: "Notify team",
        config: {
          actionType: "alert",
          alertMessage: "Proposal approved and ready to send.",
        },
      },
    ],
  },
];

export function buildDemoWorkflowSeed(): Workflow[] {
  return WORKFLOW_TEMPLATES.map((template, index) => ({
    ...DEMO_TENANT,
    ...template,
    id: `wf_${template.templateId ?? index}`,
    createdAt: now,
    updatedAt: now,
  }));
}

export const DEMO_WORKFLOWS = buildDemoWorkflowSeed();
