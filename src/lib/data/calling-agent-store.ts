import { callingAgentFirestoreRepository } from "@/lib/data/calling-agent-firestore-repository";
import { callingAgentMemoryRepository } from "@/lib/data/calling-agent-memory-repository";
import type { CallingAgentRepository } from "@/lib/data/calling-agent-repository";
import { createResilientRepository } from "@/lib/data/datastore";

export function getCallingAgentRepository(): CallingAgentRepository {
  return createResilientRepository(
    callingAgentMemoryRepository,
    callingAgentFirestoreRepository
  );
}
