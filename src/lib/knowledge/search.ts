import { cosineSimilarity, embedQuery } from "@/lib/knowledge/embeddings";
import { isAiConfigured } from "@/lib/ai/config";
import type { KnowledgeChunk, KnowledgeSearchHit } from "@/types/knowledge";

function keywordScore(query: string, content: string): number {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
  if (!terms.length) return 0;

  const haystack = content.toLowerCase();
  let hits = 0;
  for (const term of terms) {
    if (haystack.includes(term)) hits += 1;
  }
  return hits / terms.length;
}

export async function searchKnowledgeChunks(
  chunks: KnowledgeChunk[],
  query: string,
  limit = 6
): Promise<KnowledgeSearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed || !chunks.length) return [];

  if (isAiConfigured() && chunks.some((c) => c.embedding?.length)) {
    try {
      const queryEmbedding = await embedQuery(trimmed);
      return chunks
        .filter((chunk) => chunk.embedding?.length)
        .map((chunk) => ({
          chunk,
          score: cosineSimilarity(queryEmbedding, chunk.embedding!),
          method: "semantic" as const,
        }))
        .filter((hit) => hit.score > 0.2)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch {
      /* fall through to keyword search */
    }
  }

  return chunks
    .map((chunk) => ({
      chunk,
      score: keywordScore(trimmed, chunk.content),
      method: "keyword" as const,
    }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
