import { crmNow } from "@/lib/data/crm-helpers";
import {
  createResilientRepository,
  isMemoryDatastore,
} from "@/lib/data/datastore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import {
  EMPTY_MEMBER_CREDIT_OVERRIDES,
  normalizeMemberCreditOverrides,
} from "@/lib/billing/credit-override-utils";
import type { MemberCreditOverrides } from "@/types/tenant";

export type CreditGrantRecord = {
  email: string;
  unlimitedVoice: boolean;
  unlimitedEmailOutreach: boolean;
  updatedAt: string;
  updatedBy?: string;
};

const COLLECTION = "member_credit_grants";

function emailKey(email: string) {
  return email.trim().toLowerCase();
}

function toRecord(
  email: string,
  overrides: MemberCreditOverrides,
  updatedBy?: string
): CreditGrantRecord {
  const normalized = normalizeMemberCreditOverrides(overrides);
  return {
    email: emailKey(email),
    unlimitedVoice: Boolean(normalized.unlimitedVoice),
    unlimitedEmailOutreach: Boolean(normalized.unlimitedEmailOutreach),
    updatedAt: crmNow(),
    updatedBy,
  };
}

function toOverrides(record: CreditGrantRecord | null): MemberCreditOverrides {
  if (!record) return { ...EMPTY_MEMBER_CREDIT_OVERRIDES };
  return {
    unlimitedVoice: Boolean(record.unlimitedVoice),
    unlimitedEmailOutreach: Boolean(record.unlimitedEmailOutreach),
  };
}

const memoryGrants = new Map<string, CreditGrantRecord>();

const memoryStore = {
  async get(email: string): Promise<CreditGrantRecord | null> {
    return memoryGrants.get(emailKey(email)) ?? null;
  },
  async set(
    email: string,
    overrides: MemberCreditOverrides,
    updatedBy?: string
  ): Promise<CreditGrantRecord> {
    const record = toRecord(email, overrides, updatedBy);
    if (!record.unlimitedVoice && !record.unlimitedEmailOutreach) {
      memoryGrants.delete(record.email);
      return record;
    }
    memoryGrants.set(record.email, record);
    return record;
  },
  async list(): Promise<CreditGrantRecord[]> {
    return [...memoryGrants.values()].sort((a, b) =>
      a.email.localeCompare(b.email)
    );
  },
};

const firestoreStore = {
  async get(email: string): Promise<CreditGrantRecord | null> {
    const db = getAdminFirestore();
    if (!db) return null;
    const snap = await db.collection(COLLECTION).doc(emailKey(email)).get();
    if (!snap.exists) return null;
    return snap.data() as CreditGrantRecord;
  },
  async set(
    email: string,
    overrides: MemberCreditOverrides,
    updatedBy?: string
  ): Promise<CreditGrantRecord> {
    const db = getAdminFirestore();
    if (!db) {
      // Let resilient proxy fall back to memory rather than failing the grant.
      throw new Error("Firestore is not configured.");
    }
    const record = toRecord(email, overrides, updatedBy);
    const ref = db.collection(COLLECTION).doc(record.email);
    if (!record.unlimitedVoice && !record.unlimitedEmailOutreach) {
      await ref.delete();
      return record;
    }
    await ref.set(record);
    return record;
  },
  async list(): Promise<CreditGrantRecord[]> {
    const db = getAdminFirestore();
    if (!db) return [];
    const snap = await db.collection(COLLECTION).get();
    return snap.docs
      .map((doc) => doc.data() as CreditGrantRecord)
      .sort((a, b) => a.email.localeCompare(b.email));
  },
};

type CreditGrantStore = typeof memoryStore;

/**
 * Prefer Firestore when available. On missing Admin SDK use memory; quota
 * errors fall back via the resilient proxy. Memberships remain the durable
 * source of truth when this store is ephemeral.
 */
export function getCreditGrantStore(): CreditGrantStore {
  if (isMemoryDatastore()) return memoryStore;
  if (!getAdminFirestore()) return memoryStore;
  return createResilientRepository(memoryStore, firestoreStore);
}

export async function getCreditOverridesForEmail(
  email: string | null | undefined
): Promise<MemberCreditOverrides> {
  if (!email?.trim()) return { ...EMPTY_MEMBER_CREDIT_OVERRIDES };
  try {
    const record = await getCreditGrantStore().get(email);
    return toOverrides(record);
  } catch {
    return { ...EMPTY_MEMBER_CREDIT_OVERRIDES };
  }
}

export async function setCreditOverridesForEmail(
  email: string,
  overrides: MemberCreditOverrides,
  updatedBy?: string
): Promise<MemberCreditOverrides> {
  try {
    const record = await getCreditGrantStore().set(email, overrides, updatedBy);
    return toOverrides(record);
  } catch (error) {
    // Last resort: keep the grant in this process so the current request
    // still sees it; memberships are the durable source of truth.
    console.warn(
      "[credit-grants] email store write failed; using memory",
      error instanceof Error ? error.message : error
    );
    const record = await memoryStore.set(email, overrides, updatedBy);
    return toOverrides(record);
  }
}

export async function listCreditGrantOverrides(): Promise<
  Map<string, MemberCreditOverrides>
> {
  const map = new Map<string, MemberCreditOverrides>();
  try {
    const rows = await getCreditGrantStore().list();
    for (const row of rows) {
      map.set(emailKey(row.email), toOverrides(row));
    }
  } catch {
    /* empty */
  }
  return map;
}
