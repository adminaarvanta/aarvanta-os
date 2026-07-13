import { createResilientRepository } from "@/lib/data/datastore";
import { domainOrderFirestoreRepository } from "@/lib/data/domain-order-firestore-repository";
import { domainOrderMemoryRepository } from "@/lib/data/domain-order-memory-repository";
import type { DomainOrderRepository } from "@/lib/data/domain-order-repository";

export function getDomainOrderRepository(): DomainOrderRepository {
  return createResilientRepository(
    domainOrderMemoryRepository,
    domainOrderFirestoreRepository
  );
}
