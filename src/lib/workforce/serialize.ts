import type { AgentAction, AgentRun } from "@/types/workforce";

/** Strip undefined fields so server → client props stay JSON-serializable. */
export function serializeAgentAction(action: AgentAction): AgentAction {
  return {
    id: action.id,
    type: action.type,
    label: action.label,
    payload: action.payload ?? {},
    applied: action.applied ?? false,
    ...(action.appliedAt ? { appliedAt: action.appliedAt } : {}),
  };
}

export function normalizeAgentRun(run: AgentRun): AgentRun {
  return {
    ...run,
    summary: run.summary ?? "",
    recommendations: run.recommendations ?? [],
    actions: (run.actions ?? []).map(serializeAgentAction),
  };
}
