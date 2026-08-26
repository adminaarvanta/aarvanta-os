import { DEMO_TENANT } from "@/lib/tenant/demo-context";
import { crmNow } from "@/lib/data/crm-helpers";
import type { Workflow } from "@/types/workflow";

export {
  AUTOMATION_BACKGROUND_IDS,
  AUTOMATION_PRESET_IDS,
  isAutomationBackground,
} from "@/lib/workflow/preset-kinds";
export type { AutomationPresetId } from "@/lib/workflow/preset-kinds";

const now = crmNow();

export type WorkflowTemplateDraft = Omit<
  Workflow,
  keyof typeof DEMO_TENANT | "id" | "createdAt" | "updatedAt"
>;

/**
 * Default Automation home — ask-now presets are ready; background ones start off
 * so a team has to opt in before we email or call on our own.
 */
export const AUTOMATION_PRESETS: WorkflowTemplateDraft[] = [
  {
    name: "Schedule a call with the team",
    description: "Book a call, email them to confirm, and put a reminder on your list.",
    enabled: true,
    templateId: "schedule_team_call",
    trigger: { type: "manual", label: "Manual run (pick a person)" },
    tags: ["meeting", "crm"],
    steps: [
      {
        id: "step_meeting",
        type: "action",
        label: "Log team call",
        config: {
          actionType: "book_meeting",
          meetingTitle: "Call with the team",
          meetingNotes: "Confirm time, attendees, and agenda with the customer.",
        },
      },
      {
        id: "step_email",
        type: "action",
        label: "Send confirmation email",
        config: {
          actionType: "send_email",
          emailSubject: "Your call with our team",
          messageTemplate:
            "Hi {{name}},\n\nLooking forward to our call. Reply if you need a different time.\n\n— Aarvanta",
        },
      },
    ],
  },
  {
    name: "AI voice follow-up",
    description: "We'll call them for you and email the time.",
    enabled: true,
    templateId: "ai_voice_followup",
    trigger: { type: "manual", label: "Manual run (pick a person)" },
    tags: ["voice", "crm"],
    steps: [
      {
        id: "step_call",
        type: "action",
        label: "Schedule AI voice call",
        config: {
          actionType: "schedule_call",
          scheduleSlotId: "next_morning",
          scheduleKind: "scheduled",
          callMessage:
            "Follow up from CRM — continue the conversation and confirm next steps.",
        },
      },
    ],
  },
  {
    name: "Chase a new lead",
    description: "When someone looks interested, we follow up the same day.",
    enabled: false,
    templateId: "new_lead_chase",
    trigger: { type: "crm_lead_scored", label: "When a lead is scored" },
    tags: ["crm", "outreach"],
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
        label: "Draft outreach",
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
          title: "Chase hot lead today",
          priority: "high",
          description: "Use the outreach draft on the contact timeline.",
        },
      },
    ],
  },
  {
    name: "Call back missed calls",
    description:
      "If a call doesn't connect, we book a callback and email them.",
    enabled: false,
    templateId: "missed_call_callback",
    trigger: { type: "manual", label: "Manual run (or Voice OS on hang-up)" },
    tags: ["voice", "callback"],
    steps: [
      {
        id: "step_call",
        type: "action",
        label: "Schedule callback",
        config: {
          actionType: "schedule_call",
          scheduleSlotId: "next_afternoon",
          scheduleKind: "callback",
          callMessage: "Callback as requested — continue from the last conversation.",
        },
      },
    ],
  },
  {
    name: "Follow up quiet deals",
    description: "When a deal goes quiet, we nudge them and remind you.",
    enabled: false,
    templateId: "quiet_deal_followup",
    trigger: {
      type: "deal_updated",
      label: "When an open deal is updated",
      config: { dealStatus: "open" },
    },
    tags: ["crm", "pipeline"],
    steps: [
      {
        id: "step_task",
        type: "action",
        label: "Create follow-up task",
        config: {
          actionType: "create_task",
          title: "Nudge quiet deal",
          priority: "medium",
          description: "Deal went quiet — check in and move the next step.",
        },
      },
      {
        id: "step_email",
        type: "action",
        label: "Send follow-up email",
        config: {
          actionType: "send_email",
          emailSubject: "Checking in",
          messageTemplate:
            "Hi {{name}},\n\nWanted to check in on next steps. Happy to jump on a quick call if useful.\n\n— Aarvanta",
        },
      },
    ],
  },
  {
    name: "After you win a deal",
    description: "Send a welcome email and start onboarding.",
    enabled: false,
    templateId: "deal_won_next_steps",
    trigger: {
      type: "deal_updated",
      label: "When a deal is won",
      config: { dealStatus: "won" },
    },
    tags: ["crm", "handoff"],
    steps: [
      {
        id: "step_task",
        type: "action",
        label: "Create onboarding task",
        config: {
          actionType: "create_task",
          title: "Kick off onboarding",
          priority: "high",
          description: "Deal won — send welcome pack and book kickoff.",
        },
      },
      {
        id: "step_email",
        type: "action",
        label: "Send welcome email",
        config: {
          actionType: "send_email",
          emailSubject: "Welcome — next steps",
          messageTemplate:
            "Hi {{name}},\n\nThrilled to be working together. We'll send onboarding details shortly.\n\n— Aarvanta",
        },
      },
    ],
  },
];

/** Older BDM gallery — still installable from “More playbooks”, not the home grid. */
export const LEGACY_WORKFLOW_TEMPLATES: WorkflowTemplateDraft[] = [
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

/** Installable templates: presets first, then older BDM playbooks. */
export const WORKFLOW_TEMPLATES: WorkflowTemplateDraft[] = [
  ...AUTOMATION_PRESETS,
  ...LEGACY_WORKFLOW_TEMPLATES,
];

export function buildDemoWorkflowSeed(): Workflow[] {
  return AUTOMATION_PRESETS.map((template, index) => ({
    ...DEMO_TENANT,
    ...template,
    id: `wf_${template.templateId ?? index}`,
    createdAt: now,
    updatedAt: now,
  }));
}

export const DEMO_WORKFLOWS = buildDemoWorkflowSeed();
