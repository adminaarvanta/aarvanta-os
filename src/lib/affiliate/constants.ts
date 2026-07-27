import type { AffiliateRateCard } from "@/types/affiliate";

export const AFFILIATE_COOKIE = "aarvanta_aff";
export const DEFAULT_ATTRIBUTION_WINDOW_DAYS = 60;
export const EARNINGS_HOLD_DAYS = 14;
export const DEFAULT_CURRENCY = "GBP";

/** Map free-text country (register form) → region code used by rate cards. */
export function countryToRegionCode(country: string): string {
  const c = country.trim().toLowerCase();
  if (!c) return "global";
  if (
    c.includes("united kingdom") ||
    c === "uk" ||
    c === "gb" ||
    c.includes("britain")
  ) {
    return "uk";
  }
  if (
    c.includes("united states") ||
    c === "usa" ||
    c === "us" ||
    c.includes("america")
  ) {
    return "usa";
  }
  if (c.includes("india") || c === "in") return "india";
  if (c.includes("singapore") || c === "sg") return "sg";
  if (c.includes("australia") || c === "au") return "au";
  if (
    c.includes("germany") ||
    c.includes("france") ||
    c.includes("europe") ||
    c === "eu" ||
    c.includes("netherlands") ||
    c.includes("spain") ||
    c.includes("italy") ||
    c.includes("ireland")
  ) {
    return "eu";
  }
  if (c.includes("canada") || c === "ca") return "usa";
  if (c.includes("united arab") || c.includes("uae") || c.includes("dubai")) {
    return "global";
  }
  return "global";
}

function stamp(now: string): Omit<
  AffiliateRateCard,
  | "id"
  | "regionCode"
  | "maxDiscountPercent"
  | "defaultDiscountPercent"
  | "maxCpaAmount"
  | "defaultCpaAmount"
  | "maxCommissionPercent"
  | "defaultCommissionPercent"
  | "payoutMinimum"
> {
  return {
    currency: DEFAULT_CURRENCY,
    attributionWindowDays: DEFAULT_ATTRIBUTION_WINDOW_DAYS,
    updatedAt: now,
  };
}

/** Seed regional rate cards (admin can edit). */
export function buildDefaultRateCards(now: string): AffiliateRateCard[] {
  const base = stamp(now);
  return [
    {
      id: "rate_global",
      regionCode: "global",
      ...base,
      maxDiscountPercent: 15,
      defaultDiscountPercent: 10,
      maxCpaAmount: 25,
      defaultCpaAmount: 15,
      maxCommissionPercent: 20,
      defaultCommissionPercent: 15,
      payoutMinimum: 50,
    },
    {
      id: "rate_uk",
      regionCode: "uk",
      ...base,
      maxDiscountPercent: 20,
      defaultDiscountPercent: 10,
      maxCpaAmount: 30,
      defaultCpaAmount: 20,
      maxCommissionPercent: 25,
      defaultCommissionPercent: 15,
      payoutMinimum: 50,
    },
    {
      id: "rate_usa",
      regionCode: "usa",
      ...base,
      currency: "GBP",
      maxDiscountPercent: 15,
      defaultDiscountPercent: 10,
      maxCpaAmount: 35,
      defaultCpaAmount: 20,
      maxCommissionPercent: 20,
      defaultCommissionPercent: 12,
      payoutMinimum: 50,
    },
    {
      id: "rate_eu",
      regionCode: "eu",
      ...base,
      maxDiscountPercent: 15,
      defaultDiscountPercent: 10,
      maxCpaAmount: 28,
      defaultCpaAmount: 18,
      maxCommissionPercent: 22,
      defaultCommissionPercent: 15,
      payoutMinimum: 50,
    },
    {
      id: "rate_india",
      regionCode: "india",
      ...base,
      maxDiscountPercent: 25,
      defaultDiscountPercent: 15,
      maxCpaAmount: 12,
      defaultCpaAmount: 8,
      maxCommissionPercent: 20,
      defaultCommissionPercent: 12,
      payoutMinimum: 25,
    },
    {
      id: "rate_sg",
      regionCode: "sg",
      ...base,
      maxDiscountPercent: 15,
      defaultDiscountPercent: 10,
      maxCpaAmount: 30,
      defaultCpaAmount: 18,
      maxCommissionPercent: 20,
      defaultCommissionPercent: 15,
      payoutMinimum: 50,
    },
    {
      id: "rate_au",
      regionCode: "au",
      ...base,
      maxDiscountPercent: 15,
      defaultDiscountPercent: 10,
      maxCpaAmount: 30,
      defaultCpaAmount: 18,
      maxCommissionPercent: 20,
      defaultCommissionPercent: 15,
      payoutMinimum: 50,
    },
  ];
}

export function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

export function generateReferralCode(seed: string): string {
  const base = normalizeReferralCode(seed).slice(0, 8) || "PARTNER";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`.slice(0, 16);
}
