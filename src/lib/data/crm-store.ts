import { createResilientRepository } from "@/lib/data/datastore";
import { crmFirestoreRepository } from "@/lib/data/crm-firestore-repository";
import { crmMemoryRepository } from "@/lib/data/crm-memory-repository";
import type { CrmRepository } from "@/lib/data/crm-repository";

export function getCrmRepository(): CrmRepository {
  return createResilientRepository(crmMemoryRepository, crmFirestoreRepository);
}
