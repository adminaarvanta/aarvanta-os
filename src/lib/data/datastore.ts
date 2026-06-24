import { cache } from "react";
import { isDemoMode } from "@/lib/config/app-mode";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";

export type DatastoreBackend = "memory" | "firestore";

const FIRESTORE_UNAVAILABLE = /RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED|Quota exceeded/i;

let backend: DatastoreBackend | null = null;
let probePromise: Promise<DatastoreBackend> | null = null;

export function isFirestoreQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return FIRESTORE_UNAVAILABLE.test(message);
}

/** Force in-memory stores when Firestore is down or quota is exceeded. */
export function disableFirestoreFallback(reason?: string): void {
  if (backend !== "memory") {
    console.warn(
      "[datastore] Firestore unavailable; using in-memory fallback.",
      reason ?? ""
    );
  }
  backend = "memory";
}

export function useMemoryDatastore(): boolean {
  if (isDemoMode()) return true;
  if (process.env.DATASTORE === "memory") return true;
  if (process.env.DATASTORE === "firestore") return false;
  if (!isFirebaseConfigured()) return true;
  return backend !== "firestore";
}

export function getActiveDatastore(): DatastoreBackend {
  return useMemoryDatastore() ? "memory" : "firestore";
}

export const ensureDatastoreReady = cache(async (): Promise<DatastoreBackend> => {
  if (isDemoMode()) {
    backend = "memory";
    return backend;
  }

  if (process.env.DATASTORE === "memory") {
    backend = "memory";
    return backend;
  }

  if (process.env.DATASTORE === "firestore") {
    backend = "firestore";
    return backend;
  }

  if (backend !== null) return backend;

  if (!probePromise) {
    probePromise = probeFirestore();
  }

  return probePromise;
});

async function probeFirestore(): Promise<DatastoreBackend> {
  if (!isFirebaseConfigured()) {
    backend = "memory";
    return backend;
  }

  try {
    const db = getAdminFirestore();
    if (!db) {
      backend = "memory";
      return backend;
    }

    await db.collection("conversations").limit(1).get();
    backend = "firestore";
  } catch (error) {
    disableFirestoreFallback(
      error instanceof Error ? error.message : String(error)
    );
  }

  return backend!;
}
