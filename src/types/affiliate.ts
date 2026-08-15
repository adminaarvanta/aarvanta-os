/** Partner & Affiliate System — see docs/AFFILIATE_PRD.md */

export type AffiliateSource = "external" | "customer";
export type AffiliateRole = "partner" | "regional_manager";
export type AffiliateStatus =
  | "pending"
  | "active"
  | "suspended"
  | "rejected";

export type AffiliateEarningType = "cpa" | "commission";
export type AffiliateEarningStatus =
  | "pending"
  | "approved"
  | "paid"
  | "clawed_back";

export type AffiliatePayoutStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "paid";

export type AffiliateLeadStatus =
  | "attributed"
  | "qualified"
  | "disqualified";

export interface AffiliateProfile {
  name: string;
  email: string;
  company?: string;
  website?: string;
  phone?: string;
  country: string;
  regionCode: string;
  taxId?: string;
  payoutMethod?: string;
  payoutDetails?: string;
  marketingChannels?: string;
}

export interface Affiliate {
  id: string;
  referralCode: string;
  source: AffiliateSource;
  status: AffiliateStatus;
  /** Hierarchy parent; omit/undefined for root. Max depth 3. */
  parentAffiliateId?: string;
  /** Defaults to partner when unset. */
  role?: AffiliateRole;
  userId?: string;
  tenantId?: string;
  profile: AffiliateProfile;
  /** When set, earnings/discounts use this card (must be ≤ region max). */
  rateCardOverrideId?: string;
  /** One-time set-password token after auto-activation (external partners). */
  activationToken?: string;
  activationExpiresAt?: string;
  activationSentAt?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
}

/** Nested affiliate for admin tree / downline views. */
export interface AffiliateTreeNode {
  affiliate: Affiliate;
  children: AffiliateTreeNode[];
}

export interface AffiliateDownlineSummary {
  id: string;
  referralCode: string;
  name: string;
  email: string;
  status: AffiliateStatus;
  role: AffiliateRole;
  regionCode: string;
  childCount: number;
}

export interface AffiliateClick {
  id: string;
  affiliateId: string;
  referralCode: string;
  landingPath?: string;
  userAgent?: string;
  ipHash?: string;
  createdAt: string;
}

export interface AffiliateAttribution {
  id: string;
  affiliateId: string;
  referralCode: string;
  email?: string;
  userId?: string;
  tenantId?: string;
  workspaceId?: string;
  companyId?: string;
  capturedAt: string;
  expiresAt: string;
  /** Click that produced this attribution, if known. */
  clickId?: string;
}

export interface AffiliateLeadEvent {
  id: string;
  affiliateId: string;
  attributionId: string;
  email: string;
  tenantId?: string;
  status: AffiliateLeadStatus;
  qualifiedAt?: string;
  createdAt: string;
}

export interface AffiliateEarning {
  id: string;
  affiliateId: string;
  type: AffiliateEarningType;
  status: AffiliateEarningStatus;
  amount: number;
  currency: string;
  /** Referred tenant / lead identifiers */
  tenantId?: string;
  email?: string;
  attributionId?: string;
  leadEventId?: string;
  stripeInvoiceId?: string;
  stripeCheckoutSessionId?: string;
  /** Eligible revenue the commission % was applied to */
  eligibleAmount?: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  paidAt?: string;
}

export interface AffiliatePayoutRequest {
  id: string;
  affiliateId: string;
  amount: number;
  currency: string;
  status: AffiliatePayoutStatus;
  method?: string;
  details?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}

export interface AffiliateRateCard {
  id: string;
  /** Region code (uk, usa, india, …) or `global` fallback */
  regionCode: string;
  /** When set, card applies only to this affiliate (override ≤ region max). */
  affiliateId?: string;
  currency: string;
  maxDiscountPercent: number;
  defaultDiscountPercent: number;
  maxCpaAmount: number;
  defaultCpaAmount: number;
  maxCommissionPercent: number;
  defaultCommissionPercent: number;
  attributionWindowDays: number;
  payoutMinimum: number;
  updatedAt: string;
}

export type AffiliateAuditAction =
  | "affiliate_apply"
  | "affiliate_approve"
  | "affiliate_reject"
  | "affiliate_suspend"
  | "affiliate_hierarchy"
  | "affiliate_activation_sent"
  | "affiliate_signup_attributed"
  | "rate_card_upsert"
  | "earning_approve"
  | "earning_clawback"
  | "payout_approve"
  | "payout_reject"
  | "payout_paid";

export interface AffiliateAuditLog {
  id: string;
  action: AffiliateAuditAction;
  actorEmail: string;
  resourceType: string;
  resourceId: string;
  detail: string;
  createdAt: string;
}

export interface ResolvedAffiliateRates {
  regionCode: string;
  currency: string;
  discountPercent: number;
  maxDiscountPercent: number;
  cpaAmount: number;
  commissionPercent: number;
  attributionWindowDays: number;
  payoutMinimum: number;
  rateCardId: string;
}
