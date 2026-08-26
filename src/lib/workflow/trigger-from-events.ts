import { getCrmRepository } from "@/lib/data/crm-store";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { startWorkflowRun } from "@/lib/workflow/execute";
import type { TenantScope } from "@/types/communication";
import type { DomainEvent } from "@/types/events";
import type { WorkflowTriggerType } from "@/types/workflow";

async function runMatchingWorkflows(
  scope: TenantScope,
  triggerType: WorkflowTriggerType,
  context: {
    contactId?: string;
    dealId?: string;
    contactName?: string;
    leadScore?: number;
    dealValue?: number;
    notes?: string;
  },
  filter?: (workflow: { trigger: { config?: Record<string, unknown> } }) => boolean
) {
  const workflows = await getWorkflowRepository().listWorkflows(scope);
  const matches = workflows.filter(
    (wf) =>
      wf.enabled &&
      wf.trigger.type === triggerType &&
      (filter ? filter(wf) : true)
  );

  for (const workflow of matches) {
    try {
      await startWorkflowRun(scope, workflow, context, { trigger: "automation" });
    } catch (error) {
      console.warn(
        `[workflow:${triggerType}] failed for ${workflow.id}:`,
        error instanceof Error ? error.message : error
      );
    }
  }
}

export async function handleCrmWorkflowEvent(event: DomainEvent): Promise<void> {
  const scope: TenantScope = {
    tenantId: event.tenantId,
    workspaceId: event.workspaceId,
    companyId: event.companyId,
  };
  const crm = getCrmRepository();

  if (event.type === "contact.updated" || event.type === "contact.created") {
    const contact = await crm.getContact(event.entityId, scope);
    if (!contact) return;
    const score = contact.leadScore ?? 0;
    // Fire lead-scored automations when score is meaningful.
    if (score < 50 && event.type === "contact.updated") return;
    await runMatchingWorkflows(scope, "crm_lead_scored", {
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`.trim(),
      leadScore: score,
      notes: typeof event.payload.reason === "string" ? event.payload.reason : undefined,
    });
    return;
  }

  if (
    event.type === "deal.updated" ||
    event.type === "deal.created" ||
    event.type === "deal.won" ||
    event.type === "deal.lost"
  ) {
    const deal = await crm.getDeal(event.entityId, scope);
    if (!deal) return;
    let contactName: string | undefined;
    let leadScore: number | undefined;
    if (deal.contactId) {
      const contact = await crm.getContact(deal.contactId, scope);
      if (contact) {
        contactName = `${contact.firstName} ${contact.lastName}`.trim();
        leadScore = contact.leadScore;
      }
    }
    const eventHint =
      event.type === "deal.won"
        ? "won"
        : event.type === "deal.lost"
          ? "lost"
          : event.type === "deal.created"
            ? "created"
            : "updated";
    await runMatchingWorkflows(
      scope,
      "deal_updated",
      {
        contactId: deal.contactId,
        dealId: deal.id,
        contactName,
        leadScore,
        dealValue: deal.value,
        notes: deal.notes,
      },
      (wf) => {
        const wantStatus = wf.trigger.config?.dealStatus;
        if (wantStatus === "won") {
          return eventHint === "won" || deal.status === "won";
        }
        if (wantStatus === "open") {
          return deal.status === "open" && eventHint === "updated";
        }
        return true;
      }
    );
  }
}
