import {
  getWorkforceApprovalsStore,
  getWorkforceExecutionsStore,
} from "@/lib/data/workforce-pipeline-store";
import { crmNow } from "@/lib/data/crm-helpers";
import { publishDomainEvent } from "@/lib/events/publish";
import { systemActor } from "@/lib/identity/from-session";
import { appendTimeline } from "@/lib/workforce/pipeline/timeline";
import type { TenantScope } from "@/types/communication";
import type {
  ApprovalResolution,
  WorkforceApproval,
} from "@/types/workforce";

export async function createApprovalRequest(input: {
  scope: TenantScope;
  executionId: string;
  stepId: string;
  reason: string;
  proposedAction: string;
  currentOffer?: string;
  requestedOffer?: string;
  dealValue?: number;
  marginImpact?: string;
}): Promise<WorkforceApproval> {
  const approval = await getWorkforceApprovalsStore().create({
    ...input.scope,
    executionId: input.executionId,
    stepId: input.stepId,
    reason: input.reason,
    proposedAction: input.proposedAction,
    currentOffer: input.currentOffer,
    requestedOffer: input.requestedOffer,
    dealValue: input.dealValue,
    marginImpact: input.marginImpact,
    status: "pending",
    createdAt: crmNow(),
  });

  const execStore = getWorkforceExecutionsStore();
  const execution = await execStore.get(input.executionId, input.scope);
  if (execution) {
    let next: typeof execution = {
      ...execution,
      status: "awaiting_approval",
      approvalIds: [...execution.approvalIds, approval.id],
      plan: {
        ...execution.plan,
        steps: execution.plan.steps.map((s) =>
          s.id === input.stepId
            ? { ...s, status: "awaiting_approval" as const }
            : s
        ),
      },
    };
    next = appendTimeline(next, {
      actorKind: "system",
      actorLabel: "Approval Engine",
      label: `Decision required: ${input.proposedAction}`,
      payload: { approvalId: approval.id },
    });
    await execStore.set(next);
  }

  await publishDomainEvent({
    scope: input.scope,
    type: "workforce.approval_requested",
    actor: systemActor(),
    entityType: "workforce_approval",
    entityId: approval.id,
    source: "ai",
    payload: {
      executionId: input.executionId,
      reason: input.reason,
    },
  });

  return approval;
}

export async function resolveApproval(input: {
  scope: TenantScope;
  approvalId: string;
  resolution: ApprovalResolution;
  modifiedOffer?: string;
  resolvedBy?: string;
}): Promise<{ approval: WorkforceApproval; executionId: string; decisionLabel: string }> {
  const store = getWorkforceApprovalsStore();
  const approval = await store.get(input.approvalId, input.scope);
  if (!approval) throw new Error("Approval not found");
  if (approval.status !== "pending") throw new Error("Approval already resolved");

  const updated: WorkforceApproval = {
    ...approval,
    status: "resolved",
    resolution: input.resolution,
    modifiedOffer: input.modifiedOffer,
    resolvedAt: crmNow(),
    resolvedBy: input.resolvedBy,
  };
  await store.set(updated);

  const decisionLabel =
    input.resolution === "approved"
      ? `Approved: ${approval.proposedAction}`
      : input.resolution === "rejected"
        ? `Rejected: ${approval.proposedAction}`
        : `Modified offer: ${input.modifiedOffer ?? approval.proposedAction}`;

  const execStore = getWorkforceExecutionsStore();
  let execution = await execStore.get(approval.executionId, input.scope);
  if (execution) {
    execution = appendTimeline(execution, {
      actorKind: "human",
      actorLabel: input.resolvedBy ?? "Owner",
      label: decisionLabel,
      payload: { approvalId: approval.id, resolution: input.resolution },
    });
    execution = {
      ...execution,
      status: "executing",
      plan: {
        ...execution.plan,
        steps: execution.plan.steps.map((s) =>
          s.id === approval.stepId
            ? {
                ...s,
                status:
                  input.resolution === "rejected"
                    ? ("skipped" as const)
                    : ("completed" as const),
                completedAt: crmNow(),
                resultSummary: decisionLabel,
              }
            : s
        ),
      },
    };
    await execStore.set(execution);
  }

  return {
    approval: updated,
    executionId: approval.executionId,
    decisionLabel,
  };
}

export async function listPendingApprovals(scope: TenantScope) {
  const all = await getWorkforceApprovalsStore().list(scope);
  return all
    .filter((a) => a.status === "pending")
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}
