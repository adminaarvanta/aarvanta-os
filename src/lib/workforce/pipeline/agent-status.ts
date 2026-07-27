import { getWorkforceExecutionsStore } from "@/lib/data/workforce-pipeline-store";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { AGENT_DEFINITIONS } from "@/lib/workforce/agents";
import type { TenantScope } from "@/types/communication";
import type {
  AgentLiveStatus,
  AgentOperationalStatus,
  AgentPerformance,
  AgentType,
  WorkforceExecutionStatus,
} from "@/types/workforce";

const OPEN_STATUSES: WorkforceExecutionStatus[] = [
  "created",
  "planning",
  "collecting_context",
  "executing",
  "awaiting_approval",
];

export async function getAgentStatuses(
  scope: TenantScope
): Promise<AgentOperationalStatus[]> {
  const [executions, runs] = await Promise.all([
    getWorkforceExecutionsStore().list(scope),
    getWorkforceRepository().listRuns(scope, { limit: 100 }),
  ]);

  return AGENT_DEFINITIONS.map((agent) => {
    const openExecutionIds = executions
      .filter(
        (e) =>
          OPEN_STATUSES.includes(e.status) &&
          (e.assignedAgents.includes(agent.type) ||
            e.plan.steps.some(
              (s) =>
                s.assignedAgentType === agent.type &&
                (s.status === "in_progress" || s.status === "awaiting_approval")
            ))
      )
      .map((e) => e.id);

    const agentRuns = runs.filter((r) => r.agentType === agent.type);
    const lastRunAt = agentRuns[0]?.createdAt;

    let status: AgentLiveStatus = "waiting";
    if (openExecutionIds.length > 0) status = "working";
    else if (!lastRunAt && openExecutionIds.length === 0) status = "waiting";

    return {
      agentType: agent.type,
      status,
      openExecutionIds,
      lastRunAt,
    };
  });
}

export async function getAgentPerformance(
  scope: TenantScope
): Promise<AgentPerformance[]> {
  const runs = await getWorkforceRepository().listRuns(scope, { limit: 200 });
  const executions = await getWorkforceExecutionsStore().list(scope);

  return AGENT_DEFINITIONS.map((agent) => {
    const agentRuns = runs.filter((r) => r.agentType === agent.type);
    const completedRuns = agentRuns.filter((r) => r.status === "completed").length;
    const failedRuns = agentRuns.filter((r) => r.status === "failed").length;
    const finished = completedRuns + failedRuns;
    const successRate = finished === 0 ? 0.85 : completedRuns / finished;

    const durations = agentRuns
      .filter((r) => r.completedAt)
      .map(
        (r) =>
          new Date(r.completedAt!).getTime() - new Date(r.createdAt).getTime()
      );
    const avgDurationMs =
      durations.length === 0
        ? 45_000
        : durations.reduce((a, b) => a + b, 0) / durations.length;

    const relatedExecs = executions.filter((e) =>
      e.assignedAgents.includes(agent.type)
    );
    const execSuccess =
      relatedExecs.length === 0
        ? 0.88
        : relatedExecs.filter((e) => e.status === "completed").length /
          Math.max(1, relatedExecs.length);

    const efficiency = Math.round(
      Math.min(98, Math.max(55, (successRate * 0.6 + execSuccess * 0.4) * 100))
    );

    return {
      agentType: agent.type as AgentType,
      completedRuns,
      failedRuns,
      successRate,
      avgDurationMs,
      efficiency,
    };
  });
}

export async function getDirectoryAgentCards(scope: TenantScope) {
  const [statuses, performance] = await Promise.all([
    getAgentStatuses(scope),
    getAgentPerformance(scope),
  ]);

  return AGENT_DEFINITIONS.map((agent) => {
    const status = statuses.find((s) => s.agentType === agent.type)!;
    const perf = performance.find((p) => p.agentType === agent.type)!;
    return { agent, status, performance: perf };
  });
}
