import { createResilientRepository } from "@/lib/data/datastore";
import { launchFirestoreRepository } from "@/lib/data/launch-firestore-repository";
import { launchMemoryRepository } from "@/lib/data/launch-memory-repository";
import type { LaunchRepository } from "@/lib/data/launch-repository";

export function getLaunchRepository(): LaunchRepository {
  return createResilientRepository(launchMemoryRepository, launchFirestoreRepository);
}
