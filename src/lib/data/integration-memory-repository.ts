import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { buildDemoIntegrations } from "@/lib/data/integration-demo-seed";
import type { IntegrationRepository } from "@/lib/data/integration-repository";
import type { IntegrationConnection, IntegrationProvider } from "@/types/integration";

let connections = buildDemoIntegrations();

function find(provider: IntegrationProvider, tenantId: string, workspaceId: string) {
  return connections.find(
    (c) =>
      c.provider === provider &&
      c.tenantId === tenantId &&
      c.workspaceId === workspaceId
  );
}

export const integrationMemoryRepository: IntegrationRepository = {
  async listConnections(tenantId, workspaceId) {
    return connections.filter(
      (c) => c.tenantId === tenantId && c.workspaceId === workspaceId
    );
  },

  async getConnection(tenantId, workspaceId, provider) {
    return find(provider, tenantId, workspaceId) ?? null;
  },

  async connect(tenantId, workspaceId, provider, accountLabel) {
    const existing = find(provider, tenantId, workspaceId);
    const now = crmNow();
    if (existing) {
      existing.status = "connected";
      existing.accountLabel = accountLabel ?? existing.accountLabel ?? "Connected account";
      existing.connectedAt = now;
      existing.lastSyncAt = now;
      existing.disconnectedAt = undefined;
      existing.lastSyncError = undefined;
      return existing;
    }
    const conn: IntegrationConnection = {
      id: crmNewId("int"),
      tenantId,
      workspaceId,
      provider,
      status: "connected",
      accountLabel: accountLabel ?? "Connected account",
      connectedAt: now,
      lastSyncAt: now,
    };
    connections.push(conn);
    return conn;
  },

  async disconnect(tenantId, workspaceId, provider) {
    const existing = find(provider, tenantId, workspaceId);
    if (!existing) return null;
    existing.status = "disconnected";
    existing.disconnectedAt = crmNow();
    return existing;
  },

  async sync(tenantId, workspaceId, provider) {
    const existing = find(provider, tenantId, workspaceId);
    if (!existing || existing.status !== "connected") return null;
    existing.status = "syncing";
    existing.lastSyncAt = crmNow();
    existing.status = "connected";
    return existing;
  },
};

export function resetIntegrationMemory() {
  connections = buildDemoIntegrations();
}
