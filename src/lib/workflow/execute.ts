import { getCrmRepository } from "@/lib/data/crm-store";
import { getWorkflowRepository } from "@/lib/data/workflow-store";
import { executeAgentRun } from "@/lib/workforce/run-agent";
import { buildWorkforceContext } from "@/lib/workforce/context";
import { crmNow } from "@/lib/data/crm-helpers";
import type { TenantScope } from "@/types/communication";
import type {
  ActionStepConfig,
  AgentStepConfig,
  ApprovalStepConfig,
  ConditionStepConfig,
  Workflow,
  WorkflowRun,
  WorkflowRunContext,
  WorkflowStepLog,
} from "@/types/workflow";
import type { AgentType } from "@/types/workforce";
import { isAgentType } from "@/lib/workforce/agents";

function evaluateCondition(
  config: ConditionStepConfig,
  context: WorkflowRunContext
): boolean {
  const raw =
    config.field === "leadScore"
      ? context.leadScore ?? 0
      : context.dealValue ?? 0;

  switch (config.operator) {
    case "gte":
      return raw >= config.value;
    case "lte":
      return raw <= config.value;
    case "eq":
      return raw === config.value;
    default:
      return false;
  }
}

async function executeActionStep(
  config: ActionStepConfig,
  scope: TenantScope,
  context: WorkflowRunContext
): Promise<string> {
  const crm = getCrmRepository();

  if (config.actionType === "create_task") {
    const task = await crm.createTask(
      {
        title: config.title ?? "Workflow task",
        description: config.description,
        priority: config.priority ?? "medium",
        contactId: context.contactId,
        source: "ai",
      },
      scope
    );
    return `Task created: ${task.title}`;
  }

  if (config.actionType === "create_activity") {
    const activity = await crm.createActivity(
      {
        type: config.activityType ?? "note",
        title: config.title ?? "Workflow activity",
        description: config.description,
        contactId: context.contactId,
        authorName: "Workflow Engine",
      },
      scope
    );
    return `Activity logged: ${activity.title}`;
  }

  return config.alertMessage ?? "Alert recorded.";
}

async function executeAgentStep(
  config: AgentStepConfig,
  scope: TenantScope,
  context: WorkflowRunContext
): Promise<string> {
  if (!isAgentType(config.agentType)) {
    throw new Error(`Invalid agent type: ${config.agentType}`);
  }

  const agentType = config.agentType as AgentType;
  const workforceContext = await buildWorkforceContext(scope, {
    contactId: context.contactId,
  });

  const result = await executeAgentRun({ agentType, context: workforceContext });
  return result.summary;
}

export async function enrichRunContext(
  scope: TenantScope,
  context: WorkflowRunContext
): Promise<WorkflowRunContext> {
  const enriched = { ...context };
  const crm = getCrmRepository();

  if (context.contactId && enriched.leadScore === undefined) {
    const contact = await crm.getContact(context.contactId, scope);
    if (contact) {
      enriched.contactName = `${contact.firstName} ${contact.lastName}`.trim();
      enriched.leadScore = contact.leadScore;
    }
  }

  if (context.dealId && enriched.dealValue === undefined) {
    const deal = await crm.getDeal(context.dealId, scope);
    if (deal) enriched.dealValue = deal.value;
  }

  return enriched;
}

export async function executeWorkflowRun(
  workflow: Workflow,
  run: WorkflowRun,
  scope: TenantScope,
  startIndex = 0
): Promise<WorkflowRun> {
  const repo = getWorkflowRepository();
  const context = await enrichRunContext(scope, run.context);
  const logs: WorkflowStepLog[] = [...run.stepLogs];

  for (let i = startIndex; i < workflow.steps.length; i += 1) {
    const step = workflow.steps[i]!;
    const at = crmNow();

    try {
      if (step.type === "condition") {
        const config = step.config as unknown as ConditionStepConfig;
        const pass = evaluateCondition(config, context);
        logs.push({
          stepId: step.id,
          stepLabel: step.label,
          stepType: step.type,
          status: pass ? "completed" : "skipped",
          output: pass ? "Condition met — continuing." : "Condition not met — skipping remaining steps.",
          at,
        });

        if (!pass) {
          return (
            (await repo.updateRun(
              run.id,
              {
                status: "completed",
                stepLogs: logs,
                context,
                completedAt: crmNow(),
                pendingApproval: undefined,
              },
              scope
            )) ?? run
          );
        }
        continue;
      }

      if (step.type === "delay") {
        logs.push({
          stepId: step.id,
          stepLabel: step.label,
          stepType: step.type,
          status: "completed",
          output: "Delay simulated (instant in demo).",
          at,
        });
        continue;
      }

      if (step.type === "agent") {
        const output = await executeAgentStep(
          step.config as unknown as AgentStepConfig,
          scope,
          context
        );
        logs.push({
          stepId: step.id,
          stepLabel: step.label,
          stepType: step.type,
          status: "completed",
          output,
          at,
        });
        continue;
      }

      if (step.type === "approval") {
        const config = step.config as unknown as ApprovalStepConfig;
        logs.push({
          stepId: step.id,
          stepLabel: step.label,
          stepType: step.type,
          status: "pending",
          output: "Awaiting human approval.",
          at,
        });

        return (
          (await repo.updateRun(
            run.id,
            {
              status: "awaiting_approval",
              stepLogs: logs,
              context,
              pendingApproval: {
                stepId: step.id,
                stepLabel: step.label,
                message: config.message,
              },
            },
            scope
          )) ?? run
        );
      }

      if (step.type === "action") {
        const output = await executeActionStep(
          step.config as unknown as ActionStepConfig,
          scope,
          context
        );
        logs.push({
          stepId: step.id,
          stepLabel: step.label,
          stepType: step.type,
          status: "completed",
          output,
          at,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Step failed";
      logs.push({
        stepId: step.id,
        stepLabel: step.label,
        stepType: step.type,
        status: "failed",
        output: message,
        at,
      });

      return (
        (await repo.updateRun(
          run.id,
          {
            status: "failed",
            stepLogs: logs,
            error: message,
            completedAt: crmNow(),
          },
          scope
        )) ?? run
      );
    }
  }

  return (
    (await repo.updateRun(
      run.id,
      {
        status: "completed",
        stepLogs: logs,
        context,
        completedAt: crmNow(),
        pendingApproval: undefined,
      },
      scope
    )) ?? run
  );
}

export async function startWorkflowRun(
  scope: TenantScope,
  workflow: Workflow,
  context: WorkflowRunContext = {}
): Promise<WorkflowRun> {
  const repo = getWorkflowRepository();
  const enriched = await enrichRunContext(scope, context);

  const run = await repo.createRun(
    {
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: "running",
      trigger: "manual",
      context: enriched,
      stepLogs: [],
    },
    scope
  );

  return executeWorkflowRun(workflow, run, scope);
}

export async function approveWorkflowRun(
  scope: TenantScope,
  runId: string
): Promise<WorkflowRun | null> {
  const repo = getWorkflowRepository();
  const run = await repo.getRun(runId, scope);
  if (!run || run.status !== "awaiting_approval" || !run.pendingApproval) {
    return null;
  }

  const workflow = await repo.getWorkflow(run.workflowId, scope);
  if (!workflow) return null;

  const approvalIndex = workflow.steps.findIndex(
    (s) => s.id === run.pendingApproval!.stepId
  );
  if (approvalIndex === -1) return null;

  const logs = run.stepLogs.map((log) =>
    log.stepId === run.pendingApproval!.stepId && log.status === "pending"
      ? {
          ...log,
          status: "completed" as const,
          output: "Approved by user.",
          at: crmNow(),
        }
      : log
  );

  const resumed: WorkflowRun = {
    ...run,
    status: "running",
    stepLogs: logs,
    pendingApproval: undefined,
  };

  await repo.updateRun(runId, {
    status: "running",
    stepLogs: logs,
    pendingApproval: undefined,
  }, scope);

  return executeWorkflowRun(workflow, resumed, scope, approvalIndex + 1);
}

export function defaultDemoContext(templateId?: string): WorkflowRunContext {
  if (templateId === "proposal_approval") {
    return {
      contactId: "contact_sarah",
      dealId: "deal_meridian",
      contactName: "Sarah Chen",
      leadScore: 82,
      dealValue: 48000,
    };
  }
  if (templateId === "lead_nurturing") {
    return {
      contactId: "contact_sarah",
      contactName: "Sarah Chen",
      leadScore: 82,
    };
  }
  return {
    contactId: "contact_james",
    contactName: "James Okonkwo",
    leadScore: 91,
  };
}
