import { isProductionMode } from "@/lib/config/app-mode";
import { workforceFirestoreRepository } from "@/lib/data/workforce-firestore-repository";
import { workforceMemoryRepository } from "@/lib/data/workforce-memory-repository";
import type { WorkforceRepository } from "@/lib/data/workforce-repository";

export function getWorkforceRepository(): WorkforceRepository {
  return isProductionMode()
    ? workforceFirestoreRepository
    : workforceMemoryRepository;
}
