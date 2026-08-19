import { getCrmRepository } from "@/lib/data/crm-store";
import {
  getWorkforceExecutionsStore,
} from "@/lib/data/workforce-pipeline-store";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { publishDomainEvent } from "@/lib/events/publish";
import { aiAgentActor } from "@/lib/identity/from-session";
import { getAgentDefinition, isAgentType } from "@/lib/workforce/agents";
import { executeCrmTaskForAgent } from "@/lib/workforce/execute-crm-task";
import { contactDisplayName } from "@/types/crm";
import type { TenantScope } from "@/types/communication";
import type { DomainEvent } from "@/types/events";
import type { AgentType } from "@/types/workforce";

const executingTaskIds = new Set<string>();
const HOT_LEAD_SCORE = 70;

export type BrainLoopItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  at: string;
  kind: "task" | "job" | "run";
};

export type BrainLoopSnapshot = {
  openAgentTasks: number;
  doneAgentTasksToday: number;
  activeJobs: number;
  recentRuns: number;
  items: BrainLoopItem[];
};

function salesActor() {
  return aiAgentActor("sales_manager", getAgentDefinition("sales_manager").name);
}

/** Fire-and-forget so API mutations are not blocked by agent runs. */
export function scheduleBrainEvent(event: DomainEvent): void {
  void handleBrainEvent(event).catch((error) => {
    console.error(
      `[ai-team:brain] ${event.type} ${event.entityId}`,
      error instanceof Error ? error.message : error
    );
  });
}

export async function handleBrainEvent(event: DomainEvent): Promise<void> {
  switch (event.type) {
    case "task.created":
      await onTaskCreated(event);
      return;
    case "contact.created":
      await onContactCreated(event);
      return;
    case "contact.updated":
      await onContactUpdated(event);
      return;
    case "deal.created":
      await onDealCreated(event);
      return;
    case "workforce.execution_completed":
      await onJobCompleted(event);
      return;
    default:
      return;
  }
}

async function onTaskCreated(event: DomainEvent) {
  if (event.payload.source === "workforce_orchestrator") {
    return;
  }

  const task = await getCrmRepository().getTask(event.entityId, event);
  if (!task || task.status === "done") return;
  if (!task.assignedAgentType || !isAgentType(task.assignedAgentType)) return;

  scheduleExecuteAgentTask(task.id, event, task.assignedAgentType);
}

async function onContactCreated(event: DomainEvent) {
  if (event.payload.source === "inbound_qualification") return;
  const contact = await getCrmRepository().getContact(event.entityId, event);
  if (!contact) return;
  const name = contactDisplayName(contact);
  await enqueueAgentTask({
    scope: event,
    title: `Review new contact ${name}`,
    description:
      "AI Team brain: a new person was added to CRM. Qualify, score, and recommend the next step.",
    contactId: contact.id,
    accountId: contact.accountId,
    agentType: "sales_manager",
    priority: "medium",
    reason: "contact.created",
  });
}

async function onContactUpdated(event: DomainEvent) {
  const score = Number(event.payload.leadScore);
  if (!Number.isFinite(score) || score < HOT_LEAD_SCORE) return;

  const contact = await getCrmRepository().getContact(event.entityId, event);
  if (!contact) return;
  const name = contactDisplayName(contact);
  await enqueueAgentTask({
    scope: event,
    title: `Follow up with hot lead ${name}`,
    description: `AI Team brain: lead score is ${score}. ${
      typeof event.payload.reason === "string" ? event.payload.reason : ""
    }`.trim(),
    contactId: contact.id,
    accountId: contact.accountId,
    agentType: "sales_manager",
    priority: "high",
    reason: "hot_lead",
  });
}

async function onDealCreated(event: DomainEvent) {
  const deal = await getCrmRepository().getDeal(event.entityId, event);
  if (!deal || deal.status !== "open") return;
  await enqueueAgentTask({
    scope: event,
    title: `Advance opportunity: ${deal.title}`,
    description:
      "AI Team brain: a new deal landed in the pipeline. Propose next steps and log a plan.",
    contactId: deal.contactId,
    accountId: deal.accountId,
    dealId: deal.id,
    agentType: "sales_manager",
    priority: deal.value >= 5000 ? "high" : "medium",
    reason: "deal.created",
  });
}

async function onJobCompleted(event: DomainEvent) {
  const contactId =
    typeof event.payload.relatedContactId === "string"
      ? event.payload.relatedContactId
      : undefined;
  const dealId =
    typeof event.payload.relatedDealId === "string"
      ? event.payload.relatedDealId
      : undefined;
  if (!contactId && !dealId) return;

  const outcome =
    typeof event.payload.outcome === "string"
      ? event.payload.outcome
      : "Job completed";

  await getCrmRepository().createActivity(
    {
      type: "note",
      title: `AI Team finished: ${outcome}`,
      description: "Closed-loop update from an AI Team job back into CRM.",
      contactId,
      dealId,
      authorName: "AI Team",
    },
    event
  );
}

export async function dispatchInsightActions(input: {
  scope: TenantScope;
  contactId: string;
  actions: string[];
}): Promise<{ taskIds: string[] }> {
  const contact = await getCrmRepository().getContact(input.contactId, input.scope);
  if (!contact) return { taskIds: [] };
  const name = contactDisplayName(contact);
  const taskIds: string[] = [];

  for (const action of input.actions.slice(0, 2)) {
    const title = action.trim().slice(0, 120);
    if (!title) continue;
    const id = await enqueueAgentTask({
      scope: input.scope,
      title,
      description: `Dispatched from CRM insights for ${name}.`,
      contactId: contact.id,
      accountId: contact.accountId,
      agentType: "sales_manager",
      priority: "high",
      reason: "insights",
    });
    if (id) taskIds.push(id);
  }

  return { taskIds };
}

async function enqueueAgentTask(input: {
  scope: TenantScope;
  title: string;
  description: string;
  contactId?: string;
  accountId?: string;
  dealId?: string;
  agentType: AgentType;
  priority: "low" | "medium" | "high";
  reason: string;
}): Promise<string | null> {
  const crm = getCrmRepository();
  const open = await crm.listTasks(input.scope);
  const exists = open.some((task) => {
    if (task.status === "done") return false;
    if (input.contactId && task.contactId !== input.contactId) return false;
    if (input.dealId && task.dealId !== input.dealId) return false;
    return task.title.trim().toLowerCase() === input.title.trim().toLowerCase();
  });
  if (exists) return null;

  const task = await crm.createTask(
    {
      title: input.title,
      description: input.description,
      priority: input.priority,
      contactId: input.contactId,
      accountId: input.accountId,
      dealId: input.dealId,
      assignedAgentType: input.agentType,
      source: "ai",
    },
    input.scope
  );

  await publishDomainEvent({
    scope: input.scope,
    type: "task.created",
    actor: salesActor(),
    entityType: "task",
    entityId: task.id,
    source: "ai",
    payload: {
      title: task.title,
      assignedAgentType: input.agentType,
      brain: true,
      reason: input.reason,
    },
  });

  await publishDomainEvent({
    scope: input.scope,
    type: "ai.decision.executed",
    actor: salesActor(),
    entityType: "task",
    entityId: task.id,
    source: "ai",
    payload: {
      action: "enqueue_agent_task",
      reason: input.reason,
      assignedAgentType: input.agentType,
    },
  });

  return task.id;
}

function scheduleExecuteAgentTask(
  taskId: string,
  scope: TenantScope,
  agentType: AgentType
) {
  if (executingTaskIds.has(taskId)) return;
  executingTaskIds.add(taskId);
  void executeCrmTaskForAgent({
    taskId,
    scope,
    agentType,
  })
    .catch((error) => {
      console.error(
        `[ai-team:brain] execute task=${taskId}`,
        error instanceof Error ? error.message : error
      );
    })
    .finally(() => {
      executingTaskIds.delete(taskId);
    });
}

export async function getBrainLoopSnapshot(
  scope: TenantScope
): Promise<BrainLoopSnapshot> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [tasks, executions, runs] = await Promise.all([
    getCrmRepository().listTasks(scope),
    getWorkforceExecutionsStore().list(scope),
    getWorkforceRepository().listRuns(scope, { limit: 12 }),
  ]);

  const agentTasks = tasks.filter(
    (t) => t.assignedAgentType && isAgentType(t.assignedAgentType)
  );
  const openAgentTasks = agentTasks.filter((t) => t.status !== "done").length;
  const doneAgentTasksToday = agentTasks.filter(
    (t) => t.status === "done" && t.updatedAt >= todayIso
  ).length;

  const activeStatuses = new Set([
    "created",
    "planning",
    "collecting_context",
    "executing",
    "awaiting_approval",
  ]);
  const activeJobs = executions.filter((e) =>
    activeStatuses.has(e.status)
  ).length;

  const items: BrainLoopItem[] = [
    ...agentTasks
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 8)
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        detail: `${getAgentDefinition(task.assignedAgentType as AgentType).name} · ${task.status.replace(/_/g, " ")}`,
        href: task.agentRunId
          ? `/workforce/runs/${task.agentRunId}`
          : "/crm/activity",
        at: task.updatedAt,
        kind: "task" as const,
      })),
    ...executions.slice(0, 6).map((execution) => ({
      id: `job-${execution.id}`,
      title: "AI Team job",
      detail: execution.status.replace(/_/g, " "),
      href: `/workforce/jobs/${execution.id}`,
      at: execution.completedAt ?? execution.startedAt ?? execution.createdAt,
      kind: "job" as const,
    })),
    ...runs.slice(0, 6).map((run) => ({
      id: `run-${run.id}`,
      title: run.summary?.slice(0, 80) || `${getAgentDefinition(run.agentType).name} run`,
      detail: run.status,
      href: `/workforce/runs/${run.id}`,
      at: run.completedAt ?? run.createdAt,
      kind: "run" as const,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  return {
    openAgentTasks,
    doneAgentTasksToday,
    activeJobs,
    recentRuns: runs.length,
    items,
  };
}
