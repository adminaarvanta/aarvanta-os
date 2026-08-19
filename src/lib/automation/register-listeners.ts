import { scheduleBrainEvent } from "@/lib/ai-team/brain";
import { onDomainEvent } from "@/lib/events/publish";
import { scheduleProcessHrCase } from "@/lib/hr/process-case";
import { handleCrmWorkflowEvent } from "@/lib/workflow/trigger-from-events";

let registered = false;

export function registerAutomationListeners(): void {
  if (registered) return;
  registered = true;

  onDomainEvent("hr.case.created", async (event) => {
    scheduleProcessHrCase(event.entityId, {
      tenantId: event.tenantId,
      workspaceId: event.workspaceId,
      companyId: event.companyId,
    });
  });

  onDomainEvent("ai.decision.proposed", async (event) => {
    if (event.entityType !== "hr_case") return;
    console.info("[automation:ai.decision.proposed]", {
      caseId: event.entityId,
      action: event.payload.action,
    });
  });

  // CRM → Workflow automations (Zapier-style event triggers)
  for (const type of [
    "contact.created",
    "contact.updated",
    "deal.created",
    "deal.updated",
    "deal.won",
    "deal.lost",
  ] as const) {
    onDomainEvent(type, (event) => handleCrmWorkflowEvent(event));
  }

  // CRM ↔ AI Team brain (automatic loop; human-assigned work is left alone)
  for (const type of [
    "task.created",
    "contact.created",
    "contact.updated",
    "deal.created",
    "workforce.execution_completed",
  ] as const) {
    onDomainEvent(type, (event) => scheduleBrainEvent(event));
  }
}

/** Idempotent — safe to call before publishing events in serverless handlers. */
export function ensureAutomationListenersRegistered(): void {
  registerAutomationListeners();
}
