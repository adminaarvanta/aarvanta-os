import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import type { AgentChatRepository } from "@/lib/data/agent-chat-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { AgentChatMessage } from "@/types/workforce";

const COLLECTION = "ai_agent_chat";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

async function listScoped(scope: TenantScope): Promise<AgentChatMessage[]> {
  const snap = await getDb()
    .collection(COLLECTION)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as AgentChatMessage);
}

export const agentChatFirestoreRepository: AgentChatRepository = {
  async listMessages(scope, agentType, limit = 100) {
    const items = (await listScoped(scope))
      .filter((m) => m.agentType === agentType)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    return items.slice(-limit);
  },

  async addMessage(input, scope) {
    const message: AgentChatMessage = {
      ...scope,
      ...input,
      id: crmNewId("agent_chat"),
      createdAt: crmNow(),
    };
    await getDb().collection(COLLECTION).doc(message.id).set(message);
    return message;
  },

  async clearMessages(scope, agentType) {
    const items = (await listScoped(scope)).filter(
      (m) => m.agentType === agentType
    );
    const batch = getDb().batch();
    for (const item of items) {
      batch.delete(getDb().collection(COLLECTION).doc(item.id));
    }
    if (items.length > 0) await batch.commit();
  },
};
