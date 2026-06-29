import { onDomainEvent } from "@/lib/events/publish";
import { scheduleProcessHrCase } from "@/lib/hr/process-case";

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
}
