import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { buildDemoIntegrations } from "@/lib/data/integration-demo-seed";
import type { IntegrationRepository } from "@/lib/data/integration-repository";
import type { IntegrationConnection, IntegrationProvider } from "@/types/integration";

let connections = buildDemoIntegrations();

function matchesScope(
  c: IntegrationConnection,
  provider: IntegrationProvider,
  tenantId: string,
  workspaceId: string
) {
  return (
    c.provider === provider &&
    c.tenantId === tenantId &&
    c.workspaceId === workspaceId
  );
}

function find(
  provider: IntegrationProvider,
  tenantId: string,
  workspaceId: string,
  userId?: string
) {
  const matches = connections.filter((c) =>
    matchesScope(c, provider, tenantId, workspaceId)
  );
  if (userId) {
    return (
      matches.find((c) => c.userId === userId) ??
      (provider === "google_calendar"
        ? undefined
        : matches.find((c) => !c.userId))
    );
  }
  return matches.find((c) => !c.userId) ?? matches[0];
}

export const integrationMemoryRepository: IntegrationRepository = {
  async listConnections(tenantId, workspaceId) {
    return connections.filter(
      (c) => c.tenantId === tenantId && c.workspaceId === workspaceId
    );
  },

  async getConnection(tenantId, workspaceId, provider, userId) {
    return find(provider, tenantId, workspaceId, userId) ?? null;
  },

  async connect(tenantId, workspaceId, provider, accountLabel, userId) {
    const existing = find(provider, tenantId, workspaceId, userId);
    const now = crmNow();
    if (existing) {
      existing.status = "connected";
      existing.accountLabel = accountLabel ?? existing.accountLabel ?? "Connected account";
      existing.connectedAt = now;
      existing.lastSyncAt = now;
      existing.disconnectedAt = undefined;
      existing.lastSyncError = undefined;
      if (userId) existing.userId = userId;
      return existing;
    }
    const conn: IntegrationConnection = {
      id: crmNewId("int"),
      tenantId,
      workspaceId,
      userId,
      provider,
      status: "connected",
      accountLabel: accountLabel ?? "Connected account",
      connectedAt: now,
      lastSyncAt: now,
    };
    connections.push(conn);
    return conn;
  },

  async disconnect(tenantId, workspaceId, provider, userId) {
    const existing = find(provider, tenantId, workspaceId, userId);
    if (!existing) return null;
    existing.status = "disconnected";
    existing.disconnectedAt = crmNow();
    existing.metadata = undefined;
    existing.lastSyncError = undefined;
    return existing;
  },

  async sync(tenantId, workspaceId, provider, userId) {
    const existing = find(provider, tenantId, workspaceId, userId);
    if (!existing || existing.status !== "connected") return null;
    existing.status = "syncing";
    existing.lastSyncAt = crmNow();
    existing.lastSyncError = undefined;
    existing.status = "connected";
    return existing;
  },
};

export function resetIntegrationMemory() {
  connections = buildDemoIntegrations();
}
