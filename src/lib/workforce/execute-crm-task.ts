import { applyAgentAction } from "@/lib/workforce/apply-action";
import { getAgentDefinition, isAgentType } from "@/lib/workforce/agents";
import { buildWorkforceContext } from "@/lib/workforce/context";
import { executeAgentRun } from "@/lib/workforce/run-agent";
import { saveRunToAgentMemory } from "@/lib/workforce/save-run-memory";
import { getCrmRepository } from "@/lib/data/crm-store";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { crmNow } from "@/lib/data/crm-helpers";
import { publishDomainEvent } from "@/lib/events/publish";
import { aiAgentActor } from "@/lib/identity/from-session";
import type { TenantScope } from "@/types/communication";
import type { AgentAction, AgentRun, AgentType } from "@/types/workforce";
import type { CrmTask } from "@/types/crm";

/** Actions safe to auto-apply while completing an assigned CRM task. */
const AUTO_APPLY_TYPES = new Set([
  "create_activity",
  "update_deal",
  "alert",
  "suggest_reply",
  "generate_hr_document",
]);

export type ExecuteCrmTaskResult = {
  task: CrmTask;
  run: AgentRun;
  applied: Array<{ actionId: string; message: string }>;
  skipped: Array<{ actionId: string; reason: string }>;
};

export async function executeCrmTaskForAgent(input: {
  taskId: string;
  scope: TenantScope;
  agentType?: AgentType;
  /** When true, create_task follow-ups are also auto-applied (as human/AI tasks). */
  applyFollowUpTasks?: boolean;
}): Promise<ExecuteCrmTaskResult> {
  const crm = getCrmRepository();
  const workforce = getWorkforceRepository();

  const task = await crm.getTask(input.taskId, input.scope);
  if (!task) {
    throw new Error("Task not found");
  }
  if (task.status === "done") {
    throw new Error("Task is already completed");
  }

  const agentTypeRaw = input.agentType ?? task.assignedAgentType;
  if (!agentTypeRaw || !isAgentType(agentTypeRaw)) {
    throw new Error(
      "Task is not assigned to an AI agent. Set assignedAgentType first."
    );
  }
  const agentType = agentTypeRaw;

  await crm.updateTask(
    task.id,
    { status: "in_progress", assignedAgentType: agentType },
    input.scope
  );

  const run = await workforce.createRun(
    {
      agentType,
      status: "running",
      trigger: "task",
      contactId: task.contactId,
      taskId: task.id,
      summary: "",
      recommendations: [],
      actions: [],
      inputSummary: `CRM task: ${task.title}`,
    },
    input.scope
  );

  try {
    const context = await buildWorkforceContext(input.scope, {
      contactId: task.contactId,
      taskId: task.id,
    });

    const result = await executeAgentRun({
      agentType,
      context,
      mode: "execute_task",
    });

    const actions: AgentAction[] = result.actions.map((a) => ({ ...a }));
    const applied: ExecuteCrmTaskResult["applied"] = [];
    const skipped: ExecuteCrmTaskResult["skipped"] = [];

    for (const action of actions) {
      const shouldApply =
        AUTO_APPLY_TYPES.has(action.type) ||
        (input.applyFollowUpTasks && action.type === "create_task");

      if (!shouldApply) {
        skipped.push({
          actionId: action.id,
          reason:
            action.type === "create_task"
              ? "Follow-up tasks need manual apply from the run"
              : "Not auto-applied",
        });
        continue;
      }

      // Avoid recreating the same task title as a follow-up.
      if (action.type === "create_task") {
        const title = String(action.payload.title ?? "").trim().toLowerCase();
        if (title && title === task.title.trim().toLowerCase()) {
          skipped.push({
            actionId: action.id,
            reason: "Skipped duplicate of the assigned task",
          });
          continue;
        }
      }

      try {
        const applyResult = await applyAgentAction(action, input.scope, {
          agentType,
          runId: run.id,
        });
        action.applied = true;
        action.appliedAt = crmNow();
        applied.push({ actionId: action.id, message: applyResult.message });
      } catch (error) {
        skipped.push({
          actionId: action.id,
          reason: error instanceof Error ? error.message : "Apply failed",
        });
      }
    }

    // Always log a completion activity if none was applied.
    if (!applied.some((a) => a.message.toLowerCase().includes("activity"))) {
      try {
        await crm.createActivity(
          {
            type: "note",
            title: `AI completed: ${task.title}`,
            description: result.summary,
            contactId: task.contactId,
            accountId: task.accountId,
            dealId: task.dealId,
            authorName: "AI Workforce",
          },
          input.scope
        );
      } catch {
        // non-fatal
      }
    }

    const completedRun = await workforce.updateRun(
      run.id,
      {
        status: "completed",
        summary: result.summary,
        recommendations: result.recommendations,
        actions,
        completedAt: crmNow(),
      },
      input.scope
    );

    const completedTask = await crm.updateTask(
      task.id,
      {
        status: "done",
        agentRunId: run.id,
        assignedAgentType: agentType,
      },
      input.scope
    );

    if (completedRun) {
      await saveRunToAgentMemory(completedRun, input.scope);
    }

    await publishDomainEvent({
      scope: input.scope,
      type: "task.completed",
      actor: aiAgentActor(agentType, getAgentDefinition(agentType).name),
      entityType: "task",
      entityId: task.id,
      payload: { runId: run.id, agentType, source: "workforce_execute" },
      source: "ai",
    });

    return {
      task: completedTask ?? { ...task, status: "done", agentRunId: run.id },
      run: completedRun ?? run,
      applied,
      skipped,
    };
  } catch (error) {
    await workforce.updateRun(
      run.id,
      {
        status: "failed",
        error: error instanceof Error ? error.message : "Task execution failed",
        completedAt: crmNow(),
      },
      input.scope
    );
    // Leave task in_progress so it can be retried.
    throw error;
  }
}

export async function processAgentCrmTasks(input: {
  scope: TenantScope;
  agentType?: AgentType;
  limit?: number;
}): Promise<{
  processed: ExecuteCrmTaskResult[];
  failed: Array<{ taskId: string; error: string }>;
}> {
  const crm = getCrmRepository();
  const open = (await crm.listTasks(input.scope)).filter((t) => {
    if (t.status === "done") return false;
    if (!t.assignedAgentType || !isAgentType(t.assignedAgentType)) return false;
    if (input.agentType && t.assignedAgentType !== input.agentType) return false;
    return true;
  });

  const queue = open
    .sort((a, b) => {
      const priorityRank = { high: 0, medium: 1, low: 2 } as const;
      const pa = priorityRank[a.priority] ?? 1;
      const pb = priorityRank[b.priority] ?? 1;
      if (pa !== pb) return pa - pb;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, input.limit ?? 5);

  const processed: ExecuteCrmTaskResult[] = [];
  const failed: Array<{ taskId: string; error: string }> = [];

  for (const task of queue) {
    try {
      const result = await executeCrmTaskForAgent({
        taskId: task.id,
        scope: input.scope,
        agentType: task.assignedAgentType as AgentType,
      });
      processed.push(result);
    } catch (error) {
      failed.push({
        taskId: task.id,
        error: error instanceof Error ? error.message : "Failed",
      });
    }
  }

  return { processed, failed };
}
