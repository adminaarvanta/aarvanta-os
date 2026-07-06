import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import type { IntegrationRepository } from "@/lib/data/integration-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { IntegrationConnection } from "@/types/integration";

const COLLECTION = "integrations";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

export const integrationFirestoreRepository: IntegrationRepository = {
  async listConnections(tenantId, workspaceId) {
    const snap = await getDb()
      .collection(COLLECTION)
      .where("tenantId", "==", tenantId)
      .where("workspaceId", "==", workspaceId)
      .get();
    return snap.docs.map((doc) => doc.data() as IntegrationConnection);
  },

  async getConnection(tenantId, workspaceId, provider) {
    const snap = await getDb()
      .collection(COLLECTION)
      .where("tenantId", "==", tenantId)
      .where("workspaceId", "==", workspaceId)
      .where("provider", "==", provider)
      .limit(1)
      .get();
    return snap.empty ? null : (snap.docs[0].data() as IntegrationConnection);
  },

  async connect(tenantId, workspaceId, provider, accountLabel) {
    const existing = await this.getConnection(tenantId, workspaceId, provider);
    const now = crmNow();
    if (existing) {
      const updated = {
        ...existing,
        status: "connected" as const,
        accountLabel: accountLabel ?? existing.accountLabel,
        connectedAt: now,
        lastSyncAt: now,
      };
      await getDb().collection(COLLECTION).doc(existing.id).set(updated);
      return updated;
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
    await getDb().collection(COLLECTION).doc(conn.id).set(conn);
    return conn;
  },

  async disconnect(tenantId, workspaceId, provider) {
    const existing = await this.getConnection(tenantId, workspaceId, provider);
    if (!existing) return null;
    const updated = {
      ...existing,
      status: "disconnected" as const,
      disconnectedAt: crmNow(),
    };
    await getDb().collection(COLLECTION).doc(existing.id).set(updated);
    return updated;
  },

  async sync(tenantId, workspaceId, provider) {
    const existing = await this.getConnection(tenantId, workspaceId, provider);
    if (!existing || existing.status !== "connected") return null;
    const updated = { ...existing, lastSyncAt: crmNow() };
    await getDb().collection(COLLECTION).doc(existing.id).set(updated);
    return updated;
  },
};
