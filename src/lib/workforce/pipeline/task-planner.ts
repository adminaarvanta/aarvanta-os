import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import type { AgentType, TaskPlan, TaskPlanStep, WorkforceGoal } from "@/types/workforce";

function step(
  title: string,
  assignedAgentType?: AgentType,
  opts?: { toolHint?: string; requiresApproval?: boolean }
): TaskPlanStep {
  return {
    id: crmNewId("wf_step"),
    title,
    status: "pending",
    assignedAgentType,
    toolHint: opts?.toolHint,
    requiresApproval: opts?.requiresApproval,
  };
}

const PLANS: Record<
  Exclude<WorkforceGoal["objective"], "custom">,
  () => TaskPlanStep[]
> = {
  close_lead: () => [
    step("Review CRM profile and lead score", "sales_manager", {
      toolHint: "crm_review",
    }),
    step("Review previous conversations", "sales_manager", {
      toolHint: "comms_review",
    }),
    step("Analyse customer intent", "sales_manager", {
      toolHint: "intent_analysis",
    }),
    step("Prepare communication strategy", "sales_manager", {
      toolHint: "strategy",
    }),
    step("Send WhatsApp outreach", "sales_manager", {
      toolHint: "whatsapp_send",
    }),
    step("Schedule AI voice follow-up", "sales_manager", {
      toolHint: "voice_call",
    }),
    step("Apply discount if customer requests above policy", "sales_manager", {
      toolHint: "discount_check",
      requiresApproval: true,
    }),
    step("Update CRM and create follow-up reminders", "sales_manager", {
      toolHint: "crm_update",
    }),
    step("Generate task report", "ceo", { toolHint: "report" }),
  ],
  follow_up: () => [
    step("Review CRM and last touchpoint", "sales_manager", {
      toolHint: "crm_review",
    }),
    step("Draft follow-up message", "sales_manager", {
      toolHint: "suggest_reply",
    }),
    step("Send follow-up via preferred channel", "sales_manager", {
      toolHint: "whatsapp_send",
    }),
    step("Schedule reminder if no reply", "sales_manager", {
      toolHint: "crm_update",
    }),
    step("Generate task report", "ceo", { toolHint: "report" }),
  ],
  recover_customer: () => [
    step("Review churn risk and history", "customer_success_manager", {
      toolHint: "crm_review",
    }),
    step("Analyse prior conversations", "customer_success_manager", {
      toolHint: "comms_review",
    }),
    step("Prepare recovery offer strategy", "customer_success_manager", {
      toolHint: "strategy",
    }),
    step("Send recovery outreach", "customer_success_manager", {
      toolHint: "whatsapp_send",
    }),
    step("Escalate discount or credit if needed", "customer_success_manager", {
      toolHint: "discount_check",
      requiresApproval: true,
    }),
    step("Update CRM status", "customer_success_manager", {
      toolHint: "crm_update",
    }),
    step("Generate task report", "ceo", { toolHint: "report" }),
  ],
  book_meeting: () => [
    step("Review contact availability signals", "sales_manager", {
      toolHint: "crm_review",
    }),
    step("Propose meeting times", "sales_manager", { toolHint: "strategy" }),
    step("Send meeting invite outreach", "sales_manager", {
      toolHint: "whatsapp_send",
    }),
    step("Log meeting activity in CRM", "sales_manager", {
      toolHint: "crm_update",
    }),
    step("Generate task report", "ceo", { toolHint: "report" }),
  ],
  generate_proposal: () => [
    step("Review opportunity and pricing context", "sales_manager", {
      toolHint: "crm_review",
    }),
    step("Draft proposal outline", "sales_manager", { toolHint: "strategy" }),
    step("Flag non-standard discount for approval", "sales_manager", {
      toolHint: "discount_check",
      requiresApproval: true,
    }),
    step("Create proposal follow-up task", "sales_manager", {
      toolHint: "crm_update",
    }),
    step("Generate task report", "ceo", { toolHint: "report" }),
  ],
};

/** Task Planning Engine — produces steps only; no AI employees assigned yet beyond hints. */
export function buildTaskPlan(goal: WorkforceGoal): TaskPlan {
  const steps =
    goal.objective === "custom"
      ? [
          step("Understand custom objective", "coo", { toolHint: "strategy" }),
          step("Gather relevant business context", "coo", {
            toolHint: "crm_review",
          }),
          step("Execute primary actions", "coo", { toolHint: "crm_update" }),
          step("Generate task report", "ceo", { toolHint: "report" }),
        ]
      : PLANS[goal.objective]();

  return { steps, createdAt: crmNow() };
}
