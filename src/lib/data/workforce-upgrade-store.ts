import { createResilientRepository } from "@/lib/data/datastore";
import { workforceUpgradeFirestoreRepository } from "@/lib/data/workforce-upgrade-firestore-repository";
import { workforceUpgradeMemoryRepository } from "@/lib/data/workforce-upgrade-memory-repository";
import type { WorkforceUpgradeRepository } from "@/lib/data/workforce-upgrade-repository";

export function getWorkforceUpgradeRepository(): WorkforceUpgradeRepository {
  return createResilientRepository(
    workforceUpgradeMemoryRepository,
    workforceUpgradeFirestoreRepository
  );
}
