import { isProductionMode } from "@/lib/config/app-mode";
import { workforceUpgradeFirestoreRepository } from "@/lib/data/workforce-upgrade-firestore-repository";
import { workforceUpgradeMemoryRepository } from "@/lib/data/workforce-upgrade-memory-repository";
import type { WorkforceUpgradeRepository } from "@/lib/data/workforce-upgrade-repository";

export function getWorkforceUpgradeRepository(): WorkforceUpgradeRepository {
  return isProductionMode()
    ? workforceUpgradeFirestoreRepository
    : workforceUpgradeMemoryRepository;
}
