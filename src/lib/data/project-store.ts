import { useMemoryDatastore } from "@/lib/data/datastore";
import { projectFirestoreRepository } from "@/lib/data/project-firestore-repository";
import { projectMemoryRepository } from "@/lib/data/project-memory-repository";
import type { ProjectRepository } from "@/lib/data/project-repository";

export function getProjectRepository(): ProjectRepository {
  return useMemoryDatastore() ? projectMemoryRepository : projectFirestoreRepository;
}
