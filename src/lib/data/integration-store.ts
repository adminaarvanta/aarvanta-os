import { createResilientRepository } from "@/lib/data/datastore";
import { integrationFirestoreRepository } from "@/lib/data/integration-firestore-repository";
import { integrationMemoryRepository } from "@/lib/data/integration-memory-repository";
import type { IntegrationRepository } from "@/lib/data/integration-repository";

export function getIntegrationRepository(): IntegrationRepository {
  return createResilientRepository(
    integrationMemoryRepository,
    integrationFirestoreRepository
  );
}
