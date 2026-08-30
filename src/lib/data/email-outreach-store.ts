import { emailOutreachFirestoreRepository } from "@/lib/data/email-outreach-firestore-repository";
import { emailOutreachMemoryRepository } from "@/lib/data/email-outreach-memory-repository";
import type { EmailOutreachRepository } from "@/lib/data/email-outreach-repository";
import { createResilientRepository } from "@/lib/data/datastore";

export function getEmailOutreachRepository(): EmailOutreachRepository {
  return createResilientRepository(
    emailOutreachMemoryRepository,
    emailOutreachFirestoreRepository
  );
}
