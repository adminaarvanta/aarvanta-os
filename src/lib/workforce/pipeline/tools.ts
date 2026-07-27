import { applyAgentAction } from "@/lib/workforce/apply-action";
import { getCrmRepository } from "@/lib/data/crm-store";
import { publishDomainEvent } from "@/lib/events/publish";
import { aiAgentActor, systemActor } from "@/lib/identity/from-session";
import type { TenantScope } from "@/types/communication";
import type { AgentAction, AgentType } from "@/types/workforce";

/** Tool Execution Layer — AI never mutates CRM/inbox directly. */
export async function runWorkforceTool(input: {
  scope: TenantScope;
  agentType: AgentType;
  executionId: string;
  action: AgentAction;
}): Promise<{ kind: string; id?: string; message: string }> {
  const result = await applyAgentAction(input.action, input.scope, {
    agentType: input.agentType,
    runId: input.executionId,
  });

  await publishDomainEvent({
    scope: input.scope,
    type: "ai.decision.executed",
    actor: aiAgentActor(input.agentType),
    entityType: "workforce_execution",
    entityId: input.executionId,
    source: "ai",
    payload: {
      actionType: input.action.type,
      actionId: input.action.id,
      result: result.message,
    },
  });

  return result;
}

export async function createLinkedCrmTask(input: {
  scope: TenantScope;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  contactId?: string;
  dealId?: string;
  assignedAgentType?: AgentType;
}): Promise<{ id: string }> {
  const task = await getCrmRepository().createTask(
    {
      title: input.title,
      description: input.description,
      priority: input.priority,
      contactId: input.contactId,
      dealId: input.dealId,
      assignedAgentType: input.assignedAgentType,
      source: "ai",
    },
    input.scope
  );

  await publishDomainEvent({
    scope: input.scope,
    type: "task.created",
    actor: systemActor(),
    entityType: "task",
    entityId: task.id,
    source: "ai",
    payload: { source: "workforce_orchestrator" },
  });

  return { id: task.id };
}

export async function completeLinkedCrmTask(
  taskId: string,
  scope: TenantScope
): Promise<void> {
  const crm = getCrmRepository();
  const task = await crm.getTask(taskId, scope);
  if (!task || task.status === "done") return;
  await crm.updateTask(taskId, { status: "done" }, scope);
  await publishDomainEvent({
    scope,
    type: "task.completed",
    actor: systemActor(),
    entityType: "task",
    entityId: taskId,
    source: "ai",
    payload: { source: "workforce_orchestrator" },
  });
}
