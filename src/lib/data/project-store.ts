import { isProductionMode } from "@/lib/config/app-mode";
import { projectFirestoreRepository } from "@/lib/data/project-firestore-repository";
import { projectMemoryRepository } from "@/lib/data/project-memory-repository";
import type { ProjectRepository } from "@/lib/data/project-repository";

export function getProjectRepository(): ProjectRepository {
  return isProductionMode()
    ? projectFirestoreRepository
    : projectMemoryRepository;
}
