import { chunkText } from "@/lib/knowledge/chunking";
import { embedTexts } from "@/lib/knowledge/embeddings";
import { summarizeDocument } from "@/lib/knowledge/rag";
import { isAiConfigured } from "@/lib/ai/config";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import type { KnowledgeRepository } from "@/lib/data/knowledge-repository";
import type { TenantScope } from "@/types/communication";
import type {
  KnowledgeChunk,
  KnowledgeDocument,
  KnowledgeFileType,
} from "@/types/knowledge";

export async function ingestKnowledgeText(
  repo: KnowledgeRepository,
  scope: TenantScope,
  input: {
    title: string;
    fileName: string;
    fileType: KnowledgeFileType;
    fileSize: number;
    text: string;
  }
): Promise<KnowledgeDocument> {
  const now = crmNow();
  const doc = await repo.createDocument(
    {
      title: input.title,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      tags: [],
      chunkCount: 0,
      charCount: input.text.length,
      status: "processing",
    },
    scope
  );

  try {
    const pieces = chunkText(input.text);
    let embeddings: number[][] = [];

    if (isAiConfigured() && pieces.length > 0) {
      embeddings = await embedTexts(pieces);
    }

    const chunks: Omit<KnowledgeChunk, keyof TenantScope | "id" | "createdAt">[] =
      pieces.map((content, index) => ({
        documentId: doc.id,
        documentTitle: doc.title,
        index,
        content,
        embedding: embeddings[index],
      }));

    await repo.replaceChunks(doc.id, chunks, scope);

    const { summary, tags } = await summarizeDocument({
      title: doc.title,
      text: input.text,
    });

    return (
      (await repo.updateDocument(
        doc.id,
        {
          status: "ready",
          chunkCount: pieces.length,
          summary,
          tags,
        },
        scope
      )) ?? doc
    );
  } catch (error) {
    await repo.updateDocument(
      doc.id,
      {
        status: "failed",
        error: error instanceof Error ? error.message : "Processing failed",
      },
      scope
    );
    throw error;
  }
}

export function titleFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export async function ingestDemoDocument(
  repo: KnowledgeRepository,
  scope: TenantScope,
  input: {
    id?: string;
    title: string;
    fileName: string;
    fileType: KnowledgeFileType;
    text: string;
    tags: string[];
    summary: string;
  }
) {
  const now = crmNow();
  const docId = input.id ?? crmNewId("kdoc");
  const pieces = chunkText(input.text);

  const doc: KnowledgeDocument = {
    ...scope,
    id: docId,
    title: input.title,
    fileName: input.fileName,
    fileType: input.fileType,
    fileSize: input.text.length,
    tags: input.tags,
    summary: input.summary,
    chunkCount: pieces.length,
    charCount: input.text.length,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  };

  await repo.createDocument(doc, scope);

  await repo.replaceChunks(
    doc.id,
    pieces.map((content, index) => ({
      documentId: doc.id,
      documentTitle: doc.title,
      index,
      content,
    })),
    scope
  );

  return doc;
}
