import { createResilientRepository } from "@/lib/data/datastore";
import { teamFirestoreRepository } from "@/lib/data/team-firestore-repository";
import { teamMemoryRepository } from "@/lib/data/team-memory-repository";
import type { TeamRepository } from "@/lib/data/team-repository";

export function getTeamRepository(): TeamRepository {
  return createResilientRepository(teamMemoryRepository, teamFirestoreRepository);
}
