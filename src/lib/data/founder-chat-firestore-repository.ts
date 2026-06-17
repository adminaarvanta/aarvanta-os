import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type { FounderChatRepository } from "@/lib/data/founder-chat-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { FounderChatMessage } from "@/types/founder";

const COLLECTION = "founder_chat";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

export const founderChatFirestoreRepository: FounderChatRepository = {
  async listMessages(scope, limit = 50) {
    const snap = await getDb()
      .collection(COLLECTION)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .get();
    return snap.docs
      .map((doc) => doc.data() as FounderChatMessage)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(-limit);
  },

  async addMessage(input, scope) {
    const message: FounderChatMessage = {
      ...scope,
      ...input,
      id: crmNewId("founder_chat"),
      createdAt: crmNow(),
    };
    await getDb().collection(COLLECTION).doc(message.id).set(message);
    return message;
  },

  async clearMessages(scope) {
    const snap = await getDb()
      .collection(COLLECTION)
      .where("tenantId", "==", scope.tenantId)
      .where("workspaceId", "==", scope.workspaceId)
      .where("companyId", "==", scope.companyId)
      .get();
    const batch = getDb().batch();
    for (const doc of snap.docs) batch.delete(doc.ref);
    if (!snap.empty) await batch.commit();
  },
};
