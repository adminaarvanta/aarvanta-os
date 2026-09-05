import { createResilientRepository } from "@/lib/data/datastore";
import { siteMediaFirestoreRepository } from "@/lib/data/site-media-firestore-repository";
import { siteMediaMemoryRepository } from "@/lib/data/site-media-memory-repository";
import type { SiteMediaRepository } from "@/lib/data/site-media-repository";

export function getSiteMediaRepository(): SiteMediaRepository {
  return createResilientRepository(
    siteMediaMemoryRepository,
    siteMediaFirestoreRepository
  );
}
