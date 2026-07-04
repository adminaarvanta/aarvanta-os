import { createResilientRepository } from "@/lib/data/datastore";
import { storePageFirestoreRepository } from "@/lib/data/store-page-firestore-repository";
import { storePageMemoryRepository } from "@/lib/data/store-page-memory-repository";
import type { StorePageRepository } from "@/lib/data/store-page-repository";

export function getStorePageRepository(): StorePageRepository {
  return createResilientRepository(
    storePageMemoryRepository,
    storePageFirestoreRepository
  );
}
