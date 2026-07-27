import { getWorkforceReportsStore } from "@/lib/data/workforce-pipeline-store";
import { goalDisplayLabel } from "@/lib/workforce/pipeline/goal-engine";
import type { TenantScope } from "@/types/communication";
import type {
  WorkforceExecution,
  WorkforceGoal,
  WorkforceReport,
} from "@/types/workforce";

export async function buildWorkforceReport(input: {
  scope: TenantScope;
  goal: WorkforceGoal;
  execution: WorkforceExecution;
  outcome: string;
  actionsPerformed: string[];
  humanDecisions: string[];
}): Promise<WorkforceReport> {
  const started = input.execution.startedAt
    ? new Date(input.execution.startedAt).getTime()
    : new Date(input.execution.createdAt).getTime();
  const ended = input.execution.completedAt
    ? new Date(input.execution.completedAt).getTime()
    : Date.now();
  const totalMinutes = Math.max(1, Math.round((ended - started) / 60000));

  const messagesSent = input.actionsPerformed.filter((a) =>
    /whatsapp|message|outreach|follow-up/i.test(a)
  ).length;
  const callsMade = input.actionsPerformed.filter((a) =>
    /voice|call/i.test(a)
  ).length;
  const documentsGenerated = input.actionsPerformed.filter((a) =>
    /proposal|document|report/i.test(a)
  ).length;

  const suggestions = [
    ...input.execution.plan.steps
      .filter((s) => s.resultSummary)
      .slice(0, 2)
      .map((s) => s.resultSummary!),
    "Review the timeline and confirm next human touchpoint.",
  ].slice(0, 4);

  return getWorkforceReportsStore().create({
    ...input.scope,
    executionId: input.execution.id,
    goalId: input.goal.id,
    objectiveLabel: goalDisplayLabel(input.goal),
    outcome: input.outcome,
    agentsInvolved: [
      ...new Set([
        ...input.execution.assignedAgents,
        ...input.execution.monitoringAgents,
      ]),
    ],
    actionsPerformed: input.actionsPerformed,
    messagesSent,
    callsMade,
    documentsGenerated,
    humanDecisions: input.humanDecisions,
    suggestions,
    learning: [
      "Successful step patterns stored for future similar goals.",
      input.goal.instructions
        ? `Honoured instructions: ${input.goal.instructions.slice(0, 120)}`
        : "No special instructions were provided.",
    ],
    totalMinutes,
    createdAt: new Date().toISOString(),
  });
}
