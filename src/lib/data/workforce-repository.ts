import type { TenantScope } from "@/types/communication";
import type { AgentRun, AgentType } from "@/types/workforce";

export interface WorkforceRepository {
  listRuns(
    scope: TenantScope,
    filters?: { agentType?: AgentType; limit?: number }
  ): Promise<AgentRun[]>;
  getRun(id: string, scope: TenantScope): Promise<AgentRun | null>;
  createRun(
    input: Omit<AgentRun, keyof TenantScope | "id" | "createdAt">,
    scope: TenantScope
  ): Promise<AgentRun>;
  updateRun(
    id: string,
    patch: Partial<
      Pick<
        AgentRun,
        | "status"
        | "summary"
        | "recommendations"
        | "actions"
        | "error"
        | "completedAt"
        | "inputSummary"
      >
    >,
    scope: TenantScope
  ): Promise<AgentRun | null>;
}
