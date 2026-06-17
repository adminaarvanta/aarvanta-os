import { crmNewId, crmNow, inCrmScope } from "@/lib/data/crm-helpers";
import type {
  CreateKnowledgeChunkInput,
  CreateKnowledgeDocumentInput,
  KnowledgeRepository,
} from "@/lib/data/knowledge-repository";
import { buildDemoKnowledgeSeed } from "@/lib/data/knowledge-demo-seed";
import type { TenantScope } from "@/types/communication";
import type { KnowledgeChunk, KnowledgeDocument } from "@/types/knowledge";

const seed = buildDemoKnowledgeSeed();
let documents: KnowledgeDocument[] = seed.documents;
let chunks: KnowledgeChunk[] = seed.chunks;

function isFullDocument(
  input: CreateKnowledgeDocumentInput | KnowledgeDocument
): input is KnowledgeDocument {
  return "id" in input && "createdAt" in input;
}

export const knowledgeMemoryRepository: KnowledgeRepository = {
  async listDocuments(scope) {
    return documents
      .filter((d) => inCrmScope(d, scope))
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  },

  async getDocument(id, scope) {
    const doc = documents.find((d) => d.id === id);
    return doc && inCrmScope(doc, scope) ? doc : null;
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

    if (!isFullDocument(input)) {
      documents.unshift(doc);
    } else if (!documents.some((d) => d.id === doc.id)) {
      documents.unshift(doc);
    }
    return doc;
  },

  async updateDocument(id, patch, scope) {
    const idx = documents.findIndex((d) => d.id === id && inCrmScope(d, scope));
    if (idx === -1) return null;
    documents[idx] = { ...documents[idx], ...patch, updatedAt: crmNow() };
    return documents[idx];
  },

  async deleteDocument(id, scope) {
    const idx = documents.findIndex((d) => d.id === id && inCrmScope(d, scope));
    if (idx === -1) return false;
    documents.splice(idx, 1);
    chunks = chunks.filter(
      (c) => !(c.documentId === id && inCrmScope(c, scope))
    );
    return true;
  },

  async listChunks(scope, documentId) {
    return chunks
      .filter(
        (c) =>
          inCrmScope(c, scope) && (!documentId || c.documentId === documentId)
      )
      .sort((a, b) => a.index - b.index);
  },

  async replaceChunks(documentId, newChunks, scope) {
    chunks = chunks.filter(
      (c) => !(c.documentId === documentId && inCrmScope(c, scope))
    );
    const created = newChunks.map((chunk) => {
      const record: KnowledgeChunk = {
        ...scope,
        id: crmNewId("kchunk"),
        ...chunk,
        createdAt: crmNow(),
      };
      return record;
    });
    chunks.push(...created);
    return created;
  },
};

export function resetKnowledgeMemory() {
  const fresh = buildDemoKnowledgeSeed();
  documents = fresh.documents;
  chunks = fresh.chunks;
}
