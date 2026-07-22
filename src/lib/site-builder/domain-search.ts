import { getDomainRegistrar, isLiveDomainRegistrar } from "@/lib/registrars";
import { wholesaleToRetail } from "@/lib/registrars/retail-pricing";
import { searchDomainListings } from "@/lib/site-builder/domain-catalog";
import { slugifyBrand } from "@/lib/launch/brand";
import type { SiteDomainListing } from "@/types/site-builder";

/** Server-only domain search — may call OpenSRS. Do not import from client components. */

function currencyForCountry(countryBase: string): "GBP" | "USD" {
  const c = countryBase.toUpperCase();
  return c === "UK" || c === "GB" ? "GBP" : "USD";
}

function priceForTld(tld: string, currency: "GBP" | "USD"): number {
  const gbp: Record<string, number> = {
    ".co.uk": 9.99,
    ".com": 12.99,
    ".uk": 8.99,
    ".shop": 14.99,
    ".store": 14.99,
    ".io": 34.99,
    ".co": 24.99,
  };
  const usd: Record<string, number> = {
    ".com": 12.99,
    ".co": 24.99,
    ".shop": 14.99,
    ".store": 14.99,
    ".io": 34.99,
    ".net": 11.99,
  };
  return (currency === "GBP" ? gbp : usd)[tld] ?? 12.99;
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

function candidateDomains(input: {
  businessName: string;
  countryBase: string;
  query?: string;
}): Array<{ domain: string; tld: string }> {
  const slug = slugifyBrand(input.businessName);
  if (input.query?.trim()) {
    const parsed = parseDomainQuery(input.query);
    if (parsed) {
      return [{ domain: `${parsed.label}${parsed.tld}`, tld: parsed.tld }];
    }
  }
  return defaultTlds(input.countryBase).map((tld) => ({
    domain: `${slug}${tld}`,
    tld,
  }));
}

/**
 * Search domains via OpenSRS when live; otherwise the demo catalog.
 * Retail price = wholesale USD × markup × FX (for GBP).
 */
export async function searchDomainListingsAsync(input: {
  businessName: string;
  countryBase: string;
  query?: string;
}): Promise<SiteDomainListing[]> {
  if (!isLiveDomainRegistrar()) {
    return searchDomainListings(input);
  }

  const currency = currencyForCountry(input.countryBase);
  const candidates = candidateDomains(input);
  const registrar = getDomainRegistrar();

  try {
    const results = await registrar.checkAvailability(candidates.map((c) => c.domain));
    const byDomain = new Map(results.map((r) => [r.domain.toLowerCase(), r]));

    return candidates.map(({ domain, tld }, index) => {
      const hit = byDomain.get(domain.toLowerCase());
      const available = hit?.available ?? false;
      const wholesale = hit?.wholesalePriceUsd;
      const priceAnnual =
        wholesale != null
          ? wholesaleToRetail({ wholesaleUsd: wholesale, currency })
          : priceForTld(tld, currency);

      let note: string;
      if (!available) {
        note = hit?.reason?.includes("Premium")
          ? "Unavailable (premium / restricted) — try another name"
          : "Unavailable — try another name or TLD";
      } else if (hit?.isPremium) {
        note = "Premium domain — priced at registry rate + markup";
      } else if (index < 2) {
        note = "Recommended — available via Aarvanta Domain Store";
      } else {
        note = "Available via Aarvanta Domain Store";
      }

      return {
        domain,
        tld,
        available,
        priceAnnual,
        currency,
        note,
      };
    });
  } catch (err) {
    console.error("[domains] OpenSRS search failed, falling back to demo catalog", err);
    return searchDomainListings(input);
  }
}
