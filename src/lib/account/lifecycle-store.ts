import { crmNow } from "@/lib/data/crm-helpers";
import { isMemoryDatastore, withFirestoreFallback } from "@/lib/data/datastore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import type {
  AccountLifecycleAction,
  AccountLifecycleRecord,
  AccountLifecycleStatus,
  RetentionAlternativeId,
} from "@/lib/account/lifecycle";
import { nextStatusForAction } from "@/lib/account/lifecycle";

const COLLECTION = "account_lifecycle";
const memory = new Map<string, AccountLifecycleRecord>();

function getDb() {
  const db = getAdminFirestore();
  if (!db) throw new Error("Firestore is not configured.");
  return db;
}

async function readFirestore(tenantId: string): Promise<AccountLifecycleRecord | null> {
  const snap = await getDb().collection(COLLECTION).doc(tenantId).get();
  return snap.exists ? (snap.data() as AccountLifecycleRecord) : null;
}

async function writeFirestore(
  record: AccountLifecycleRecord
): Promise<AccountLifecycleRecord> {
  await getDb().collection(COLLECTION).doc(record.tenantId).set(record);
  return record;
}

export function defaultLifecycle(tenantId: string): AccountLifecycleRecord {
  const now = crmNow();
  return {
    tenantId,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

export async function getAccountLifecycle(
  tenantId: string
): Promise<AccountLifecycleRecord> {
  if (isMemoryDatastore()) {
    return memory.get(tenantId) ?? defaultLifecycle(tenantId);
  }
  const stored = await withFirestoreFallback(
    () => readFirestore(tenantId),
    () => memory.get(tenantId) ?? null
  );
  return stored ?? defaultLifecycle(tenantId);
}

export async function applyAccountLifecycleAction(input: {
  tenantId: string;
  action: AccountLifecycleAction;
  reason?: string;
  selectedAlternative?: RetentionAlternativeId;
  resumeAt?: string;
}): Promise<AccountLifecycleRecord> {
  const current = await getAccountLifecycle(input.tenantId);
  const now = crmNow();
  const status: AccountLifecycleStatus =
    input.selectedAlternative === "keep_plan"
      ? "active"
      : input.selectedAlternative === "pause"
        ? "paused"
        : input.selectedAlternative === "downgrade"
          ? "active"
          : nextStatusForAction(input.action);

  const next: AccountLifecycleRecord = {
    ...current,
    tenantId: input.tenantId,
    status,
    requestedAction: input.action,
    reason: input.reason?.trim() || current.reason,
    selectedAlternative: input.selectedAlternative,
    resumeAt: input.resumeAt ?? current.resumeAt,
    createdAt: current.createdAt ?? now,
    updatedAt: now,
  };

  if (isMemoryDatastore()) {
    memory.set(input.tenantId, next);
    return next;
  }

  return withFirestoreFallback(
    () => writeFirestore(next),
    () => {
      memory.set(input.tenantId, next);
      return next;
    }
  );
}

export async function resumeAccountLifecycle(
  tenantId: string
): Promise<AccountLifecycleRecord> {
  return applyAccountLifecycleAction({
    tenantId,
    action: "pause",
    selectedAlternative: "keep_plan",
    reason: "Resumed by owner",
  });
}
