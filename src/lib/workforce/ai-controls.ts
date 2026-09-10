import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import {
  evaluateAiGate,
  resolveAgentControl,
  type AiGateResult,
} from "@/lib/workforce/ai-control-policy";
import type { TenantScope } from "@/types/communication";
import type { AgentAutonomy, AgentRuntimeStatus, AgentType } from "@/types/workforce";

export {
  DEFAULT_AGENT_AUTONOMY,
  HIGH_IMPACT_ACTION_TYPES,
  HIGH_IMPACT_INTENTS,
  autonomyLabel,
  defaultAgentControl,
  evaluateAiGate,
  resolveAgentControl,
  type AiGateResult,
} from "@/lib/workforce/ai-control-policy";

export async function getWorkspaceAiControls(workspaceId: string): Promise<{
  aiPaused: boolean;
  agentControls: Partial<Record<AgentType, import("@/types/workforce").AgentControlState>>;
}> {
  const settings = await getWorkspaceSettings(workspaceId);
  return {
    aiPaused: Boolean(settings.aiPaused),
    agentControls: settings.agentControls ?? {},
  };
}

export async function gateAgentExecution(input: {
  scope: TenantScope;
  agentType?: AgentType;
  highImpact: boolean;
}): Promise<AiGateResult> {
  const controls = await getWorkspaceAiControls(input.scope.workspaceId);
  const control = input.agentType
    ? resolveAgentControl(input.agentType, controls.agentControls)
    : { status: "active" as AgentRuntimeStatus, autonomy: "approval_required" as AgentAutonomy };
  return evaluateAiGate({
    aiPaused: controls.aiPaused,
    control,
    highImpact: input.highImpact,
  });
}
