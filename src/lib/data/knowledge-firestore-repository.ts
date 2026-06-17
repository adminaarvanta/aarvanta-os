import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type {
  CreateKnowledgeChunkInput,
  CreateKnowledgeDocumentInput,
  KnowledgeRepository,
} from "@/lib/data/knowledge-repository";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { KnowledgeChunk, KnowledgeDocument } from "@/types/knowledge";

const DOC_COLLECTION = "knowledge_documents";
const CHUNK_COLLECTION = "knowledge_chunks";

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured for production mode.");
  return db;
}

function isFullDocument(
  input: CreateKnowledgeDocumentInput | KnowledgeDocument
): input is KnowledgeDocument {
  return "id" in input && "createdAt" in input;
}

async function listScopedDocs(scope: TenantScope): Promise<KnowledgeDocument[]> {
  const snap = await getDb()
    .collection(DOC_COLLECTION)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as KnowledgeDocument);
}

async function listScopedChunks(scope: TenantScope): Promise<KnowledgeChunk[]> {
  const snap = await getDb()
    .collection(CHUNK_COLLECTION)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs.map((doc) => doc.data() as KnowledgeChunk);
}

export const knowledgeFirestoreRepository: KnowledgeRepository = {
  async listDocuments(scope) {
    const items = await listScopedDocs(scope);
    return items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  },

  async getDocument(id, scope) {
    const snap = await getDb().collection(DOC_COLLECTION).doc(id).get();
    if (!snap.exists) return null;
    const data = snap.data() as KnowledgeDocument;
    return inCrmScope(data, scope) ? data : null;
  },

  async createDocument(input, scope) {
    const now = crmNow();
    const doc: KnowledgeDocument = isFullDocument(input)
      ? input
      : {
          ...scope,
          id: crmNewId("kdoc"),
          ...input,
          tags: input.tags ?? [],
          chunkCount: input.chunkCount ?? 0,
          charCount: input.charCount ?? 0,
          status: input.status ?? "processing",
          createdAt: now,
          updatedAt: now,
        };

    await getDb().collection(DOC_COLLECTION).doc(doc.id).set(doc);
    return doc;
  },

  async updateDocument(id, patch, scope) {
    const existing = await this.getDocument(id, scope);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: crmNow() };
    await getDb().collection(DOC_COLLECTION).doc(id).set(updated);
    return updated;
  },

  async deleteDocument(id, scope) {
    const existing = await this.getDocument(id, scope);
    if (!existing) return false;

    const chunkSnap = await getDb()
      .collection(CHUNK_COLLECTION)
      .where("documentId", "==", id)
      .get();

    const batch = getDb().batch();
    batch.delete(getDb().collection(DOC_COLLECTION).doc(id));
    for (const doc of chunkSnap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    return true;
  },

  async listChunks(scope, documentId) {
    const items = await listScopedChunks(scope);
    return items
      .filter((c) => !documentId || c.documentId === documentId)
      .sort((a, b) => a.index - b.index);
  },

  async replaceChunks(documentId, newChunks, scope) {
    const existing = await getDb()
      .collection(CHUNK_COLLECTION)
      .where("documentId", "==", documentId)
      .get();

    const batch = getDb().batch();
    for (const doc of existing.docs) {
      batch.delete(doc.ref);
    }

    const created: KnowledgeChunk[] = newChunks.map((chunk: CreateKnowledgeChunkInput) => {
      const record: KnowledgeChunk = {
        ...scope,
        id: crmNewId("kchunk"),
        ...chunk,
        createdAt: crmNow(),
      };
      batch.set(getDb().collection(CHUNK_COLLECTION).doc(record.id), record);
      return record;
    });

    await batch.commit();
    return created;
  },
};
