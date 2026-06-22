import { useMemoryDatastore } from "@/lib/data/datastore";
import { workforceFirestoreRepository } from "@/lib/data/workforce-firestore-repository";
import { workforceMemoryRepository } from "@/lib/data/workforce-memory-repository";
import type { WorkforceRepository } from "@/lib/data/workforce-repository";

export function getWorkforceRepository(): WorkforceRepository {
  return useMemoryDatastore() ? workforceMemoryRepository : workforceFirestoreRepository;
}
