import type { SiteDomainPurchase } from "@/types/site-builder";

export function toSelectedDomainPreference(listing: {
  domain: string;
  tld: string;
  priceAnnual: number;
  currency: string;
  autoRenew?: boolean;
}): SiteDomainPurchase {
  return {
    status: "selected",
    selectedDomain: listing.domain,
    tld: listing.tld,
    priceAnnual: listing.priceAnnual,
    currency: listing.currency,
    autoRenew: listing.autoRenew ?? true,
  };
}
