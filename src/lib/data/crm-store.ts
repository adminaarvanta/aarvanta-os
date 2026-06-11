import { isProductionMode } from "@/lib/config/app-mode";
import { crmFirestoreRepository } from "@/lib/data/crm-firestore-repository";
import { crmMemoryRepository } from "@/lib/data/crm-memory-repository";
import type { CrmRepository } from "@/lib/data/crm-repository";

export function getCrmRepository(): CrmRepository {
  return isProductionMode() ? crmFirestoreRepository : crmMemoryRepository;
}
