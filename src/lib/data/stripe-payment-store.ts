import { createScopedMemoryStore, createScopedFirestoreStore } from "@/lib/data/scoped-store";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";
import type { ProcessedWebhookEvent, StripePaymentRecord } from "@/types/stripe-billing";

const paymentMemory = createScopedMemoryStore<StripePaymentRecord>(() => []);
const webhookMemory = new Set<string>();

const paymentFirestore = createScopedFirestoreStore<StripePaymentRecord>("stripe_payments");

export function getStripePaymentStore() {
  return {
    async list(scope: TenantScope) {
      if (isFirebaseConfigured()) {
        try {
          return await paymentFirestore.list(scope);
        } catch {
          return paymentMemory.list(scope);
        }
      }
      return paymentMemory.list(scope);
    },
    async get(id: string, scope: TenantScope) {
      if (isFirebaseConfigured()) {
        try {
          return await paymentFirestore.get(id, scope);
        } catch {
          return paymentMemory.get(id, scope);
        }
      }
      return paymentMemory.get(id, scope);
    },
    async save(item: StripePaymentRecord) {
      paymentMemory.set(item);
      if (isFirebaseConfigured()) {
        try {
          await paymentFirestore.set(item);
        } catch {
          /* keep memory */
        }
      }
      return item;
    },
    async findByCheckoutSession(sessionId: string, scope: TenantScope) {
      const all = await this.list(scope);
      return all.find((p) => p.stripeCheckoutSessionId === sessionId) ?? null;
    },
  };
}

export function getStripeWebhookStore() {
  return {
    async has(eventId: string) {
      if (webhookMemory.has(eventId)) return true;
      if (!isFirebaseConfigured()) return false;
      try {
        const db = getAdminFirestore();
        if (!db) return false;
        const snap = await db.collection("stripe_webhook_events").doc(eventId).get();
        return snap.exists;
      } catch {
        return false;
      }
    },
    async mark(event: ProcessedWebhookEvent) {
      webhookMemory.add(event.stripeEventId);
      if (!isFirebaseConfigured()) return;
      try {
        const db = getAdminFirestore();
        if (!db) return;
        await db.collection("stripe_webhook_events").doc(event.stripeEventId).set(event);
      } catch {
        /* memory already marked */
      }
    },
  };
}
