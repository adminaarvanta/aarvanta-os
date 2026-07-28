import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { crmNow } from "@/lib/data/crm-helpers";
import type { Workflow } from "@/types/workflow";

const now = crmNow();

/**
 * BDM playbooks — linear automations a Business Development Manager would run:
 * qualify → outreach → follow-up → meeting → handoff.
 */
export const WORKFLOW_TEMPLATES: Omit<
  Workflow,
  keyof typeof DEMO_TENANT | "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Hot lead chase",
    description:
      "When a lead scores hot: tag them, draft WhatsApp outreach, create a same-day follow-up task.",
    enabled: true,
    templateId: "hot_lead_chase",
    trigger: {
      type: "crm_lead_scored",
      label: "When a lead is scored",
    },
    tags: ["bdm", "outreach", "crm"],
    steps: [
      {
        id: "step_condition",
        type: "condition",
        label: "Only if score ≥ 70",
        config: { field: "leadScore", operator: "gte", value: 70 },
      },
      {
        id: "step_tag",
        type: "action",
        label: "Tag as hot lead",
        config: { actionType: "tag_contact", tag: "hot_lead" },
      },
      {
        id: "step_agent",
        type: "agent",
        label: "AI Sales Manager qualifies & suggests next moves",
        config: { agentType: "sales_manager", applyActions: true },
      },
      {
        id: "step_draft",
        type: "action",
        label: "Draft WhatsApp outreach",
        config: {
          actionType: "draft_outreach",
          messageTemplate:
            "Hi {{name}}, thanks for connecting — I help teams hire an AI workforce without adding headcount. Open to a 15-min intro this week?",
        },
      },
      {
        id: "step_task",
        type: "action",
        label: "Create same-day follow-up task",
        config: {
          actionType: "create_task",
          title: "Call / WhatsApp hot lead today",
          priority: "high",
          description: "Use the outreach draft on the contact timeline.",
        },
      },
    ],
  },
  {
    name: "First outreach (WhatsApp)",
    description:
      "Manual BDM play: send a WhatsApp intro, log it, and schedule the follow-up.",
    enabled: true,
    templateId: "first_outreach_whatsapp",
    trigger: { type: "manual", label: "Manual run (pick a contact)" },
    tags: ["bdm", "whatsapp", "outreach"],
    steps: [
      {
        id: "step_send",
        type: "action",
        label: "Send WhatsApp intro",
        config: {
          actionType: "send_whatsapp",
          messageTemplate:
            "Hi {{name}}, this is Aarvanta — we help BDMs automate prospecting with AI. Worth a quick chat?",
        },
      },
      {
        id: "step_followup",
        type: "action",
        label: "Create 2-day follow-up task",
        config: {
          actionType: "create_task",
          title: "Follow up if no WhatsApp reply",
          priority: "medium",
          description: "Check thread and nudge or offer a meeting link.",
        },
      },
    ],
  },
  {
    name: "Book discovery call",
    description:
      "After interest: log a discovery meeting and create a confirm-time task for the BDM.",
    enabled: true,
    templateId: "book_discovery",
    trigger: { type: "manual", label: "Manual run" },
    tags: ["bdm", "meeting"],
    steps: [
      {
        id: "step_meeting",
        type: "action",
        label: "Log discovery meeting",
        config: {
          actionType: "book_meeting",
          meetingTitle: "Discovery call",
          meetingNotes: "Qualify need, budget, timeline; share Aarvanta demo if fit.",
        },
      },
      {
        id: "step_email",
        type: "action",
        label: "Send confirmation email draft",
        config: {
          actionType: "send_email",
          emailSubject: "Great connecting — discovery call next",
          messageTemplate:
            "Hi {{name}},\n\nLooking forward to our discovery call. I'll share a short agenda beforehand.\n\n— Aarvanta BDM",
        },
      },
    ],
  },
  {
    name: "Deal follow-up & stage move",
    description:
      "When a deal updates: if value is meaningful, move toward Proposal and create a BDM task.",
    enabled: true,
    templateId: "deal_followup",
    trigger: { type: "deal_updated", label: "When a deal is updated" },
    tags: ["bdm", "pipeline"],
    steps: [
      {
        id: "step_condition",
        type: "condition",
        label: "Deal value ≥ £5,000",
        config: { field: "dealValue", operator: "gte", value: 5000 },
      },
      {
        id: "step_stage",
        type: "action",
        label: "Move deal to Proposal",
        config: { actionType: "move_deal_stage", stageName: "Proposal" },
      },
      {
        id: "step_task",
        type: "action",
        label: "Create proposal prep task",
        config: {
          actionType: "create_task",
          title: "Prepare proposal / commercial pack",
          priority: "high",
        },
      },
    ],
  },
  {
    name: "Proposal handoff",
    description:
      "Large deals: AI brief → human approval → notify and hand off with a clear task.",
    enabled: true,
    templateId: "proposal_handoff",
    trigger: { type: "deal_updated", label: "When a deal is updated" },
    tags: ["bdm", "approval", "handoff"],
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
        label: "AI Sales Manager deal brief",
        config: { agentType: "sales_manager", applyActions: true },
      },
      {
        id: "step_approval",
        type: "approval",
        label: "Manager approval before send",
        config: {
          message: "Approve sending the proposal / commercial pack to the prospect.",
        },
      },
      {
        id: "step_alert",
        type: "action",
        label: "Log handoff note",
        config: {
          actionType: "alert",
          alertMessage: "Proposal approved — BDM/AE to send pack and confirm next step.",
        },
      },
      {
        id: "step_task",
        type: "action",
        label: "Create send-proposal task",
        config: {
          actionType: "create_task",
          title: "Send approved proposal to prospect",
          priority: "high",
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
