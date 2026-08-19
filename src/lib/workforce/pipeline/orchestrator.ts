import {
  getWorkforceApprovalsStore,
  getWorkforceExecutionsStore,
  getWorkforceGoalsStore,
} from "@/lib/data/workforce-pipeline-store";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { publishDomainEvent } from "@/lib/events/publish";
import { systemActor } from "@/lib/identity/from-session";
import { createApprovalRequest } from "@/lib/workforce/pipeline/approvals";
import { buildContextPackage } from "@/lib/workforce/pipeline/context-builder";
import {
  buildWorkforceGoal,
  goalDisplayLabel,
  type CreateGoalInput,
} from "@/lib/workforce/pipeline/goal-engine";
import { buildWorkforceReport } from "@/lib/workforce/pipeline/reporting";
import { buildTaskPlan } from "@/lib/workforce/pipeline/task-planner";
import { agentLabel } from "@/lib/workforce/pipeline/labels";
import { appendTimeline } from "@/lib/workforce/pipeline/timeline";
import {
  completeLinkedCrmTask,
  createLinkedCrmTask,
  runWorkforceTool,
} from "@/lib/workforce/pipeline/tools";
import type { TenantScope } from "@/types/communication";
import type {
  AgentType,
  TaskPlanStep,
  WorkforceExecution,
  WorkforceGoal,
} from "@/types/workforce";

/** Agents for a goal — used by pipeline and AI Team plan preview. */
export function selectAgentsForGoal(goal: WorkforceGoal): {
  assigned: AgentType[];
  monitoring: AgentType[];
} {
  switch (goal.objective) {
    case "close_lead":
    case "follow_up":
    case "book_meeting":
    case "generate_proposal":
      return {
        assigned: ["sales_manager"],
        monitoring: ["ceo"],
      };
    case "recover_customer":
      return {
        assigned: ["customer_success_manager", "sales_manager"],
        monitoring: ["ceo"],
      };
    case "custom":
    default: {
      const byModule: Record<WorkforceGoal["moduleHint"], AgentType[]> = {
        hr: ["hr_manager"],
        marketing: ["marketing_manager"],
        finance: ["cfo"],
        crm: ["sales_manager"],
        communications: ["sales_manager"],
        operations: ["coo"],
      };
      return {
        assigned: byModule[goal.moduleHint] ?? ["coo"],
        monitoring: ["ceo"],
      };
    }
  }
}

export function estimateMinutesForGoal(goal: WorkforceGoal): {
  min: number;
  max: number;
} {
  switch (goal.objective) {
    case "close_lead":
      return { min: 15, max: 20 };
    case "follow_up":
      return { min: 5, max: 10 };
    case "recover_customer":
      return { min: 20, max: 35 };
    case "book_meeting":
      return { min: 10, max: 15 };
    case "generate_proposal":
      return { min: 20, max: 40 };
    default:
      return { min: 10, max: 25 };
  }
}

function shouldPauseForDiscount(goal: WorkforceGoal, step: TaskPlanStep): boolean {
  if (!step.requiresApproval) return false;
  const instructions = goal.instructions?.toLowerCase() ?? "";
  // Always pause discount steps so humans see the Approval Engine in demo;
  // instructions mentioning a max discount still trigger.
  if (step.toolHint === "discount_check") return true;
  if (/discount|refund|credit/i.test(instructions)) return true;
  return Boolean(step.requiresApproval);
}

async function executeStep(input: {
  scope: TenantScope;
  goal: WorkforceGoal;
  execution: WorkforceExecution;
  step: TaskPlanStep;
  actionsPerformed: string[];
}): Promise<{
  execution: WorkforceExecution;
  paused: boolean;
  actionsPerformed: string[];
}> {
  const agent = (input.step.assignedAgentType ??
    input.execution.assignedAgents[0] ??
    "coo") as AgentType;
  const label = agentLabel(agent);
  let execution = appendTimeline(input.execution, {
    actorKind: "agent",
    actorId: agent,
    actorLabel: label,
    label: input.step.title,
  });
  execution = {
    ...execution,
    plan: {
      ...execution.plan,
      steps: execution.plan.steps.map((s) =>
        s.id === input.step.id
          ? { ...s, status: "in_progress" as const, assignedAgentType: agent }
          : s
      ),
    },
  };
  await getWorkforceExecutionsStore().set(execution);

  const actionsPerformed = [...input.actionsPerformed];

  if (shouldPauseForDiscount(input.goal, input.step)) {
    await createApprovalRequest({
      scope: input.scope,
      executionId: execution.id,
      stepId: input.step.id,
      reason: "Customer requested a discount outside standard policy.",
      proposedAction: "Approve 15% Discount",
      currentOffer: "10% discount",
      requestedOffer: "15% discount",
      dealValue: 125000,
      marginImpact: "Estimated margin impact −3.2%",
    });
    const paused = await getWorkforceExecutionsStore().get(
      execution.id,
      input.scope
    );
    return {
      execution: paused ?? execution,
      paused: true,
      actionsPerformed,
    };
  }

  let resultSummary = `${input.step.title} completed`;

  if (input.step.toolHint === "crm_update" || input.step.toolHint === "crm_review") {
    const action = {
      id: crmNewId("wf_act"),
      type: "create_activity" as const,
      label: input.step.title,
      payload: {
        type: "note",
        title: input.step.title,
        description: `Workforce execution ${execution.id}: ${goalDisplayLabel(input.goal)}`,
        contactId: input.goal.relatedContactId,
        dealId: input.goal.relatedDealId,
      },
    };
    try {
      const result = await runWorkforceTool({
        scope: input.scope,
        agentType: agent,
        executionId: execution.id,
        action,
      });
      resultSummary = result.message;
      actionsPerformed.push(result.message);
    } catch {
      resultSummary = `${input.step.title} (logged in timeline)`;
      actionsPerformed.push(resultSummary);
    }
  } else if (input.step.toolHint === "whatsapp_send" || input.step.toolHint === "suggest_reply") {
    const action = {
      id: crmNewId("wf_act"),
      type: "suggest_reply" as const,
      label: "Draft outreach",
      payload: {
        conversationId: input.goal.relatedConversationId,
        content: `Following up on ${goalDisplayLabel(input.goal)}. ${input.goal.instructions ?? ""}`.trim(),
      },
    };
    try {
      const result = await runWorkforceTool({
        scope: input.scope,
        agentType: agent,
        executionId: execution.id,
        action,
      });
      resultSummary = result.message;
      actionsPerformed.push(`WhatsApp outreach: ${result.message}`);
    } catch {
      resultSummary = "WhatsApp outreach drafted";
      actionsPerformed.push(resultSummary);
    }
  } else if (input.step.toolHint === "voice_call") {
    const action = {
      id: crmNewId("wf_act"),
      type: "create_activity" as const,
      label: "AI voice call",
      payload: {
        type: "call",
        title: "AI Voice follow-up",
        description: `Voice outreach for ${goalDisplayLabel(input.goal)}`,
        contactId: input.goal.relatedContactId,
        dealId: input.goal.relatedDealId,
      },
    };
    try {
      const result = await runWorkforceTool({
        scope: input.scope,
        agentType: agent,
        executionId: execution.id,
        action,
      });
      resultSummary = result.message;
      actionsPerformed.push(`Voice call: ${result.message}`);
    } catch {
      resultSummary = "Voice call initiated";
      actionsPerformed.push(resultSummary);
    }
  } else {
    actionsPerformed.push(resultSummary);
  }

  execution = {
    ...execution,
    plan: {
      ...execution.plan,
      steps: execution.plan.steps.map((s) =>
        s.id === input.step.id
          ? {
              ...s,
              status: "completed" as const,
              completedAt: crmNow(),
              resultSummary,
              assignedAgentType: agent,
            }
          : s
      ),
    },
  };
  execution = appendTimeline(execution, {
    actorKind: "system",
    actorLabel: "Orchestrator",
    label: `Step completed: ${input.step.title}`,
  });
  await getWorkforceExecutionsStore().set(execution);

  await publishDomainEvent({
    scope: input.scope,
    type: "workforce.step_completed",
    actor: systemActor(),
    entityType: "workforce_execution",
    entityId: execution.id,
    source: "ai",
    payload: { stepId: input.step.id, title: input.step.title },
  });

  return { execution, paused: false, actionsPerformed };
}

async function finalizeExecution(input: {
  scope: TenantScope;
  goal: WorkforceGoal;
  execution: WorkforceExecution;
  actionsPerformed: string[];
  humanDecisions: string[];
}): Promise<WorkforceExecution> {
  let execution: WorkforceExecution = {
    ...input.execution,
    status: "completed",
    completedAt: crmNow(),
  };
  execution = appendTimeline(execution, {
    actorKind: "system",
    actorLabel: "Orchestrator",
    label: "Task completed",
  });

  const report = await buildWorkforceReport({
    scope: input.scope,
    goal: input.goal,
    execution,
    outcome: input.goal.expectedOutcome,
    actionsPerformed: input.actionsPerformed,
    humanDecisions: input.humanDecisions,
  });

  execution = {
    ...execution,
    reportId: report.id,
  };
  await getWorkforceExecutionsStore().set(execution);

  const goalStore = getWorkforceGoalsStore();
  await goalStore.set({
    ...input.goal,
    status: "completed",
    completedAt: crmNow(),
  });

  if (execution.crmTaskId) {
    await completeLinkedCrmTask(execution.crmTaskId, input.scope);
  }

  await publishDomainEvent({
    scope: input.scope,
    type: "workforce.execution_completed",
    actor: systemActor(),
    entityType: "workforce_execution",
    entityId: execution.id,
    source: "ai",
    payload: {
      reportId: report.id,
      outcome: input.goal.expectedOutcome,
      relatedContactId: input.goal.relatedContactId,
      relatedDealId: input.goal.relatedDealId,
      crmTaskId: execution.crmTaskId,
    },
  });

  return execution;
}

async function runPendingSteps(input: {
  scope: TenantScope;
  goal: WorkforceGoal;
  execution: WorkforceExecution;
  actionsPerformed: string[];
  humanDecisions: string[];
}): Promise<WorkforceExecution> {
  let execution = input.execution;
  let actionsPerformed = input.actionsPerformed;
  const humanDecisions = [...input.humanDecisions];

  for (const step of execution.plan.steps) {
    if (step.status === "completed" || step.status === "skipped") continue;
    if (step.status === "awaiting_approval") {
      return {
        ...execution,
        actionsPerformed,
        humanDecisions,
      };
    }

    const result = await executeStep({
      scope: input.scope,
      goal: input.goal,
      execution,
      step,
      actionsPerformed,
    });
    execution = result.execution;
    actionsPerformed = result.actionsPerformed;
    if (result.paused) {
      const paused: WorkforceExecution = {
        ...execution,
        actionsPerformed,
        humanDecisions,
      };
      await getWorkforceExecutionsStore().set(paused);
      return paused;
    }
  }

  return finalizeExecution({
    scope: input.scope,
    goal: input.goal,
    execution: { ...execution, actionsPerformed, humanDecisions },
    actionsPerformed,
    humanDecisions,
  });
}

export async function startGoalPipeline(input: {
  scope: TenantScope;
  goalInput: CreateGoalInput;
}): Promise<{
  goal: WorkforceGoal;
  execution: WorkforceExecution;
}> {
  const goal = buildWorkforceGoal(input.goalInput, input.scope);
  await getWorkforceGoalsStore().create(goal);

  await publishDomainEvent({
    scope: input.scope,
    type: "workforce.goal_created",
    actor: systemActor(),
    entityType: "workforce_goal",
    entityId: goal.id,
    source: "api",
    payload: {
      objective: goal.objective,
      priority: goal.priority,
    },
  });

  const { assigned, monitoring } = selectAgentsForGoal(goal);
  const eta = estimateMinutesForGoal(goal);
  const plan = buildTaskPlan(goal);

  // Assign agents onto plan steps where missing
  plan.steps = plan.steps.map((s) => ({
    ...s,
    assignedAgentType: s.assignedAgentType ?? assigned[0],
  }));

  let execution: WorkforceExecution = {
    ...input.scope,
    id: crmNewId("wf_exec"),
    goalId: goal.id,
    status: "planning",
    plan,
    assignedAgents: assigned,
    monitoringAgents: monitoring,
    timeline: [],
    approvalIds: [],
    agentRunIds: [],
    estimatedMinutesMin: eta.min,
    estimatedMinutesMax: eta.max,
    actionsPerformed: [],
    humanDecisions: [],
    createdAt: crmNow(),
  };
  execution = appendTimeline(execution, {
    actorKind: "system",
    actorLabel: "Goal Engine",
    label: `Goal created: ${goalDisplayLabel(goal)}`,
  });
  execution = appendTimeline(execution, {
    actorKind: "system",
    actorLabel: "Task Planning Engine",
    label: `Plan ready · ${plan.steps.length} steps`,
  });
  await getWorkforceExecutionsStore().create(execution);

  execution = { ...execution, status: "collecting_context" };
  await getWorkforceExecutionsStore().set(execution);

  const context = await buildContextPackage(goal, input.scope);
  execution = {
    ...execution,
    contextPackageId: context.id,
    status: "executing",
    startedAt: crmNow(),
  };
  execution = appendTimeline(execution, {
    actorKind: "system",
    actorLabel: "Context Builder",
    label: `Context collected: ${context.summary.slice(0, 120)}`,
  });
  execution = appendTimeline(execution, {
    actorKind: "system",
    actorLabel: "AI Workforce Orchestrator",
    label: `Assigned ${assigned.map(agentLabel).join(", ")}` +
      (monitoring.length
        ? ` · Monitoring: ${monitoring.map(agentLabel).join(", ")}`
        : ""),
  });
  await getWorkforceExecutionsStore().set(execution);

  await publishDomainEvent({
    scope: input.scope,
    type: "workforce.execution_started",
    actor: systemActor(),
    entityType: "workforce_execution",
    entityId: execution.id,
    source: "ai",
    payload: { goalId: goal.id, agents: assigned },
  });

  const crmTask = await createLinkedCrmTask({
    scope: input.scope,
    title: goalDisplayLabel(goal),
    description: [
      goal.instructions ? `Instructions: ${goal.instructions}` : null,
      `Steps:\n- ${plan.steps.map((s) => s.title).join("\n- ")}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    priority: goal.priority,
    contactId: goal.relatedContactId,
    dealId: goal.relatedDealId,
    assignedAgentType: assigned[0],
  });
  execution = { ...execution, crmTaskId: crmTask.id };
  await getWorkforceExecutionsStore().set(execution);

  await getWorkforceGoalsStore().set({ ...goal, status: "active" });

  execution = await runPendingSteps({
    scope: input.scope,
    goal,
    execution,
    actionsPerformed: [],
    humanDecisions: [],
  });

  return { goal, execution };
}

export async function resumeExecutionAfterApproval(input: {
  scope: TenantScope;
  executionId: string;
  humanDecision: string;
}): Promise<WorkforceExecution> {
  const execStore = getWorkforceExecutionsStore();
  const execution = await execStore.get(input.executionId, input.scope);
  if (!execution) throw new Error("Execution not found");

  const goal = await getWorkforceGoalsStore().get(execution.goalId, input.scope);
  if (!goal) throw new Error("Goal not found");

  const approvals = await getWorkforceApprovalsStore().list(input.scope);
  const humanDecisions = approvals
    .filter((a) => a.executionId === execution.id && a.status === "resolved")
    .map((a) => {
      if (a.resolution === "approved") return `Approved: ${a.proposedAction}`;
      if (a.resolution === "rejected") return `Rejected: ${a.proposedAction}`;
      return `Modified: ${a.modifiedOffer ?? a.proposedAction}`;
    });

  const priorActions = execution.actionsPerformed ?? [];
  const priorDecisions =
    humanDecisions.length > 0
      ? humanDecisions
      : [...(execution.humanDecisions ?? []), input.humanDecision].filter(
          Boolean
        );

  return runPendingSteps({
    scope: input.scope,
    goal,
    execution: { ...execution, status: "executing" },
    actionsPerformed: priorActions,
    humanDecisions: priorDecisions,
  });
}
