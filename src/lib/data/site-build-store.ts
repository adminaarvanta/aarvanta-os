import { createResilientRepository } from "@/lib/data/datastore";
import { siteBuildFirestoreRepository } from "@/lib/data/site-build-firestore-repository";
import { siteBuildMemoryRepository } from "@/lib/data/site-build-memory-repository";
import type { SiteBuildRepository } from "@/lib/data/site-build-repository";

export function getSiteBuildRepository(): SiteBuildRepository {
  return createResilientRepository(
    siteBuildMemoryRepository,
    siteBuildFirestoreRepository
  );
}
