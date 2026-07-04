import { createResilientRepository } from "@/lib/data/datastore";
import { eventFirestoreRepository } from "@/lib/data/event-firestore-repository";
import { eventMemoryRepository } from "@/lib/data/event-memory-repository";
import type { EventRepository } from "@/lib/data/event-repository";

export function getEventRepository(): EventRepository {
  return createResilientRepository(eventMemoryRepository, eventFirestoreRepository);
}
