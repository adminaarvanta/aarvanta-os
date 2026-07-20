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
}

/** Idempotent — safe to call before publishing events in serverless handlers. */
export function ensureAutomationListenersRegistered(): void {
  registerAutomationListeners();
}
