import { extractTld, normalizeExternalDomain } from "@/lib/site-builder/dns-instructions";
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

/** Attach a domain the customer already owns — DNS configured at their registrar. */
export function toExternalDomainPreference(
  input: string,
  currency: string = "GBP"
): SiteDomainPurchase | null {
  const domain = normalizeExternalDomain(input);
  if (!domain) return null;
  return {
    status: "external",
    selectedDomain: domain,
    tld: extractTld(domain),
    currency,
    autoRenew: false,
    dnsStatus: "pending",
    connectedAt: new Date().toISOString(),
  };
}
