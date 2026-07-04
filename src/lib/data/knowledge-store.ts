import { createResilientRepository } from "@/lib/data/datastore";
import { knowledgeFirestoreRepository } from "@/lib/data/knowledge-firestore-repository";
import { knowledgeMemoryRepository } from "@/lib/data/knowledge-memory-repository";
import type { KnowledgeRepository } from "@/lib/data/knowledge-repository";

export function getKnowledgeRepository(): KnowledgeRepository {
  return createResilientRepository(
    knowledgeMemoryRepository,
    knowledgeFirestoreRepository
  );
}
