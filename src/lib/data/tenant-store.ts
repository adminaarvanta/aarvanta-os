import { isProductionMode } from "@/lib/config/app-mode";
import { tenantFirestoreRepository } from "@/lib/data/tenant-firestore-repository";
import { tenantMemoryRepository } from "@/lib/data/tenant-memory-repository";
import type { TenantRepository } from "@/lib/data/tenant-repository";

export function getTenantRepository(): TenantRepository {
  return isProductionMode()
    ? tenantFirestoreRepository
    : tenantMemoryRepository;
}
