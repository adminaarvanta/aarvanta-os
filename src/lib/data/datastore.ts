import { cache } from "react";
import { isDemoMode } from "@/lib/config/app-mode";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";

export type DatastoreBackend = "memory" | "firestore";

const FIRESTORE_UNAVAILABLE = /RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED|Quota exceeded/i;

let backend: DatastoreBackend | null = null;
let probePromise: Promise<DatastoreBackend> | null = null;

export function isFirestoreQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  return (
    FIRESTORE_UNAVAILABLE.test(message) ||
    FIRESTORE_UNAVAILABLE.test(code) ||
    code === "8"
  );
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
  probePromise = null;
}

/**
 * Run a Firestore operation; on quota/unavailability errors switch to memory
 * for the rest of the process and run the memory fallback.
 */
export async function withFirestoreFallback<T>(
  firestoreOp: () => Promise<T>,
  memoryOp: () => T | Promise<T>
): Promise<T> {
  if (isMemoryDatastore()) {
    return memoryOp();
  }

  try {
    return await firestoreOp();
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      disableFirestoreFallback(
        error instanceof Error ? error.message : String(error)
      );
      return memoryOp();
    }
    throw error;
  }
}

/** Proxy that falls back from Firestore to memory on quota errors. */
export function createResilientRepository<M extends object, F extends M>(
  memory: M,
  firestore: F
): M {
  if (isMemoryDatastore()) return memory;

  return new Proxy(firestore, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;

      const memoryMethod = Reflect.get(memory, prop, memory);
      if (typeof memoryMethod !== "function") {
        return (...args: unknown[]) =>
          withFirestoreFallback(
            () => (value as (...a: unknown[]) => Promise<unknown>).apply(target, args),
            async () => {
              throw new Error(`No memory fallback for ${String(prop)}`);
            }
          );
      }

      return (...args: unknown[]) =>
        withFirestoreFallback(
          () => (value as (...a: unknown[]) => Promise<unknown>).apply(target, args),
          () => (memoryMethod as (...a: unknown[]) => unknown).apply(memory, args)
        );
    },
  }) as M;
}

export function isMemoryDatastore(): boolean {
  if (isDemoMode()) return true;
  if (process.env.DATASTORE === "memory") return true;
  if (process.env.DATASTORE === "firestore") return false;
  if (!isFirebaseConfigured()) return true;
  return backend !== "firestore";
}

export function getActiveDatastore(): DatastoreBackend {
  return isMemoryDatastore() ? "memory" : "firestore";
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
