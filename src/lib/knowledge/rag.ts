import { completeJson, completeText } from "@/lib/ai/provider";
import { isAiConfigured } from "@/lib/ai/config";
import { searchKnowledgeChunks } from "@/lib/knowledge/search";
import type {
  KnowledgeAskResult,
  KnowledgeChunk,
  KnowledgeDocument,
} from "@/types/knowledge";

type SummaryResponse = { summary?: string; tags?: string[] };

export async function summarizeDocument(input: {
  title: string;
  text: string;
}): Promise<{ summary: string; tags: string[] }> {
  const excerpt = input.text.slice(0, 12000);

  if (!isAiConfigured()) {
    const words = excerpt.split(/\s+/).slice(0, 40).join(" ");
    return {
      summary: `${input.title}: ${words}…`,
      tags: ["general", "company"],
    };
  }

  const result = await completeJson<SummaryResponse>({
    system: `You summarize business documents for Aarvanta OS Knowledge Hub.
Respond ONLY with JSON: { "summary": "2-3 sentence summary", "tags": ["tag1", "tag2", ...] }
Use 2-5 lowercase tags.`,
    user: `Title: ${input.title}\n\nContent:\n${excerpt}`,
  });

  return {
    summary: result.summary?.trim() || `Summary of ${input.title}.`,
    tags: (result.tags ?? []).map((t) => t.toLowerCase()).slice(0, 8),
  };
}

export async function askKnowledgeBase(input: {
  question: string;
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
}): Promise<KnowledgeAskResult> {
  const hits = await searchKnowledgeChunks(input.chunks, input.question, 6);

  if (!hits.length) {
    return {
      answer:
        "I couldn't find relevant information in your knowledge base for that question. Try uploading more documents or rephrasing.",
      citations: [],
      method: "heuristic",
    };
  }

  const context = hits
    .map(
      (hit, i) =>
        `[Source ${i + 1}: ${hit.chunk.documentTitle}]\n${hit.chunk.content}`
    )
    .join("\n\n---\n\n");

  if (!isAiConfigured()) {
    const top = hits[0]!.chunk;
    return {
      answer: `[Demo mode] Based on "${top.documentTitle}": ${top.content.slice(0, 400)}…`,
      citations: hits.map((hit) => ({
        documentId: hit.chunk.documentId,
        documentTitle: hit.chunk.documentTitle,
        chunkIndex: hit.chunk.index,
        excerpt: hit.chunk.content.slice(0, 180),
      })),
      method: "heuristic",
    };
  }

  const answer = await completeText({
    system: `You are the Company Brain for Aarvanta OS. Answer using ONLY the provided sources.
If the sources don't contain enough information, say so clearly.
Be concise and practical. Reference source titles when helpful.`,
    messages: [
      {
        role: "user",
        content: `Sources:\n${context}\n\nQuestion: ${input.question}`,
      },
    ],
    temperature: 0.2,
  });

  return {
    answer,
    citations: hits.map((hit) => ({
      documentId: hit.chunk.documentId,
      documentTitle: hit.chunk.documentTitle,
      chunkIndex: hit.chunk.index,
      excerpt: hit.chunk.content.slice(0, 180),
    })),
    method: "rag",
  };
}
