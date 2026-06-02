import { getAdminFirestore } from "@/lib/firebase/admin";
import type { TenantScope } from "@/types/communication";

const COLLECTION = "webhook_events";

export async function isWebhookProcessed(
  provider: string,
  messageId: string
): Promise<boolean> {
  const db = getAdminFirestore();
  if (!db) return false;

  const id = `${provider}_${messageId}`;
  const snap = await db.collection(COLLECTION).doc(id).get();
  return snap.exists;
}

export async function markWebhookProcessed(
  provider: string,
  messageId: string,
  scope: TenantScope
): Promise<void> {
  const db = getAdminFirestore();
  if (!db) return;

  const id = `${provider}_${messageId}`;
  await db
    .collection(COLLECTION)
    .doc(id)
    .set({
      provider,
      messageId,
      processedAt: new Date().toISOString(),
      ...scope,
    });
}
