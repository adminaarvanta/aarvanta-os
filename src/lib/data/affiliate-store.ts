import { createHash } from "crypto";
import { crmNewId, crmNow } from "@/lib/data/crm-helpers";
import { isDemoMode } from "@/lib/config/app-mode";
import { getAdminFirestore, isFirebaseConfigured } from "@/lib/firebase/admin";
import { buildDefaultRateCards } from "@/lib/affiliate/constants";
import type {
  Affiliate,
  AffiliateAttribution,
  AffiliateAuditLog,
  AffiliateClick,
  AffiliateEarning,
  AffiliateLeadEvent,
  AffiliatePayoutRequest,
  AffiliateRateCard,
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

function seedIfNeeded() {
  if (seeded) return;
  seeded = true;
  const now = crmNow();
  for (const card of buildDefaultRateCards(now)) {
    memory.affiliate_rate_cards.set(card.id, card);
  }
  const demo: Affiliate = {
    id: "aff_demo_partner",
    referralCode: "DEMOREF",
    source: "external",
    status: "active",
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
}

async function listAll<T>(collection: CollectionName): Promise<T[]> {
  seedIfNeeded();
  if (isMemoryBackend()) {
    return Array.from(memory[collection].values()) as T[];
  }
  const db = getAdminFirestore();
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
  const db = getAdminFirestore();
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
    const db = getAdminFirestore();
    if (db) await db.collection(collection).doc(item.id).set(item);
  }
  return item;
}

export function hashIp(ip: string | null | undefined): string | undefined {
  if (!ip) return undefined;
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export const affiliateStore = {
  async listAffiliates() {
    return listAll<Affiliate>("affiliates");
  },
  async getAffiliate(id: string) {
    return getById<Affiliate>("affiliates", id);
  },
  async getAffiliateByCode(code: string) {
    const normalized = code.trim().toUpperCase();
    const all = await listAll<Affiliate>("affiliates");
    return all.find((a) => a.referralCode === normalized) ?? null;
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
