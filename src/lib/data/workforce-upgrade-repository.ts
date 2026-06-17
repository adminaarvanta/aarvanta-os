import type { TenantScope } from "@/types/communication";
import type {
  AgentCollaboration,
  AgentType,
  SharedMemoryEntry,
} from "@/types/workforce";

export interface WorkforceUpgradeRepository {
  listSharedMemory(scope: TenantScope): Promise<SharedMemoryEntry[]>;
  createSharedMemory(
    input: Omit<
      SharedMemoryEntry,
      keyof TenantScope | "id" | "createdAt" | "updatedAt"
    >,
    scope: TenantScope
  ): Promise<SharedMemoryEntry>;
  listCollaborations(scope: TenantScope): Promise<AgentCollaboration[]>;
  createCollaboration(
    input: Omit<
      AgentCollaboration,
      keyof TenantScope | "id" | "createdAt" | "status"
    > & { status?: AgentCollaboration["status"] },
    scope: TenantScope
  ): Promise<AgentCollaboration>;
}

export type CollaborateInput = {
  title: string;
  leadAgent: AgentType;
  participantAgents: AgentType[];
};
