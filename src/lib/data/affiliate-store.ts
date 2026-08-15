import { createHash } from "crypto";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { isDemoMode } from "@/lib/config/app-mode";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import {
  buildDefaultRateCards,
  PLATFORM_ROOT_EMAIL,
} from "@/lib/affiliate/constants";
import { DEMO_ORG_AARVANTA } from "@/lib/data/tenant-demo-seed";
import type {
  Affiliate,
  AffiliateAttribution,
  AffiliateAuditLog,
  AffiliateClick,
  AffiliateEarning,
  AffiliateLeadEvent,
  AffiliatePayoutRequest,
  AffiliateRateCard,
  AffiliateTreeNode,
} from "@/types/affiliate";

type CollectionName =
  | "affiliates"
  | "affiliate_clicks"
  | "affiliate_attributions"
  | "affiliate_lead_events"
  | "affiliate_earnings"
  | "affiliate_payout_requests"
  | "affiliate_rate_cards"
  | "affiliate_audit_logs";

const memory: Record<CollectionName, Map<string, unknown>> = {
  affiliates: new Map(),
  affiliate_clicks: new Map(),
  affiliate_attributions: new Map(),
  affiliate_lead_events: new Map(),
  affiliate_earnings: new Map(),
  affiliate_payout_requests: new Map(),
  affiliate_rate_cards: new Map(),
  affiliate_audit_logs: new Map(),
};

let seeded = false;

function isMemoryBackend() {
  return isDemoMode() || !isFirebaseConfigured();
}

/** Firestore client when not on the in-memory backend. Throws if misconfigured. */
function requireFirestoreDb() {
  if (isMemoryBackend()) return null;
  const db = getAdminFirestore();
  if (!db) {
    throw new Error(
      "Affiliate store requires Firestore in production. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }
  return db;
}

function seedIfNeeded() {
  if (seeded) return;
  seeded = true;
  const now = crmNow();
  for (const card of buildDefaultRateCards(now)) {
    memory.affiliate_rate_cards.set(card.id, card);
  }
  const root: Affiliate = {
    id: "aff_platform_root",
    referralCode: "AARVANTA",
    source: "internal",
    status: "active",
    role: "partner",
    tenantId: DEMO_ORG_AARVANTA,
    profile: {
      name: "Aarvanta",
      email: "admin@aarvanta.co",
      company: "Aarvanta",
      country: "United Kingdom",
      regionCode: "uk",
    },
    createdAt: now,
    updatedAt: now,
    approvedAt: now,
  };
  memory.affiliates.set(root.id, root);

  const team: Array<{
    id: string;
    code: string;
    name: string;
    email: string;
    userId: string;
  }> = [
    {
      id: "aff_team_pavan",
      code: "TEAMPAVAN",
      name: "Pavan",
      email: "pavan@aarvanta.com",
      userId: "user_pavan",
    },
    {
      id: "aff_team_sarah",
      code: "TEAMSARAH",
      name: "Sarah Chen",
      email: "sarah.chen@meridian.io",
      userId: "user_sarah",
    },
    {
      id: "aff_team_john",
      code: "TEAMJOHN",
      name: "John Reeves",
      email: "john@aarvanta.com",
      userId: "user_john",
    },
    {
      id: "aff_team_priya",
      code: "TEAMPRIYA",
      name: "Priya Shah",
      email: "priya@aarvanta.com",
      userId: "user_priya",
    },
    {
      id: "aff_team_elena",
      code: "TEAMELENA",
      name: "Elena Rossi",
      email: "elena@aarvanta.com",
      userId: "user_elena",
    },
    {
      id: "aff_team_tom",
      code: "TEAMTOM",
      name: "Tom Hughes",
      email: "tom@aarvanta.com",
      userId: "user_tom",
    },
  ];
  for (const person of team) {
    memory.affiliates.set(person.id, {
      id: person.id,
      referralCode: person.code,
      source: "internal",
      status: "active",
      role: "partner",
      parentAffiliateId: root.id,
      userId: person.userId,
      tenantId: DEMO_ORG_AARVANTA,
      profile: {
        name: person.name,
        email: person.email,
        company: "Aarvanta",
        country: "United Kingdom",
        regionCode: "uk",
      },
      createdAt: now,
      updatedAt: now,
      approvedAt: now,
    });
  }

  const demo: Affiliate = {
    id: "aff_demo_partner",
    referralCode: "DEMOREF",
    source: "external",
    status: "active",
    role: "regional_manager",
    parentAffiliateId: root.id,
    profile: {
      name: "Demo Partner",
      email: "partner@demo.aarvanta.com",
      company: "Demo Agency",
      website: "https://aarvanta.com",
      country: "United Kingdom",
      regionCode: "uk",
      payoutMethod: "bank_transfer",
      marketingChannels: "Content, LinkedIn",
    },
    createdAt: now,
    updatedAt: now,
    approvedAt: now,
  };
  memory.affiliates.set(demo.id, demo);
  const demoChild: Affiliate = {
    id: "aff_demo_child",
    referralCode: "DEMOCH1",
    source: "external",
    status: "active",
    role: "partner",
    parentAffiliateId: demo.id,
    profile: {
      name: "Demo Sub-Partner",
      email: "subpartner@demo.aarvanta.com",
      company: "Demo Sub Agency",
      country: "United Kingdom",
      regionCode: "uk",
    },
    createdAt: now,
    updatedAt: now,
    approvedAt: now,
  };
  memory.affiliates.set(demoChild.id, demoChild);
}

async function listAll<T>(collection: CollectionName): Promise<T[]> {
  seedIfNeeded();
  if (isMemoryBackend()) {
    return Array.from(memory[collection].values()) as T[];
  }
  const db = requireFirestoreDb();
  if (!db) {
    return Array.from(memory[collection].values()) as T[];
  }
  const snap = await db.collection(collection).get();
  const items = snap.docs.map((d) => d.data() as T);
  if (collection === "affiliate_rate_cards" && items.length === 0) {
    const cards = buildDefaultRateCards(crmNow());
    for (const card of cards) {
      await db.collection(collection).doc(card.id).set(card);
    }
    return cards as T[];
  }
  return items;
}

async function getById<T>(
  collection: CollectionName,
  id: string
): Promise<T | null> {
  seedIfNeeded();
  if (isMemoryBackend()) {
    return (memory[collection].get(id) as T) ?? null;
  }
  const db = requireFirestoreDb();
  if (!db) return (memory[collection].get(id) as T) ?? null;
  const snap = await db.collection(collection).doc(id).get();
  return snap.exists ? (snap.data() as T) : null;
}

async function saveDoc<T extends { id: string }>(
  collection: CollectionName,
  item: T
): Promise<T> {
  seedIfNeeded();
  memory[collection].set(item.id, item);
  if (!isMemoryBackend()) {
    const db = requireFirestoreDb();
    if (!db) {
      throw new Error(
        "Affiliate store requires Firestore in production. Check FIREBASE_* configuration."
      );
    }
    await db.collection(collection).doc(item.id).set(item);
  }
  return item;
}

export function hashIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/** Pure hierarchy helpers (also re-exported via service). */
export function listChildren(
  affiliates: Affiliate[],
  parentId: string
): Affiliate[] {
  return affiliates
    .filter((a) => a.parentAffiliateId === parentId)
    .sort((a, b) => a.profile.name.localeCompare(b.profile.name));
}

export function isDescendant(
  affiliates: Affiliate[],
  ancestorId: string,
  maybeDescendantId: string
): boolean {
  if (ancestorId === maybeDescendantId) return false;
  const byId = new Map(affiliates.map((a) => [a.id, a]));
  let current = byId.get(maybeDescendantId);
  const seen = new Set<string>();
  while (current?.parentAffiliateId) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    if (current.parentAffiliateId === ancestorId) return true;
    current = byId.get(current.parentAffiliateId);
  }
  return false;
}

export function listDescendants(
  affiliates: Affiliate[],
  rootId: string
): Affiliate[] {
  const result: Affiliate[] = [];
  const queue = listChildren(affiliates, rootId);
  while (queue.length > 0) {
    const next = queue.shift()!;
    result.push(next);
    queue.push(...listChildren(affiliates, next.id));
  }
  return result;
}

export function buildTree(affiliates: Affiliate[]): AffiliateTreeNode[] {
  const byParent = new Map<string | undefined, Affiliate[]>();
  for (const a of affiliates) {
    const key = a.parentAffiliateId;
    const list = byParent.get(key) ?? [];
    list.push(a);
    byParent.set(key, list);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.profile.name.localeCompare(b.profile.name));
  }

  const ids = new Set(affiliates.map((a) => a.id));
  function nodeFor(affiliate: Affiliate): AffiliateTreeNode {
    const children = (byParent.get(affiliate.id) ?? []).map(nodeFor);
    return { affiliate, children };
  }

  // Roots: no parent, or parent missing from the scoped set
  const roots = affiliates.filter(
    (a) => !a.parentAffiliateId || !ids.has(a.parentAffiliateId)
  );
  roots.sort((a, b) => {
    const aRoot = a.profile.email.toLowerCase() === PLATFORM_ROOT_EMAIL;
    const bRoot = b.profile.email.toLowerCase() === PLATFORM_ROOT_EMAIL;
    if (aRoot !== bRoot) return aRoot ? -1 : 1;
    return a.profile.name.localeCompare(b.profile.name);
  });
  return roots.map(nodeFor);
}

export const affiliateStore = {
  async listAffiliates() {
    return listAll<Affiliate>("affiliates");
  },
  async getAffiliate(id: string) {
    return getById<Affiliate>("affiliates", id);
  },
  async getAffiliateByCode(code: string) {
    const { normalizeReferralCode } = await import("@/lib/affiliate/constants");
    const normalized = normalizeReferralCode(code);
    if (!normalized) return null;
    const all = await listAll<Affiliate>("affiliates");
    return (
      all.find((a) => normalizeReferralCode(a.referralCode) === normalized) ??
      null
    );
  },
  async getAffiliateByEmail(email: string) {
    const key = email.trim().toLowerCase();
    const all = await listAll<Affiliate>("affiliates");
    return all.find((a) => a.profile.email.toLowerCase() === key) ?? null;
  },
  async getAffiliateByUserId(userId: string) {
    const all = await listAll<Affiliate>("affiliates");
    return all.find((a) => a.userId === userId) ?? null;
  },
  async getAffiliateByActivationToken(token: string) {
    const key = token.trim();
    if (!key) return null;

    if (!isMemoryBackend()) {
      const db = requireFirestoreDb();
      if (db) {
        const snap = await db
          .collection("affiliates")
          .where("activationToken", "==", key)
          .limit(1)
          .get();
        if (!snap.empty) {
          return snap.docs[0]!.data() as Affiliate;
        }
      }
    }

    const all = await listAll<Affiliate>("affiliates");
    return all.find((a) => a.activationToken === key) ?? null;
  },
  async listChildren(parentId: string) {
    const all = await listAll<Affiliate>("affiliates");
    return listChildren(all, parentId);
  },
  async listDescendants(rootId: string) {
    const all = await listAll<Affiliate>("affiliates");
    return listDescendants(all, rootId);
  },
  async buildTree(scoped?: Affiliate[]) {
    const all = scoped ?? (await listAll<Affiliate>("affiliates"));
    return buildTree(all);
  },
  async isDescendant(ancestorId: string, maybeDescendantId: string) {
    const all = await listAll<Affiliate>("affiliates");
    return isDescendant(all, ancestorId, maybeDescendantId);
  },

  async saveAffiliate(item: Affiliate) {
    return saveDoc("affiliates", item);
  },
  async createAffiliate(
    input: Omit<Affiliate, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    }
  ) {
    const now = crmNow();
    const item: Affiliate = {
      ...input,
      role: input.role ?? "partner",
      id: input.id ?? crmNewId("aff"),
      createdAt: now,
      updatedAt: now,
    };
    return saveDoc("affiliates", item);
  },

  async saveClick(item: AffiliateClick) {
    return saveDoc("affiliate_clicks", item);
  },
  async createClick(
    input: Omit<AffiliateClick, "id" | "createdAt"> & { id?: string }
  ) {
    const item: AffiliateClick = {
      ...input,
      id: input.id ?? crmNewId("aclk"),
      createdAt: crmNow(),
    };
    return saveDoc("affiliate_clicks", item);
  },
  async listClicksByAffiliate(affiliateId: string) {
    const all = await listAll<AffiliateClick>("affiliate_clicks");
    return all
      .filter((c) => c.affiliateId === affiliateId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async saveAttribution(item: AffiliateAttribution) {
    return saveDoc("affiliate_attributions", item);
  },
  async createAttribution(
    input: Omit<AffiliateAttribution, "id"> & { id?: string }
  ) {
    const item: AffiliateAttribution = {
      ...input,
      id: input.id ?? crmNewId("aattr"),
    };
    return saveDoc("affiliate_attributions", item);
  },
  async listAttributions() {
    return listAll<AffiliateAttribution>("affiliate_attributions");
  },
  async getAttributionForTenant(tenantId: string) {
    const all = await listAll<AffiliateAttribution>("affiliate_attributions");
    return (
      all
        .filter((a) => a.tenantId === tenantId)
        .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0] ?? null
    );
  },
  async getAttributionForEmail(email: string) {
    const key = email.trim().toLowerCase();
    const all = await listAll<AffiliateAttribution>("affiliate_attributions");
    return (
      all
        .filter((a) => a.email?.toLowerCase() === key)
        .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0] ?? null
    );
  },

  async saveLeadEvent(item: AffiliateLeadEvent) {
    return saveDoc("affiliate_lead_events", item);
  },
  async createLeadEvent(
    input: Omit<AffiliateLeadEvent, "id" | "createdAt"> & { id?: string }
  ) {
    const item: AffiliateLeadEvent = {
      ...input,
      id: input.id ?? crmNewId("alead"),
      createdAt: crmNow(),
    };
    return saveDoc("affiliate_lead_events", item);
  },
  async listLeadEvents() {
    return listAll<AffiliateLeadEvent>("affiliate_lead_events");
  },
  async listLeadEventsByAffiliate(affiliateId: string) {
    const all = await listAll<AffiliateLeadEvent>("affiliate_lead_events");
    return all
      .filter((e) => e.affiliateId === affiliateId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async findLeadByEmail(email: string) {
    const key = email.trim().toLowerCase();
    const all = await listAll<AffiliateLeadEvent>("affiliate_lead_events");
    return all.find((e) => e.email.toLowerCase() === key) ?? null;
  },

  async saveEarning(item: AffiliateEarning) {
    return saveDoc("affiliate_earnings", item);
  },
  async createEarning(
    input: Omit<AffiliateEarning, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    }
  ) {
    const now = crmNow();
    const item: AffiliateEarning = {
      ...input,
      id: input.id ?? crmNewId("aearn"),
      createdAt: now,
      updatedAt: now,
    };
    return saveDoc("affiliate_earnings", item);
  },
  async listEarnings() {
    return listAll<AffiliateEarning>("affiliate_earnings");
  },
  async listEarningsByAffiliate(affiliateId: string) {
    const all = await listAll<AffiliateEarning>("affiliate_earnings");
    return all
      .filter((e) => e.affiliateId === affiliateId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getEarning(id: string) {
    return getById<AffiliateEarning>("affiliate_earnings", id);
  },

  async savePayout(item: AffiliatePayoutRequest) {
    return saveDoc("affiliate_payout_requests", item);
  },
  async createPayout(
    input: Omit<AffiliatePayoutRequest, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    }
  ) {
    const now = crmNow();
    const item: AffiliatePayoutRequest = {
      ...input,
      id: input.id ?? crmNewId("apay"),
      createdAt: now,
      updatedAt: now,
    };
    return saveDoc("affiliate_payout_requests", item);
  },
  async listPayouts() {
    return listAll<AffiliatePayoutRequest>("affiliate_payout_requests");
  },
  async listPayoutsByAffiliate(affiliateId: string) {
    const all = await listAll<AffiliatePayoutRequest>(
      "affiliate_payout_requests"
    );
    return all
      .filter((p) => p.affiliateId === affiliateId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getPayout(id: string) {
    return getById<AffiliatePayoutRequest>("affiliate_payout_requests", id);
  },

  async listRateCards() {
    return listAll<AffiliateRateCard>("affiliate_rate_cards");
  },
  async getRateCard(id: string) {
    return getById<AffiliateRateCard>("affiliate_rate_cards", id);
  },
  async saveRateCard(item: AffiliateRateCard) {
    return saveDoc("affiliate_rate_cards", item);
  },

  async createAuditLog(
    input: Omit<AffiliateAuditLog, "id" | "createdAt"> & { id?: string }
  ) {
    const item: AffiliateAuditLog = {
      ...input,
      id: input.id ?? crmNewId("aaud"),
      createdAt: crmNow(),
    };
    return saveDoc("affiliate_audit_logs", item);
  },
  async listAuditLogs() {
    const all = await listAll<AffiliateAuditLog>("affiliate_audit_logs");
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};
