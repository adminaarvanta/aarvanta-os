import { isProductionMode } from "@/lib/config/app-mode";
import { integrationFirestoreRepository } from "@/lib/data/integration-firestore-repository";
import { integrationMemoryRepository } from "@/lib/data/integration-memory-repository";
import type { IntegrationRepository } from "@/lib/data/integration-repository";

export function getIntegrationRepository(): IntegrationRepository {
  return isProductionMode()
    ? integrationFirestoreRepository
    : integrationMemoryRepository;
}
