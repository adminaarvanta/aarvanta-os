import type { TenantScope } from "@/types/communication";
import type {
  KnowledgeChunk,
  KnowledgeDocument,
  KnowledgeDocumentStatus,
} from "@/types/knowledge";

export type CreateKnowledgeDocumentInput = {
  title: string;
  fileName: string;
  fileType: KnowledgeDocument["fileType"];
  fileSize: number;
  tags?: string[];
  summary?: string;
  chunkCount?: number;
  charCount?: number;
  status?: KnowledgeDocumentStatus;
  error?: string;
};

export type CreateKnowledgeChunkInput = {
  documentId: string;
  documentTitle: string;
  index: number;
  content: string;
  embedding?: number[];
};

export interface KnowledgeRepository {
  listDocuments(scope: TenantScope): Promise<KnowledgeDocument[]>;
  getDocument(id: string, scope: TenantScope): Promise<KnowledgeDocument | null>;
  createDocument(
    input: CreateKnowledgeDocumentInput | KnowledgeDocument,
    scope: TenantScope
  ): Promise<KnowledgeDocument>;
  updateDocument(
    id: string,
    patch: Partial<
      Pick<
        KnowledgeDocument,
        | "title"
        | "tags"
        | "summary"
        | "chunkCount"
        | "charCount"
        | "status"
        | "error"
      >
    >,
    scope: TenantScope
  ): Promise<KnowledgeDocument | null>;
  deleteDocument(id: string, scope: TenantScope): Promise<boolean>;
  listChunks(scope: TenantScope, documentId?: string): Promise<KnowledgeChunk[]>;
  replaceChunks(
    documentId: string,
    chunks: CreateKnowledgeChunkInput[],
    scope: TenantScope
  ): Promise<KnowledgeChunk[]>;
}
