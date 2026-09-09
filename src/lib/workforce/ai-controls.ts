import { getWorkspaceSettings } from "@/lib/settings/workspace-settings";
import type { TenantScope } from "@/types/communication";
import type {
  AgentAutonomy,
  AgentControlState,
  AgentRuntimeStatus,
  AgentType,
} from "@/types/workforce";

export const DEFAULT_AGENT_AUTONOMY: Record<AgentType, AgentAutonomy> = {
  ceo: "recommend",
  coo: "recommend",
  sales_manager: "approval_required",
  marketing_manager: "draft",
  hr_manager: "approval_required",
  cfo: "approval_required",
  customer_success_manager: "draft",
};

export const HIGH_IMPACT_ACTION_TYPES = new Set([
  "update_deal",
  "generate_hr_document",
]);

export const HIGH_IMPACT_INTENTS = new Set([
  "run_payroll",
  "post_journal_entry",
  "generate_payslip",
  "hire_employee",
  "generate_hr_document",
  "create_invoice",
  "generate_contract",
]);

export function defaultAgentControl(agentType: AgentType): AgentControlState {
  return {
    status: "active",
    autonomy: DEFAULT_AGENT_AUTONOMY[agentType],
  };
}

export async function getWorkspaceAiControls(workspaceId: string): Promise<{
  aiPaused: boolean;
  agentControls: Partial<Record<AgentType, AgentControlState>>;
}> {
  const settings = await getWorkspaceSettings(workspaceId);
  return {
    aiPaused: Boolean(settings.aiPaused),
    agentControls: settings.agentControls ?? {},
  };
}

export function resolveAgentControl(
  agentType: AgentType,
  stored?: Partial<Record<AgentType, AgentControlState>>
): AgentControlState {
  return stored?.[agentType] ?? defaultAgentControl(agentType);
}

export type AiGateResult =
  | { allowed: true }
  | {
      allowed: false;
      code: "workspace_paused" | "agent_paused" | "approval_required" | "observe_only";
      message: string;
    };

export function evaluateAiGate(input: {
  aiPaused: boolean;
  control: AgentControlState;
  highImpact: boolean;
}): AiGateResult {
  if (input.aiPaused) {
    return {
      allowed: false,
      code: "workspace_paused",
      message: "AI is paused for this workspace. Scheduled and external actions are stopped.",
    };
  }
  if (input.control.status === "paused") {
    return {
      allowed: false,
      code: "agent_paused",
      message: "This agent is paused.",
    };
  }
  if (input.control.autonomy === "observe") {
    return {
      allowed: false,
      code: "observe_only",
      message: "This agent may observe only. It cannot change records.",
    };
  }
  if (
    input.highImpact &&
    input.control.autonomy !== "automatic"
  ) {
    return {
      allowed: false,
      code: "approval_required",
      message: "This high-impact action needs explicit approval before it can run.",
    };
  }
  if (input.control.autonomy === "approval_required" && input.highImpact) {
    return {
      allowed: false,
      code: "approval_required",
      message: "Approval is required before this agent can execute.",
    };
  }
  return { allowed: true };
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

export function autonomyLabel(value: AgentAutonomy): string {
  switch (value) {
    case "observe":
      return "Observe";
    case "recommend":
      return "Recommend";
    case "draft":
      return "Draft";
    case "approval_required":
      return "Approval required";
    case "automatic":
      return "Automatic";
  }
}
