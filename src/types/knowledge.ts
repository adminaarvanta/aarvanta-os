import type { TenantScope } from "@/types/communication";

export type KnowledgeFileType = "pdf" | "docx" | "txt";

export type KnowledgeDocumentStatus = "processing" | "ready" | "failed";

export interface KnowledgeDocument extends TenantScope {
  id: string;
  title: string;
  fileName: string;
  fileType: KnowledgeFileType;
  fileSize: number;
  tags: string[];
  summary?: string;
  chunkCount: number;
  charCount: number;
  status: KnowledgeDocumentStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunk extends TenantScope {
  id: string;
  documentId: string;
  documentTitle: string;
  index: number;
  content: string;
  embedding?: number[];
  createdAt: string;
}

export interface KnowledgeSearchHit {
  chunk: KnowledgeChunk;
  score: number;
  method: "semantic" | "keyword";
}

export interface KnowledgeAskCitation {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  excerpt: string;
}

export interface KnowledgeAskResult {
  answer: string;
  citations: KnowledgeAskCitation[];
  method: "rag" | "heuristic";
}
