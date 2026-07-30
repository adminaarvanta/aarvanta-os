import { crmNow } from "@/lib/data/crm-helpers";
import { affiliateStore } from "@/lib/data/affiliate-store";
import {
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
  AffiliateEarning,
  AffiliateProfile,
  AffiliateRateCard,
  AffiliateSource,
  ResolvedAffiliateRates,
} from "@/types/affiliate";

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
  userId?: string;
  tenantId?: string;
}): Promise<Affiliate> {
  const email = input.email.trim().toLowerCase();
  const existing = await affiliateStore.getAffiliateByEmail(email);
  if (existing) {
    throw new Error("An affiliate account already exists for this email.");
  }

  const regionCode = countryToRegionCode(input.country);
  const code = generateReferralCode(input.company || input.name);

  return affiliateStore.createAffiliate({
    referralCode: code,
    source: "external",
    status: "pending",
    userId: input.userId,
    tenantId: input.tenantId,
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
}

export async function optInAsCustomerAffiliate(input: {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  country: string;
  company?: string;
}): Promise<Affiliate> {
  const email = input.email.trim().toLowerCase();
  const existing =
    (await affiliateStore.getAffiliateByUserId(input.userId)) ??
    (await affiliateStore.getAffiliateByEmail(email));
  if (existing) {
    if (existing.status === "rejected") {
      throw new Error("This affiliate account was rejected. Contact support.");
    }
    return existing;
  }

  const regionCode = countryToRegionCode(input.country);
  const now = crmNow();
  return affiliateStore.createAffiliate({
    referralCode: generateReferralCode(input.name),
    source: "customer",
    status: "active",
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
}> {
  const code = input.referralCode
    ? normalizeReferralCode(input.referralCode)
    : "";
  if (!code) return { attribution: null, earning: null };

  const affiliate = await affiliateStore.getAffiliateByCode(code);
  if (!affiliate || affiliate.status !== "active") {
    return { attribution: null, earning: null };
  }

  // Self-referral block
  if (
    affiliate.profile.email.toLowerCase() === input.email.trim().toLowerCase() ||
    (affiliate.userId && affiliate.userId === input.userId) ||
    (affiliate.tenantId && affiliate.tenantId === input.tenantId)
  ) {
    return { attribution: null, earning: null };
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

  return { attribution, earning };
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
}): Promise<AffiliateApprovalResult> {
  const affiliate = await affiliateStore.getAffiliate(input.affiliateId);
  if (!affiliate) throw new Error("Affiliate not found.");
  const now = crmNow();

  let updated = await affiliateStore.saveAffiliate({
    ...affiliate,
    status: input.status,
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
  const affiliate = await affiliateStore.getAffiliate(input.affiliateId);
  if (!affiliate) throw new Error("Affiliate not found.");
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
    forceNewToken: true,
  });
  const updated =
    (await affiliateStore.getAffiliate(affiliate.id)) ?? activation.affiliate;
  return { affiliate: updated, activation: activation.meta };
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
  forceNewToken?: boolean;
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
      activationToken: undefined,
      activationExpiresAt: undefined,
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
    } else if (!affiliate.tenantId && linked.tenantId) {
      affiliate = await affiliateStore.saveAffiliate({
        ...affiliate,
        tenantId: linked.tenantId,
        updatedAt: crmNow(),
      });
    }
  }

  if (!affiliate.userId || !affiliate.tenantId) {
    const existingCreds = await getUserCredentials(email);
    if (existingCreds?.userId) {
      const linked = await membershipEmailMatches(existingCreds.userId, email);
      affiliate = await affiliateStore.saveAffiliate({
        ...affiliate,
        userId: existingCreds.userId,
        tenantId: linked.tenantId ?? affiliate.tenantId,
        updatedAt: crmNow(),
      });
    }
  }

  if (!affiliate.userId || !affiliate.tenantId) {
    const provisioned = await provisionPartnerAccountWithoutPassword({
      email,
      name: affiliate.profile.name,
      country: affiliate.profile.country,
      companyName: affiliate.profile.company,
      phone: affiliate.profile.phone,
    });
    affiliate = await affiliateStore.saveAffiliate({
      ...affiliate,
      userId: provisioned.userId,
      tenantId: provisioned.organizationId,
      updatedAt: crmNow(),
    });
  }

  const token =
    input.forceNewToken || !affiliate.activationToken
      ? mintAffiliateActivationToken()
      : affiliate.activationToken;
  const expiresAt =
    input.forceNewToken || !affiliate.activationExpiresAt
      ? affiliateActivationExpiry()
      : affiliate.activationExpiresAt;

  affiliate = await affiliateStore.saveAffiliate({
    ...affiliate,
    activationToken: token,
    activationExpiresAt: expiresAt,
    activationSentAt: crmNow(),
    updatedAt: crmNow(),
  });

  const emailResult = await sendAffiliateActivationEmail({
    email,
    name: affiliate.profile.name,
    token,
    expiresAt,
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

export async function adminUpsertRateCard(
  card: AffiliateRateCard,
  actorEmail: string
) {
  // Enforce overrides cannot exceed regional max
  if (card.affiliateId) {
    const cards = await affiliateStore.listRateCards();
    const regional = cards.find(
      (c) => !c.affiliateId && c.regionCode === card.regionCode
    );
    if (regional) {
      card = {
        ...card,
        defaultDiscountPercent: Math.min(
          card.defaultDiscountPercent,
          regional.maxDiscountPercent
        ),
        defaultCpaAmount: Math.min(
          card.defaultCpaAmount,
          regional.maxCpaAmount
        ),
        defaultCommissionPercent: Math.min(
          card.defaultCommissionPercent,
          regional.maxCommissionPercent
        ),
        maxDiscountPercent: Math.min(
          card.maxDiscountPercent,
          regional.maxDiscountPercent
        ),
        maxCpaAmount: Math.min(card.maxCpaAmount, regional.maxCpaAmount),
        maxCommissionPercent: Math.min(
          card.maxCommissionPercent,
          regional.maxCommissionPercent
        ),
      };
    }
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

  const [clicks, leads, earnings, payouts, rates] = await Promise.all([
    affiliateStore.listClicksByAffiliate(affiliateId),
    affiliateStore.listLeadEventsByAffiliate(affiliateId),
    affiliateStore.listEarningsByAffiliate(affiliateId),
    affiliateStore.listPayoutsByAffiliate(affiliateId),
    resolveRatesForRegion(affiliate.profile.regionCode, affiliate),
  ]);

  const balance = computeAffiliateBalance(earnings);
  return {
    affiliate,
    rates,
    balance,
    stats: {
      clicks: clicks.length,
      leads: leads.filter((l) => l.status === "qualified").length,
      conversions: earnings.filter((e) => e.type === "commission").length,
    },
    clicks: clicks.slice(0, 50),
    leads: leads.slice(0, 50),
    earnings,
    payouts,
  };
}

export type AffiliateSourceType = AffiliateSource;
