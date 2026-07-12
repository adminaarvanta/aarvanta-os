import { slugifyBrand } from "@/lib/launch/brand";
import type { SiteDomainListing } from "@/types/site-builder";

const TLD_PRICING_GBP: Record<string, number> = {
  ".co.uk": 9.99,
  ".com": 12.99,
  ".uk": 8.99,
  ".shop": 14.99,
  ".store": 14.99,
  ".io": 34.99,
  ".co": 24.99,
};

const TLD_PRICING_USD: Record<string, number> = {
  ".com": 12.99,
  ".co": 24.99,
  ".shop": 14.99,
  ".store": 14.99,
  ".io": 34.99,
  ".net": 11.99,
};

function currencyForCountry(countryBase: string): "GBP" | "USD" {
  const c = countryBase.toUpperCase();
  return c === "UK" || c === "GB" ? "GBP" : "USD";
}

function priceForTld(tld: string, currency: "GBP" | "USD"): number {
  const table = currency === "GBP" ? TLD_PRICING_GBP : TLD_PRICING_USD;
  return table[tld] ?? (currency === "GBP" ? 12.99 : 12.99);
}

function defaultTlds(countryBase: string): string[] {
  const c = countryBase.toUpperCase();
  if (c === "UK" || c === "GB") {
    return [".co.uk", ".com", ".uk", ".shop", ".store"];
  }
  return [".com", ".co", ".shop", ".store", ".io"];
}

function parseDomainQuery(query: string): { label: string; tld: string } | null {
  const cleaned = query.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!cleaned || !cleaned.includes(".")) return null;
  const dot = cleaned.lastIndexOf(".");
  const label = cleaned.slice(0, dot).replace(/[^a-z0-9-]/g, "");
  const tld = cleaned.slice(dot);
  if (!label || !tld) return null;
  return { label, tld };
}

/** Deterministic availability check for demo — production uses Route 53 Domains API. */
function isDomainAvailable(domain: string, tld: string): boolean {
  const hash = `${domain}${tld}`.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const reserved = ["google", "facebook", "amazon", "microsoft", "apple"];
  if (reserved.some((r) => domain.includes(r))) return false;
  return hash % 5 !== 0;
}

export function searchDomainListings(input: {
  businessName: string;
  countryBase: string;
  query?: string;
}): SiteDomainListing[] {
  const currency = currencyForCountry(input.countryBase);
  const slug = slugifyBrand(input.businessName);

  if (input.query?.trim()) {
    const parsed = parseDomainQuery(input.query);
    if (parsed) {
      const domain = `${parsed.label}${parsed.tld}`;
      const available = isDomainAvailable(parsed.label, parsed.tld);
      return [
        {
          domain,
          tld: parsed.tld,
          available,
          priceAnnual: priceForTld(parsed.tld, currency),
          currency,
          note: available
            ? "Available — purchase through Aarvanta"
            : "Unavailable — try another name or TLD",
        },
      ];
    }
  }

  return defaultTlds(input.countryBase).map((tld, index) => {
    const label = slug;
    const available = isDomainAvailable(label, tld);
    return {
      domain: `${label}${tld}`,
      tld,
      available,
      priceAnnual: priceForTld(tld, currency),
      currency,
      note: available
        ? index < 2
          ? "Recommended — available via Aarvanta Domain Store"
          : "Available via Aarvanta Domain Store"
        : "Unavailable — try a variation",
    };
  });
}

export function formatDomainPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat(currency === "GBP" ? "en-GB" : "en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
