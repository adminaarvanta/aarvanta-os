import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isMemoryDatastore } from "@/lib/data/datastore";
import type { TenantScope } from "@/types/communication";

export type ScheduledCallStatus = "scheduled" | "completed" | "failed" | "cancelled";

export type ScheduledCall = TenantScope & {
  id: string;
  phone: string;
  contactName?: string;
  message: string;
  scheduledAt: string;
  status: ScheduledCallStatus;
  conversationId?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

const COLLECTION = "scheduled_calls";

let memory: ScheduledCall[] = [];

function inScope(item: TenantScope, scope: TenantScope) {
  return (
    item.tenantId === scope.tenantId &&
    item.workspaceId === scope.workspaceId &&
    item.companyId === scope.companyId
  );
}

export async function listScheduledCalls(scope: TenantScope): Promise<ScheduledCall[]> {
  if (isMemoryDatastore()) {
    return memory
      .filter((item) => inScope(item, scope))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  }

  const db = getAdminFirestore();
  if (!db) return [];
  const snap = await db
    .collection(COLLECTION)
    .where("tenantId", "==", scope.tenantId)
    .where("workspaceId", "==", scope.workspaceId)
    .where("companyId", "==", scope.companyId)
    .get();
  return snap.docs
    .map((doc) => doc.data() as ScheduledCall)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export async function createScheduledCall(
  input: {
    phone: string;
    contactName?: string;
    message: string;
    scheduledAt: string;
  },
  scope: TenantScope
): Promise<ScheduledCall> {
  const now = crmNow();
  const item: ScheduledCall = {
    ...scope,
    id: crmNewId("sched_call"),
    phone: input.phone,
    contactName: input.contactName,
    message: input.message,
    scheduledAt: input.scheduledAt,
    status: "scheduled",
    createdAt: now,
    updatedAt: now,
  };

  if (isMemoryDatastore()) {
    memory = [item, ...memory];
    return item;
  }

  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured.");
  await db.collection(COLLECTION).doc(item.id).set(item);
  return item;
}

export async function updateScheduledCall(
  id: string,
  patch: Partial<
    Pick<ScheduledCall, "status" | "conversationId" | "error" | "updatedAt">
  >,
  scope: TenantScope
): Promise<ScheduledCall | null> {
  if (isMemoryDatastore()) {
    const idx = memory.findIndex((item) => item.id === id && inScope(item, scope));
    if (idx < 0) return null;
    memory[idx] = { ...memory[idx]!, ...patch, updatedAt: crmNow() };
    return memory[idx]!;
  }

  const db = getAdminFirestore();
  if (!db) return null;
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const existing = snap.data() as ScheduledCall;
  if (!inScope(existing, scope)) return null;
  const updated = { ...existing, ...patch, updatedAt: crmNow() };
  await ref.set(updated);
  return updated;
}

export async function listDueScheduledCalls(
  nowIso = crmNow()
): Promise<ScheduledCall[]> {
  if (isMemoryDatastore()) {
    return memory.filter(
      (item) => item.status === "scheduled" && item.scheduledAt <= nowIso
    );
  }

  const db = getAdminFirestore();
  if (!db) return [];
  const snap = await db
    .collection(COLLECTION)
    .where("status", "==", "scheduled")
    .limit(100)
    .get();
  return snap.docs
    .map((doc) => doc.data() as ScheduledCall)
    .filter((item) => item.scheduledAt <= nowIso)
    .slice(0, 50);
}
