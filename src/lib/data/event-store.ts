import { useMemoryDatastore } from "@/lib/data/datastore";
import { eventFirestoreRepository } from "@/lib/data/event-firestore-repository";
import { eventMemoryRepository } from "@/lib/data/event-memory-repository";
import type { EventRepository } from "@/lib/data/event-repository";

export function getEventRepository(): EventRepository {
  return useMemoryDatastore() ? eventMemoryRepository : eventFirestoreRepository;
}
