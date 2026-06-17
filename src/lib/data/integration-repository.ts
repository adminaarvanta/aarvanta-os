import type { IntegrationConnection, IntegrationProvider } from "@/types/integration";

export interface IntegrationRepository {
  listConnections(tenantId: string, workspaceId: string): Promise<IntegrationConnection[]>;
  getConnection(
    tenantId: string,
    workspaceId: string,
    provider: IntegrationProvider
  ): Promise<IntegrationConnection | null>;
  connect(
    tenantId: string,
    workspaceId: string,
    provider: IntegrationProvider,
    accountLabel?: string
  ): Promise<IntegrationConnection>;
  disconnect(
    tenantId: string,
    workspaceId: string,
    provider: IntegrationProvider
  ): Promise<IntegrationConnection | null>;
  sync(
    tenantId: string,
    workspaceId: string,
    provider: IntegrationProvider
  ): Promise<IntegrationConnection | null>;
}
