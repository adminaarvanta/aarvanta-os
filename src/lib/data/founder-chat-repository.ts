import type { TenantScope } from "@/types/communication";
import type { FounderChatMessage } from "@/types/founder";

export interface FounderChatRepository {
  listMessages(scope: TenantScope, limit?: number): Promise<FounderChatMessage[]>;
  addMessage(
    input: Omit<FounderChatMessage, keyof TenantScope | "id" | "createdAt">,
    scope: TenantScope
  ): Promise<FounderChatMessage>;
  clearMessages(scope: TenantScope): Promise<void>;
}
