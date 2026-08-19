import { crmNow } from "@/lib/data/crm-helpers";
import {
  affiliateStore,
  buildTree,
  isDescendant,
  listChildren,
  listDescendants,
} from "@/lib/data/affiliate-store";
import {
  AFFILIATE_MAX_DEPTH,
  countryToRegionCode,
  DEFAULT_ATTRIBUTION_WINDOW_DAYS,
  DEFAULT_CURRENCY,
  EARNINGS_HOLD_DAYS,
  generateReferralCode,
  normalizeReferralCode,
} from "@/lib/affiliate/constants";
import type {
  Affiliate,
  AffiliateAttribution,
  AffiliateDownlineSummary,
  AffiliateEarning,
  AffiliateProfile,
  AffiliateRole,
  AffiliateRateCard,
  AffiliateSource,
  AffiliateTreeNode,
  ResolvedAffiliateRates,
} from "@/types/affiliate";

export {
  buildTree,
  isDescendant,
  listChildren,
  listDescendants,
};

export function affiliateRole(affiliate: Affiliate): AffiliateRole {
  return affiliate.role ?? "partner";
}

export function getAffiliateDepth(
  affiliates: Affiliate[],
  affiliateId: string
): number {
  const byId = new Map(affiliates.map((a) => [a.id, a]));
  let depth = 1;
  let current = byId.get(affiliateId);
  const seen = new Set<string>();
  while (current?.parentAffiliateId) {
    if (seen.has(current.id)) break;
    seen.add(current.id);
    depth += 1;
    current = byId.get(current.parentAffiliateId);
  }
  return depth;
}

/** Deepest depth among a node and all its descendants after reparenting. */
export function projectedMaxDepthAfterParent(
  affiliates: Affiliate[],
  affiliateId: string,
  newParentId: string | undefined
): number {
  const parentDepth = newParentId
    ? getAffiliateDepth(affiliates, newParentId)
    : 0;
  const selfDepth = parentDepth + 1;
  return selfDepth + maxSubtreeHeight(affiliates, affiliateId);
}

function maxSubtreeHeight(affiliates: Affiliate[], rootId: string): number {
  const kids = listChildren(affiliates, rootId);
  if (kids.length === 0) return 0;
  return 1 + Math.max(...kids.map((k) => maxSubtreeHeight(affiliates, k.id)));
}

export function assertValidParentAssignment(
  affiliates: Affiliate[],
  affiliateId: string,
  parentAffiliateId: string | undefined
): void {
  if (!parentAffiliateId) return;
  if (parentAffiliateId === affiliateId) {
    throw new Error("An affiliate cannot be its own parent.");
  }
  const parent = affiliates.find((a) => a.id === parentAffiliateId);
  if (!parent) throw new Error("Parent affiliate not found.");
  if (isDescendant(affiliates, affiliateId, parentAffiliateId)) {
    throw new Error("Cannot create a cycle in the affiliate hierarchy.");
  }
  const maxDepth = projectedMaxDepthAfterParent(
    affiliates,
    affiliateId,
    parentAffiliateId
  );
  if (maxDepth > AFFILIATE_MAX_DEPTH) {
    throw new Error(
      `Affiliate hierarchy cannot exceed ${AFFILIATE_MAX_DEPTH} levels.`
    );
  }
}

export function summarizeDownline(
  affiliates: Affiliate[],
  parentId: string
): AffiliateDownlineSummary[] {
  return listChildren(affiliates, parentId).map((child) => ({
    id: child.id,
    referralCode: child.referralCode,
    name: child.profile.name,
    email: child.profile.email,
    status: child.status,
    role: affiliateRole(child),
    regionCode: child.profile.regionCode,
    childCount: listChildren(affiliates, child.id).length,
  }));
}

export function scopedAffiliatesForManager(
  all: Affiliate[],
  manager: Affiliate
): Affiliate[] {
  const downline = listDescendants(all, manager.id);
  return [manager, ...downline];
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() < Date.now();
}

export async function resolveRatesForRegion(
  regionCode: string,
  affiliate?: Affiliate | null
): Promise<ResolvedAffiliateRates> {
  const cards = await affiliateStore.listRateCards();
  const override =
    affiliate?.rateCardOverrideId
      ? cards.find((c) => c.id === affiliate.rateCardOverrideId)
      : cards.find(
          (c) => c.affiliateId === affiliate?.id && c.regionCode === regionCode
        );
  const regional =
    cards.find((c) => !c.affiliateId && c.regionCode === regionCode) ??
    cards.find((c) => !c.affiliateId && c.regionCode === "global");

  if (!regional && !override) {
    return {
      regionCode: regionCode || "global",
      currency: DEFAULT_CURRENCY,
      discountPercent: 10,
      maxDiscountPercent: 15,
      cpaAmount: 15,
      commissionPercent: 15,
      attributionWindowDays: DEFAULT_ATTRIBUTION_WINDOW_DAYS,
      payoutMinimum: 50,
      rateCardId: "fallback",
    };
  }

  const base = regional!;
  const card = override ?? base;
  const maxDiscount = base.maxDiscountPercent;
  const maxCpa = base.maxCpaAmount;
  const maxCommission = base.maxCommissionPercent;

  return {
    regionCode: base.regionCode,
    currency: card.currency || base.currency,
    discountPercent: Math.min(card.defaultDiscountPercent, maxDiscount),
    maxDiscountPercent: maxDiscount,
    cpaAmount: Math.min(card.defaultCpaAmount, maxCpa),
    commissionPercent: Math.min(card.defaultCommissionPercent, maxCommission),
    attributionWindowDays:
      card.attributionWindowDays ||
      base.attributionWindowDays ||
      DEFAULT_ATTRIBUTION_WINDOW_DAYS,
    payoutMinimum: card.payoutMinimum ?? base.payoutMinimum,
    rateCardId: card.id,
  };
}

export async function applyAsExternalPartner(input: {
  name: string;
  email: string;
  country: string;
  company?: string;
  website?: string;
  phone?: string;
  marketingChannels?: string;
  /** Parent partner referral code (optional). */
  parentReferralCode?: string;
  userId?: string;
  tenantId?: string;
}): Promise<AffiliateApprovalResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await affiliateStore.getAffiliateByEmail(email);
  if (existing) {
    throw new Error("An affiliate account already exists for this email.");
  }

  const regionCode = countryToRegionCode(input.country);
  const code = await uniqueReferralCode(input.company || input.name);

  const { resolveAffiliateParentId } = await import(
    "@/lib/affiliate/platform-hierarchy"
  );
  const parentAffiliateId = await resolveAffiliateParentId(
    input.parentReferralCode
  );

  const now = crmNow();
  let affiliate = await affiliateStore.createAffiliate({
    referralCode: code,
    source: "external",
    status: "active",
    role: "partner",
    parentAffiliateId,
    userId: input.userId,
    tenantId: input.tenantId,
    approvedAt: now,
    profile: {
      name: input.name.trim(),
      email,
      company: input.company?.trim(),
      website: input.website?.trim(),
      phone: input.phone?.trim(),
      country: input.country.trim(),
      regionCode,
      marketingChannels: input.marketingChannels?.trim(),
    },
  });

  await affiliateStore.createAuditLog({
    action: "affiliate_apply",
    actorEmail: email,
    resourceType: "affiliate",
    resourceId: affiliate.id,
    detail: `Partner auto-activated (${affiliate.referralCode})`,
  });

  const activation = await ensurePartnerLoginAccess({
    affiliate,
    actorEmail: email,
  });
  affiliate =
    (await affiliateStore.getAffiliate(affiliate.id)) ?? activation.affiliate;

  try {
    const { listAffiliateAdminEmails } = await import("@/lib/affiliate/admin");
    const { sendAffiliateApplicationNotifyEmail } = await import(
      "@/lib/affiliate/send-activation-email"
    );
    const notify = await sendAffiliateApplicationNotifyEmail({
      to: listAffiliateAdminEmails(),
      applicantName: affiliate.profile.name,
      applicantEmail: email,
      company: affiliate.profile.company,
      country: affiliate.profile.country,
      referralCode: affiliate.referralCode,
    });
    if (notify.reason && notify.sent === 0) {
      console.info("[affiliate] application notify skipped", notify);
    }
  } catch (err) {
    console.warn("[affiliate] application notify failed", err);
  }

  return { affiliate, activation: activation.meta };
}

export async function optInAsCustomerAffiliate(input: {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  country: string;
  company?: string;
  parentReferralCode?: string;
}): Promise<Affiliate> {
  const email = input.email.trim().toLowerCase();
  const parentCode = input.parentReferralCode?.trim();
  if (parentCode) {
    const enrolled = await enrollReferredUserAsAffiliate({
      referralCode: parentCode,
      email,
      name: input.name,
      userId: input.userId,
      tenantId: input.tenantId,
      country: input.country,
      company: input.company,
    });
    if (enrolled) return enrolled;
  }

  const existing =
    (await affiliateStore.getAffiliateByUserId(input.userId)) ??
    (await affiliateStore.getAffiliateByEmail(email));
  if (existing) {
    if (existing.status === "rejected") {
      throw new Error("This affiliate account was rejected. Contact support.");
    }
    return existing;
  }

  const { resolveAffiliateParentId } = await import(
    "@/lib/affiliate/platform-hierarchy"
  );
  const parentAffiliateId = await resolveAffiliateParentId(undefined);
  const regionCode = countryToRegionCode(input.country);
  const now = crmNow();
  return affiliateStore.createAffiliate({
    referralCode: await uniqueReferralCode(input.name),
    source: "customer",
    status: "active",
    parentAffiliateId,
    userId: input.userId,
    tenantId: input.tenantId,
    profile: {
      name: input.name.trim(),
      email,
      company: input.company?.trim(),
      country: input.country.trim() || "United Kingdom",
      regionCode,
    },
    approvedAt: now,
  });
}

export async function updateAffiliateProfile(
  affiliateId: string,
  patch: Partial<AffiliateProfile>
): Promise<Affiliate> {
  const affiliate = await affiliateStore.getAffiliate(affiliateId);
  if (!affiliate) throw new Error("Affiliate not found.");

  const country = patch.country?.trim() || affiliate.profile.country;
  const updated: Affiliate = {
    ...affiliate,
    profile: {
      ...affiliate.profile,
      ...patch,
      email: patch.email
        ? patch.email.trim().toLowerCase()
        : affiliate.profile.email,
      country,
      regionCode: patch.country
        ? countryToRegionCode(country)
        : affiliate.profile.regionCode,
    },
    updatedAt: crmNow(),
  };
  return affiliateStore.saveAffiliate(updated);
}

export async function recordAffiliateClick(input: {
  code: string;
  landingPath?: string;
  userAgent?: string;
  ip?: string | null;
}) {
  const code = normalizeReferralCode(input.code);
  const affiliate = await affiliateStore.getAffiliateByCode(code);
  if (!affiliate || affiliate.status !== "active") {
    return { affiliate: null as Affiliate | null, click: null };
  }

  const { hashIp } = await import("@/lib/data/affiliate-store");
  const click = await affiliateStore.createClick({
    affiliateId: affiliate.id,
    referralCode: code,
    landingPath: input.landingPath,
    userAgent: input.userAgent?.slice(0, 240),
    ipHash: hashIp(input.ip ?? undefined),
  });
  return { affiliate, click };
}

export async function attributeSignup(input: {
  referralCode?: string | null;
  email: string;
  userId: string;
  tenantId: string;
  workspaceId: string;
  companyId: string;
  country: string;
}): Promise<{
  attribution: AffiliateAttribution | null;
  earning: AffiliateEarning | null;
  skippedReason?:
    | "missing_code"
    | "inactive_affiliate"
    | "self_referral"
    | undefined;
}> {
  const code = input.referralCode
    ? normalizeReferralCode(input.referralCode)
    : "";
  if (!code) {
    return {
      attribution: null,
      earning: null,
      skippedReason: "missing_code",
    };
  }

  const affiliate = await affiliateStore.getAffiliateByCode(code);
  if (!affiliate || affiliate.status !== "active") {
    return {
      attribution: null,
      earning: null,
      skippedReason: "inactive_affiliate",
    };
  }

  // Self-referral block
  if (
    affiliate.profile.email.toLowerCase() === input.email.trim().toLowerCase() ||
    (affiliate.userId && affiliate.userId === input.userId) ||
    (affiliate.tenantId && affiliate.tenantId === input.tenantId)
  ) {
    return {
      attribution: null,
      earning: null,
      skippedReason: "self_referral",
    };
  }

  const rates = await resolveRatesForRegion(
    countryToRegionCode(input.country) || affiliate.profile.regionCode,
    affiliate
  );
  const now = crmNow();
  const attribution = await affiliateStore.createAttribution({
    affiliateId: affiliate.id,
    referralCode: code,
    email: input.email.trim().toLowerCase(),
    userId: input.userId,
    tenantId: input.tenantId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    capturedAt: now,
    expiresAt: addDays(now, rates.attributionWindowDays),
  });

  const existingLead = await affiliateStore.findLeadByEmail(input.email);
  let earning: AffiliateEarning | null = null;

  if (!existingLead) {
    const lead = await affiliateStore.createLeadEvent({
      affiliateId: affiliate.id,
      attributionId: attribution.id,
      email: input.email.trim().toLowerCase(),
      tenantId: input.tenantId,
      status: "qualified",
      qualifiedAt: now,
    });

    earning = await affiliateStore.createEarning({
      affiliateId: affiliate.id,
      type: "cpa",
      status: "pending",
      amount: rates.cpaAmount,
      currency: rates.currency,
      tenantId: input.tenantId,
      email: input.email.trim().toLowerCase(),
      attributionId: attribution.id,
      leadEventId: lead.id,
      note: "Qualified lead CPA (free signup)",
    });
  } else {
    await affiliateStore.createLeadEvent({
      affiliateId: affiliate.id,
      attributionId: attribution.id,
      email: input.email.trim().toLowerCase(),
      tenantId: input.tenantId,
      status: "attributed",
    });
  }

  await affiliateStore.createAuditLog({
    action: "affiliate_signup_attributed",
    actorEmail: input.email.trim().toLowerCase(),
    resourceType: "affiliate",
    resourceId: affiliate.id,
    detail: earning
      ? `Signup attributed + CPA for ${input.email.trim().toLowerCase()}`
      : `Signup attributed (repeat email, no CPA) for ${input.email.trim().toLowerCase()}`,
  });

  return { attribution, earning };
}

async function uniqueReferralCode(seed: string): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    const code = generateReferralCode(seed);
    const clash = await affiliateStore.getAffiliateByCode(code);
    if (!clash) return code;
  }
  return generateReferralCode(`${seed}${Date.now()}`);
}

/**
 * Turn a referred signup into a working downline affiliate so they can share
 * their own /r/{code} link (depth-capped). Safe no-op if already enrolled.
 */
export async function enrollReferredUserAsAffiliate(input: {
  referralCode?: string | null;
  email: string;
  name: string;
  userId: string;
  tenantId: string;
  country: string;
  company?: string;
}): Promise<Affiliate | null> {
  const parentCode = input.referralCode
    ? normalizeReferralCode(input.referralCode)
    : "";
  if (!parentCode) return null;

  const parent = await affiliateStore.getAffiliateByCode(parentCode);
  if (!parent || parent.status !== "active") return null;

  const email = input.email.trim().toLowerCase();
  if (parent.profile.email.toLowerCase() === email) return null;
  if (parent.userId && parent.userId === input.userId) return null;

  const existing =
    (await affiliateStore.getAffiliateByUserId(input.userId)) ??
    (await affiliateStore.getAffiliateByEmail(email));
  if (existing) {
    if (
      !existing.parentAffiliateId &&
      existing.status !== "rejected" &&
      existing.id !== parent.id
    ) {
      const all = await affiliateStore.listAffiliates();
      try {
        assertValidParentAssignment(all, existing.id, parent.id);
        return affiliateStore.saveAffiliate({
          ...existing,
          parentAffiliateId: parent.id,
          userId: existing.userId ?? input.userId,
          tenantId: existing.tenantId ?? input.tenantId,
          updatedAt: crmNow(),
        });
      } catch {
        return existing;
      }
    }
    return existing;
  }

  const all = await affiliateStore.listAffiliates();
  const parentDepth = getAffiliateDepth(all, parent.id);
  if (parentDepth >= AFFILIATE_MAX_DEPTH) {
    console.info("[affiliate] skip downline enroll — parent at max depth", {
      email,
      parent: parent.referralCode,
    });
    return null;
  }

  const regionCode = countryToRegionCode(input.country) || parent.profile.regionCode;
  const now = crmNow();
  const created = await affiliateStore.createAffiliate({
    referralCode: await uniqueReferralCode(input.name || email),
    source: "customer",
    status: "active",
    role: "partner",
    parentAffiliateId: parent.id,
    userId: input.userId,
    tenantId: input.tenantId,
    profile: {
      name: input.name.trim() || email.split("@")[0] || "Partner",
      email,
      company: input.company?.trim(),
      country: input.country.trim() || parent.profile.country,
      regionCode,
    },
    approvedAt: now,
  });

  await affiliateStore.createAuditLog({
    action: "affiliate_downline_enroll",
    actorEmail: email,
    resourceType: "affiliate",
    resourceId: created.id,
    detail: `Enrolled under ${parent.referralCode}`,
  });

  return created;
}

export async function getActiveAttributionForTenant(tenantId: string) {
  const attr = await affiliateStore.getAttributionForTenant(tenantId);
  if (!attr || isExpired(attr.expiresAt)) return null;
  const affiliate = await affiliateStore.getAffiliate(attr.affiliateId);
  if (!affiliate || affiliate.status !== "active") return null;
  return { attribution: attr, affiliate };
}

export async function resolveCheckoutDiscount(input: {
  tenantId: string;
  buyerEmail?: string;
  buyerCountry?: string;
  isPartnerSelfPurchase?: boolean;
}): Promise<{
  affiliateId: string;
  referralCode: string;
  discountPercent: number;
  rates: ResolvedAffiliateRates;
} | null> {
  // Partner self-discount when the buyer is an active affiliate
  if (input.isPartnerSelfPurchase && input.buyerEmail) {
    const self = await affiliateStore.getAffiliateByEmail(input.buyerEmail);
    if (self && self.status === "active") {
      const rates = await resolveRatesForRegion(
        self.profile.regionCode,
        self
      );
      return {
        affiliateId: self.id,
        referralCode: self.referralCode,
        discountPercent: rates.discountPercent,
        rates,
      };
    }
  }

  const linked = await getActiveAttributionForTenant(input.tenantId);
  if (!linked) return null;

  const region =
    (input.buyerCountry && countryToRegionCode(input.buyerCountry)) ||
    linked.affiliate.profile.regionCode;
  const rates = await resolveRatesForRegion(region, linked.affiliate);
  return {
    affiliateId: linked.affiliate.id,
    referralCode: linked.affiliate.referralCode,
    discountPercent: rates.discountPercent,
    rates,
  };
}

export async function recordCommissionForPaidInvoice(input: {
  tenantId: string;
  amount: number;
  currency: string;
  stripeInvoiceId?: string;
  stripeCheckoutSessionId?: string;
  email?: string;
}): Promise<AffiliateEarning | null> {
  const linked = await getActiveAttributionForTenant(input.tenantId);
  if (!linked) return null;

  // First invoice only: skip if commission already exists for this tenant
  const existing = await affiliateStore.listEarningsByAffiliate(
    linked.affiliate.id
  );
  const alreadyCommissioned = existing.some(
    (e) =>
      e.type === "commission" &&
      e.tenantId === input.tenantId &&
      e.status !== "clawed_back"
  );
  if (alreadyCommissioned) return null;

  if (
    input.stripeCheckoutSessionId &&
    existing.some(
      (e) => e.stripeCheckoutSessionId === input.stripeCheckoutSessionId
    )
  ) {
    return null;
  }

  const rates = await resolveRatesForRegion(
    linked.affiliate.profile.regionCode,
    linked.affiliate
  );
  const amount =
    Math.round(((input.amount * rates.commissionPercent) / 100) * 100) / 100;

  return affiliateStore.createEarning({
    affiliateId: linked.affiliate.id,
    type: "commission",
    status: "pending",
    amount,
    currency: input.currency.toUpperCase() || rates.currency,
    tenantId: input.tenantId,
    email: input.email,
    attributionId: linked.attribution.id,
    stripeInvoiceId: input.stripeInvoiceId,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    eligibleAmount: input.amount,
    note: `Revenue share ${rates.commissionPercent}% of first invoice`,
  });
}

/** Approve pending earnings past the hold window. */
export async function approveMaturedEarnings(): Promise<number> {
  const all = await affiliateStore.listEarnings();
  const cutoff = Date.now() - EARNINGS_HOLD_DAYS * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const earning of all) {
    if (earning.status !== "pending") continue;
    if (new Date(earning.createdAt).getTime() > cutoff) continue;
    await affiliateStore.saveEarning({
      ...earning,
      status: "approved",
      approvedAt: crmNow(),
      updatedAt: crmNow(),
    });
    count += 1;
  }
  return count;
}

export function computeAffiliateBalance(earnings: AffiliateEarning[]): {
  pending: number;
  approved: number;
  paid: number;
  available: number;
  currency: string;
} {
  const currency = earnings[0]?.currency ?? DEFAULT_CURRENCY;
  let pending = 0;
  let approved = 0;
  let paid = 0;
  for (const e of earnings) {
    if (e.status === "pending") pending += e.amount;
    if (e.status === "approved") approved += e.amount;
    if (e.status === "paid") paid += e.amount;
  }
  return {
    pending: round2(pending),
    approved: round2(approved),
    paid: round2(paid),
    available: round2(approved),
    currency,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function requestPayout(input: {
  affiliateId: string;
  amount: number;
  method?: string;
  details?: string;
}): Promise<{ payout: Awaited<ReturnType<typeof affiliateStore.createPayout>> }> {
  await approveMaturedEarnings();
  const affiliate = await affiliateStore.getAffiliate(input.affiliateId);
  if (!affiliate || affiliate.status !== "active") {
    throw new Error("Affiliate is not active.");
  }

  const rates = await resolveRatesForRegion(
    affiliate.profile.regionCode,
    affiliate
  );
  const earnings = await affiliateStore.listEarningsByAffiliate(affiliate.id);
  const balance = computeAffiliateBalance(earnings);

  if (input.amount <= 0) throw new Error("Amount must be positive.");
  if (input.amount > balance.available) {
    throw new Error(
      `Insufficient approved balance (${balance.available} ${balance.currency}).`
    );
  }
  if (input.amount < rates.payoutMinimum) {
    throw new Error(
      `Minimum payout is ${rates.payoutMinimum} ${rates.currency}.`
    );
  }

  const open = (await affiliateStore.listPayoutsByAffiliate(affiliate.id)).some(
    (p) => p.status === "requested" || p.status === "approved"
  );
  if (open) {
    throw new Error("You already have an open payout request.");
  }

  const payout = await affiliateStore.createPayout({
    affiliateId: affiliate.id,
    amount: round2(input.amount),
    currency: balance.currency,
    status: "requested",
    method: input.method || affiliate.profile.payoutMethod,
    details: input.details || affiliate.profile.payoutDetails,
  });
  return { payout };
}

export type AffiliateApprovalResult = {
  affiliate: Affiliate;
  activation?: {
    needed: boolean;
    emailSent: boolean;
    activationUrl?: string;
    reason?: string;
  };
};

export async function adminSetAffiliateStatus(input: {
  affiliateId: string;
  status: "active" | "suspended" | "rejected";
  actorEmail: string;
  /** Optional hierarchy assignment on approve / status change. */
  parentAffiliateId?: string | null;
  role?: AffiliateRole;
}): Promise<AffiliateApprovalResult> {
  const affiliate = await affiliateStore.getAffiliate(input.affiliateId);
  if (!affiliate) throw new Error("Affiliate not found.");
  const now = crmNow();

  const all = await affiliateStore.listAffiliates();
  const nextParentId =
    input.parentAffiliateId === undefined
      ? affiliate.parentAffiliateId
      : input.parentAffiliateId === null
        ? undefined
        : input.parentAffiliateId;
  if (nextParentId !== affiliate.parentAffiliateId) {
    assertValidParentAssignment(all, affiliate.id, nextParentId);
  }

  let updated = await affiliateStore.saveAffiliate({
    ...affiliate,
    status: input.status,
    parentAffiliateId: nextParentId,
    role: input.role ?? affiliate.role ?? "partner",
    updatedAt: now,
    approvedAt: input.status === "active" ? now : affiliate.approvedAt,
  });

  await affiliateStore.createAuditLog({
    action:
      input.status === "active"
        ? "affiliate_approve"
        : input.status === "rejected"
          ? "affiliate_reject"
          : "affiliate_suspend",
    actorEmail: input.actorEmail,
    resourceType: "affiliate",
    resourceId: affiliate.id,
    detail: `Status → ${input.status}`,
  });

  if (input.status !== "active") {
    return { affiliate: updated };
  }

  const activation = await ensurePartnerLoginAccess({
    affiliate: updated,
    actorEmail: input.actorEmail,
  });
  updated =
    (await affiliateStore.getAffiliate(updated.id)) ?? activation.affiliate;

  return { affiliate: updated, activation: activation.meta };
}

/** Resend set-password email for an approved partner who has not set a password. */
export async function resendAffiliateActivation(input: {
  affiliateId: string;
  actorEmail: string;
}): Promise<AffiliateApprovalResult> {
  let affiliate = await affiliateStore.getAffiliate(input.affiliateId);
  if (!affiliate) throw new Error("Affiliate not found.");
  if (affiliate.status === "rejected" || affiliate.status === "suspended") {
    throw new Error(
      `Cannot send activation while affiliate is ${affiliate.status}.`
    );
  }

  // Pending partners can still receive a set-password link; activate them.
  if (affiliate.status === "pending") {
    affiliate = await affiliateStore.saveAffiliate({
      ...affiliate,
      status: "active",
      approvedAt: affiliate.approvedAt ?? crmNow(),
      updatedAt: crmNow(),
    });
  }

  if (affiliate.status !== "active") {
    throw new Error("Affiliate must be active before sending activation.");
  }

  const { hasUserPassword } = await import("@/lib/auth/user-credentials");
  if (await hasUserPassword(affiliate.profile.email)) {
    throw new Error("This partner already has a password. Ask them to sign in.");
  }

  const activation = await ensurePartnerLoginAccess({
    affiliate,
    actorEmail: input.actorEmail,
  });
  const updated =
    (await affiliateStore.getAffiliate(affiliate.id)) ?? activation.affiliate;
  return { affiliate: updated, activation: activation.meta };
}

export type AffiliateActivationResendRow = {
  affiliateId: string;
  email: string;
  name: string;
  emailSent: boolean;
  activationUrl?: string;
  reason?: string;
};

/** Resend set-password mail (or mint copyable links) for every partner still awaiting a password. */
export async function resendPendingAffiliateActivations(input: {
  actorEmail: string;
}): Promise<{
  emailed: number;
  failed: number;
  results: AffiliateActivationResendRow[];
}> {
  const all = await affiliateStore.listAffiliates();
  const { hasUserPassword } = await import("@/lib/auth/user-credentials");
  const results: AffiliateActivationResendRow[] = [];

  for (const affiliate of all) {
    if (affiliate.status === "rejected" || affiliate.status === "suspended") {
      continue;
    }
    const email = affiliate.profile?.email?.trim().toLowerCase();
    if (!email) continue;
    if (await hasUserPassword(email)) continue;

    try {
      const result = await resendAffiliateActivation({
        affiliateId: affiliate.id,
        actorEmail: input.actorEmail,
      });
      const activation = result.activation;
      results.push({
        affiliateId: affiliate.id,
        email,
        name: affiliate.profile.name,
        emailSent: Boolean(activation?.emailSent),
        activationUrl: activation?.activationUrl,
        reason: activation?.reason,
      });
    } catch (error) {
      results.push({
        affiliateId: affiliate.id,
        email,
        name: affiliate.profile.name,
        emailSent: false,
        reason: error instanceof Error ? error.message : "resend_failed",
      });
    }
  }

  return {
    emailed: results.filter((row) => row.emailSent).length,
    failed: results.filter((row) => !row.emailSent).length,
    results,
  };
}

async function membershipEmailMatches(
  userId: string,
  email: string
): Promise<{ ok: boolean; tenantId?: string }> {
  const { getTenantRepository } = await import("@/lib/data/tenant-store");
  const memberships =
    await getTenantRepository().listMembershipsForUser(userId);
  const key = email.trim().toLowerCase();
  const match = memberships.find(
    (m) => m.email.trim().toLowerCase() === key
  );
  if (!match) return { ok: false };
  return { ok: true, tenantId: match.tenantId };
}

async function ensurePartnerLoginAccess(input: {
  affiliate: Affiliate;
  actorEmail: string;
}): Promise<{
  affiliate: Affiliate;
  meta: NonNullable<AffiliateApprovalResult["activation"]>;
}> {
  const {
    provisionPartnerAccountWithoutPassword,
    mintAffiliateActivationToken,
    affiliateActivationExpiry,
  } = await import("@/lib/affiliate/provision-partner-account");
  const {
    sendAffiliateActivationEmail,
    sendAffiliateApprovedNoticeEmail,
  } = await import("@/lib/affiliate/send-activation-email");
  const {
    getUserCredentials,
    hasUserPassword,
  } = await import("@/lib/auth/user-credentials");
  const { getTenantRepository } = await import("@/lib/data/tenant-store");

  let affiliate = input.affiliate;
  const email = affiliate.profile.email.trim().toLowerCase();

  // Only skip set-password when they can already sign in with a password.
  // Google-only / empty credential records still need an activation link.
  if (await hasUserPassword(email)) {
    const existingCreds = await getUserCredentials(email);
    const memberships = existingCreds
      ? await getTenantRepository().listMembershipsForUser(existingCreds.userId)
      : [];
    const membership = memberships[0];
    affiliate = await affiliateStore.saveAffiliate({
      ...affiliate,
      userId: existingCreds?.userId ?? affiliate.userId,
      tenantId: membership?.tenantId ?? affiliate.tenantId,
      passwordSetAt: affiliate.passwordSetAt ?? crmNow(),
      updatedAt: crmNow(),
    });
    const notice = await sendAffiliateApprovedNoticeEmail({
      email,
      name: affiliate.profile.name,
    });
    return {
      affiliate,
      meta: {
        needed: false,
        emailSent: notice.sent,
        activationUrl: notice.url,
        reason: notice.sent ? undefined : notice.reason,
      },
    };
  }

  // Drop a wrongly attached userId (e.g. admin session linked on apply).
  if (affiliate.userId) {
    const linked = await membershipEmailMatches(affiliate.userId, email);
    if (!linked.ok) {
      affiliate = await affiliateStore.saveAffiliate({
        ...affiliate,
        userId: undefined,
        tenantId: undefined,
        updatedAt: crmNow(),
      });
    } else if (affiliate.tenantId !== linked.tenantId) {
      affiliate = await affiliateStore.saveAffiliate({
        ...affiliate,
        tenantId: linked.tenantId,
        updatedAt: crmNow(),
      });
    }
  }

  // Prefer credential userId when present (Google-only / incomplete password setup).
  if (!affiliate.userId || !affiliate.tenantId) {
    const existingCreds = await getUserCredentials(email);
    if (existingCreds?.userId) {
      const linked = await membershipEmailMatches(existingCreds.userId, email);
      if (linked.ok) {
        affiliate = await affiliateStore.saveAffiliate({
          ...affiliate,
          userId: existingCreds.userId,
          tenantId: linked.tenantId,
          updatedAt: crmNow(),
        });
      }
    }
  }

  // Always require a real membership — stale userId/tenantId alone is not enough.
  // Also covers Google-only credential rows that previously blocked provisioning.
  let membershipReady = false;
  if (affiliate.userId && affiliate.tenantId) {
    const linked = await membershipEmailMatches(affiliate.userId, email);
    membershipReady = linked.ok && linked.tenantId === affiliate.tenantId;
  }

  if (!membershipReady) {
    const existingCreds = await getUserCredentials(email);
    const provisioned = await provisionPartnerAccountWithoutPassword({
      email,
      name: affiliate.profile.name,
      country: affiliate.profile.country,
      companyName: affiliate.profile.company,
      phone: affiliate.profile.phone,
      preferredUserId: existingCreds?.userId ?? affiliate.userId,
    });
    affiliate = await affiliateStore.saveAffiliate({
      ...affiliate,
      userId: provisioned.userId,
      tenantId: provisioned.organizationId,
      updatedAt: crmNow(),
    });
  }

  const token =
    affiliate.activationToken || mintAffiliateActivationToken();
  const previousActivationTokens = [
    ...new Set(
      (affiliate.previousActivationTokens ?? []).filter((t) => t !== token)
    ),
  ].slice(-20);

  affiliate = await affiliateStore.saveAffiliate({
    ...affiliate,
    activationToken: token,
    previousActivationTokens,
    activationExpiresAt:
      affiliate.activationExpiresAt || affiliateActivationExpiry(),
    activationSentAt: crmNow(),
    updatedAt: crmNow(),
  });

  const emailResult = await sendAffiliateActivationEmail({
    email,
    name: affiliate.profile.name,
    token,
    expiresAt: affiliate.activationExpiresAt,
  });

  await affiliateStore.createAuditLog({
    action: "affiliate_activation_sent",
    actorEmail: input.actorEmail,
    resourceType: "affiliate",
    resourceId: affiliate.id,
    detail: emailResult.sent
      ? "Activation email sent"
      : `Activation link prepared (${emailResult.reason})`,
  });

  return {
    affiliate,
    meta: {
      needed: true,
      emailSent: emailResult.sent,
      activationUrl: emailResult.url,
      reason: emailResult.sent ? undefined : emailResult.reason,
    },
  };
}

function clampRateCardToCeiling(
  card: AffiliateRateCard,
  ceiling: AffiliateRateCard
): AffiliateRateCard {
  return {
    ...card,
    defaultDiscountPercent: Math.min(
      card.defaultDiscountPercent,
      ceiling.maxDiscountPercent
    ),
    defaultCpaAmount: Math.min(card.defaultCpaAmount, ceiling.maxCpaAmount),
    defaultCommissionPercent: Math.min(
      card.defaultCommissionPercent,
      ceiling.maxCommissionPercent
    ),
    maxDiscountPercent: Math.min(
      card.maxDiscountPercent,
      ceiling.maxDiscountPercent
    ),
    maxCpaAmount: Math.min(card.maxCpaAmount, ceiling.maxCpaAmount),
    maxCommissionPercent: Math.min(
      card.maxCommissionPercent,
      ceiling.maxCommissionPercent
    ),
  };
}

export async function adminUpsertRateCard(
  card: AffiliateRateCard,
  actorEmail: string,
  options?: {
    /** When set, only this regionCode may be written (regional manager). */
    restrictRegionCode?: string;
  }
) {
  if (
    options?.restrictRegionCode &&
    card.regionCode !== options.restrictRegionCode
  ) {
    throw new Error(
      `Regional managers may only edit the ${options.restrictRegionCode} rate card.`
    );
  }

  const cards = await affiliateStore.listRateCards();
  const global =
    cards.find((c) => !c.affiliateId && c.regionCode === "global") ?? null;
  const regional = cards.find(
    (c) => !c.affiliateId && c.regionCode === card.regionCode
  );

  // Affiliate overrides ≤ regional max; regional cards ≤ global/platform max.
  if (card.affiliateId && regional) {
    card = clampRateCardToCeiling(card, regional);
  } else if (!card.affiliateId && card.regionCode !== "global" && global) {
    card = clampRateCardToCeiling(card, global);
  }

  const saved = await affiliateStore.saveRateCard({
    ...card,
    updatedAt: crmNow(),
  });
  await affiliateStore.createAuditLog({
    action: "rate_card_upsert",
    actorEmail,
    resourceType: "rate_card",
    resourceId: saved.id,
    detail: `Upserted rate card for ${saved.regionCode}`,
  });
  return saved;
}

export async function adminAssignHierarchy(input: {
  affiliateId: string;
  actorEmail: string;
  parentAffiliateId?: string | null;
  role?: AffiliateRole;
}): Promise<Affiliate> {
  const affiliate = await affiliateStore.getAffiliate(input.affiliateId);
  if (!affiliate) throw new Error("Affiliate not found.");

  const all = await affiliateStore.listAffiliates();
  const nextParentId =
    input.parentAffiliateId === undefined
      ? affiliate.parentAffiliateId
      : input.parentAffiliateId === null
        ? undefined
        : input.parentAffiliateId;

  if (nextParentId !== affiliate.parentAffiliateId) {
    assertValidParentAssignment(all, affiliate.id, nextParentId);
  }

  const updated = await affiliateStore.saveAffiliate({
    ...affiliate,
    parentAffiliateId: nextParentId,
    role: input.role ?? affiliate.role ?? "partner",
    updatedAt: crmNow(),
  });

  await affiliateStore.createAuditLog({
    action: "affiliate_hierarchy",
    actorEmail: input.actorEmail,
    resourceType: "affiliate",
    resourceId: affiliate.id,
    detail: `Hierarchy updated (parent=${nextParentId ?? "root"}, role=${updated.role ?? "partner"})`,
  });
  return updated;
}

export async function adminUpdatePayout(input: {
  payoutId: string;
  status: "approved" | "rejected" | "paid";
  actorEmail: string;
  adminNote?: string;
}) {
  const payout = await affiliateStore.getPayout(input.payoutId);
  if (!payout) throw new Error("Payout not found.");

  const now = crmNow();
  const updated = await affiliateStore.savePayout({
    ...payout,
    status: input.status,
    adminNote: input.adminNote ?? payout.adminNote,
    updatedAt: now,
    paidAt: input.status === "paid" ? now : payout.paidAt,
  });

  if (input.status === "paid") {
    // Mark approved earnings as paid up to payout amount (FIFO)
    let remaining = payout.amount;
    const earnings = await affiliateStore.listEarningsByAffiliate(
      payout.affiliateId
    );
    const approved = earnings
      .filter((e) => e.status === "approved")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const earning of approved) {
      if (remaining <= 0) break;
      await affiliateStore.saveEarning({
        ...earning,
        status: "paid",
        paidAt: now,
        updatedAt: now,
      });
      remaining -= earning.amount;
    }
  }

  await affiliateStore.createAuditLog({
    action:
      input.status === "paid"
        ? "payout_paid"
        : input.status === "approved"
          ? "payout_approve"
          : "payout_reject",
    actorEmail: input.actorEmail,
    resourceType: "payout",
    resourceId: payout.id,
    detail: `Payout → ${input.status}`,
  });
  return updated;
}

export async function adminClawbackEarning(input: {
  earningId: string;
  actorEmail: string;
}) {
  const earning = await affiliateStore.getEarning(input.earningId);
  if (!earning) throw new Error("Earning not found.");
  const updated = await affiliateStore.saveEarning({
    ...earning,
    status: "clawed_back",
    updatedAt: crmNow(),
  });
  await affiliateStore.createAuditLog({
    action: "earning_clawback",
    actorEmail: input.actorEmail,
    resourceType: "earning",
    resourceId: earning.id,
    detail: `Clawed back ${earning.amount} ${earning.currency}`,
  });
  return updated;
}

export async function adminApproveEarning(input: {
  earningId: string;
  actorEmail: string;
}) {
  const earning = await affiliateStore.getEarning(input.earningId);
  if (!earning) throw new Error("Earning not found.");
  const updated = await affiliateStore.saveEarning({
    ...earning,
    status: "approved",
    approvedAt: crmNow(),
    updatedAt: crmNow(),
  });
  await affiliateStore.createAuditLog({
    action: "earning_approve",
    actorEmail: input.actorEmail,
    resourceType: "earning",
    resourceId: earning.id,
    detail: `Approved ${earning.amount} ${earning.currency}`,
  });
  return updated;
}

export async function buildAffiliateDashboard(affiliateId: string) {
  await approveMaturedEarnings();
  const affiliate = await affiliateStore.getAffiliate(affiliateId);
  if (!affiliate) return null;

  const [clicks, leads, earnings, payouts, rates, allAffiliates] =
    await Promise.all([
      affiliateStore.listClicksByAffiliate(affiliateId),
      affiliateStore.listLeadEventsByAffiliate(affiliateId),
      affiliateStore.listEarningsByAffiliate(affiliateId),
      affiliateStore.listPayoutsByAffiliate(affiliateId),
      resolveRatesForRegion(affiliate.profile.regionCode, affiliate),
      affiliateStore.listAffiliates(),
    ]);

  const downline = summarizeDownline(allAffiliates, affiliateId);
  const descendants = listDescendants(allAffiliates, affiliateId);
  const balance = computeAffiliateBalance(earnings);
  return {
    affiliate: {
      ...affiliate,
      role: affiliateRole(affiliate),
    },
    rates,
    balance,
    stats: {
      clicks: clicks.length,
      leads: leads.filter((l) => l.status === "qualified").length,
      conversions: earnings.filter((e) => e.type === "commission").length,
      downlineDirect: downline.length,
      downlineTotal: descendants.length,
    },
    downline,
    clicks: clicks.slice(0, 50),
    leads: leads.slice(0, 50),
    earnings,
    payouts,
  };
}

export type AffiliateSourceType = AffiliateSource;
export type { AffiliateTreeNode };
