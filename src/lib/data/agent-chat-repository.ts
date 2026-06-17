import type { TenantScope } from "@/types/communication";
import type { AgentChatMessage, AgentType } from "@/types/workforce";

export interface AgentChatRepository {
  listMessages(
    scope: TenantScope,
    agentType: AgentType,
    limit?: number
  ): Promise<AgentChatMessage[]>;
  addMessage(
    input: Omit<AgentChatMessage, keyof TenantScope | "id" | "createdAt">,
    scope: TenantScope
  ): Promise<AgentChatMessage>;
  clearMessages(scope: TenantScope, agentType: AgentType): Promise<void>;
}
