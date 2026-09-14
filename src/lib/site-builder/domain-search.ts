import { getDomainRegistrar, isLiveDomainRegistrar } from "@/lib/registrars";
import { wholesaleToRetail } from "@/lib/registrars/retail-pricing";
import type { DomainAvailabilityResult } from "@/lib/registrars/types";
import { searchDomainListings } from "@/lib/site-builder/domain-catalog";
import { slugifyBrand } from "@/lib/launch/brand";
import type { SiteDomainListing } from "@/types/site-builder";

/** Server-only domain search — may call name.com / OpenSRS. Do not import from client components. */

export type DomainSearchSource = "namecom" | "opensrs" | "demo" | "unavailable";

export type DomainSearchResult = {
  listings: SiteDomainListing[];
  source: DomainSearchSource;
  message?: string;
};

const REGISTRAR_NOT_CONNECTED =
  "Live domain names and prices need name.com or OpenSRS credentials. Sample catalog is only shown in demo mode.";

const REGISTRAR_SEARCH_FAILED =
  "Live registrar search failed. Sample prices are not shown in production — retry or check credentials.";

function isProductionAppMode(): boolean {
  return process.env.APP_MODE === "production";
}

function registrarLabel(source: DomainSearchSource): string {
  if (source === "opensrs") return "OpenSRS";
  if (source === "namecom") return "name.com";
  return "the registrar";
}

function currencyForCountry(countryBase: string): "GBP" | "USD" {
  const c = countryBase.toUpperCase();
  return c === "UK" || c === "GB" ? "GBP" : "USD";
}

function defaultTlds(countryBase: string): string[] {
  const c = countryBase.toUpperCase();
  if (c === "UK" || c === "GB") {
    return [".co.uk", ".com", ".uk", ".shop", ".store"];
  }
  return [".com", ".co", ".shop", ".store", ".io"];
}

function parseDomainQuery(query: string): { label: string; tld: string } | null {
  const cleaned = query
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!cleaned || !cleaned.includes(".")) return null;
  const dot = cleaned.lastIndexOf(".");
  const label = cleaned.slice(0, dot).replace(/[^a-z0-9-]/g, "");
  const tld = cleaned.slice(dot);
  if (!label || !tld.startsWith(".") || tld.length < 3) return null;
  return { label, tld };
}

function keywordFromInput(input: {
  businessName: string;
  query?: string;
}): string {
  const q = input.query?.trim().toLowerCase() ?? "";
  if (q) {
    const parsed = parseDomainQuery(q);
    if (parsed) return parsed.label;
    return q.replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "") || slugifyBrand(input.businessName);
  }
  return slugifyBrand(input.businessName);
}

function candidateDomains(input: {
  businessName: string;
  countryBase: string;
  query?: string;
}): Array<{ domain: string; tld: string }> {
  const tlds = defaultTlds(input.countryBase);
  const q = input.query?.trim().toLowerCase();

  if (q) {
    const parsed = parseDomainQuery(q);
    if (parsed) {
      return [{ domain: `${parsed.label}${parsed.tld}`, tld: parsed.tld }];
    }
    const label = q.replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "");
    if (label) {
      return tlds.map((tld) => ({ domain: `${label}${tld}`, tld }));
    }
  }

  const slug = slugifyBrand(input.businessName);
  return tlds.map((tld) => ({ domain: `${slug}${tld}`, tld }));
}

function tldFromDomain(domain: string): string {
  const parts = domain.toLowerCase().split(".");
  if (parts.length >= 3 && parts[parts.length - 2] === "co") {
    return `.${parts.slice(-2).join(".")}`;
  }
  if (parts.length >= 2) return `.${parts[parts.length - 1]}`;
  return "";
}

function retailFromWholesale(
  wholesale: number | undefined,
  currency: "GBP" | "USD"
): number {
  if (wholesale == null || !Number.isFinite(wholesale)) return 0;
  return wholesaleToRetail({ wholesaleUsd: wholesale, currency });
}

function toListings(
  results: DomainAvailabilityResult[],
  currency: "GBP" | "USD",
  source: DomainSearchSource
): SiteDomainListing[] {
  const label = registrarLabel(source);
  // Preserve caller order (preferred TLDs first, then suggestions).
  return results.slice(0, 25).map((hit, index) => {
    const tld = tldFromDomain(hit.domain);
    const priceAnnual = retailFromWholesale(hit.wholesalePriceUsd, currency);
    const hasLivePrice = priceAnnual > 0;

    let note: string;
    if (!hit.available) {
      note = hit.reason?.includes("Premium")
        ? "Unavailable (premium / restricted) — try another name"
        : "Unavailable — try another name or TLD";
    } else if (!hasLivePrice) {
      note = `Available on ${label} — live price not returned; confirm at checkout`;
    } else if (hit.isPremium) {
      note = `Premium domain — live ${label} registry rate + markup`;
    } else if (index < 2) {
      note = `Recommended — live price from ${label}`;
    } else {
      note = `Available — live price from ${label}`;
    }

    return {
      domain: hit.domain,
      tld: tld || ".com",
      available: hit.available,
      priceAnnual,
      currency,
      note,
    };
  });
}

function listingFromHit(
  domain: string,
  tld: string,
  hit: DomainAvailabilityResult | undefined,
  currency: "GBP" | "USD",
  source: DomainSearchSource,
  index: number
): SiteDomainListing {
  const available = hit?.available ?? false;
  const priceAnnual = retailFromWholesale(hit?.wholesalePriceUsd, currency);
  const hasLivePrice = priceAnnual > 0;
  const label = registrarLabel(source);
  let note: string;
  if (!available) {
    note = hit?.reason?.includes("Premium")
      ? "Unavailable (premium / restricted) — try another name"
      : "Unavailable — try another name or TLD";
  } else if (!hasLivePrice) {
    note = `Available on ${label} — live price not returned; confirm at checkout`;
  } else if (hit?.isPremium) {
    note = `Premium domain — live ${label} registry rate + markup`;
  } else if (index < 2) {
    note = `Recommended — live price from ${label}`;
  } else {
    note = `Available — live price from ${label}`;
  }
  return {
    domain,
    tld,
    available,
    priceAnnual,
    currency,
    note,
  };
}

/**
 * Search domains via the live registrar when configured; otherwise the demo catalog.
 * Production never substitutes hardcoded TLD prices as if they were live quotes.
 */
export async function searchDomainListingsAsync(input: {
  businessName: string;
  countryBase: string;
  query?: string;
}): Promise<DomainSearchResult> {
  if (!isLiveDomainRegistrar()) {
    if (isProductionAppMode()) {
      return {
        listings: [],
        source: "unavailable",
        message: REGISTRAR_NOT_CONNECTED,
      };
    }
    return { listings: searchDomainListings(input), source: "demo" };
  }

  const currency = currencyForCountry(input.countryBase);
  const registrar = getDomainRegistrar();
  const source: DomainSearchSource =
    registrar.id === "namecom"
      ? "namecom"
      : registrar.id === "opensrs"
        ? "opensrs"
        : "demo";

  if (source === "demo") {
    if (isProductionAppMode()) {
      return {
        listings: [],
        source: "unavailable",
        message: REGISTRAR_NOT_CONNECTED,
      };
    }
    return { listings: searchDomainListings(input), source: "demo" };
  }

  try {
    const keyword = keywordFromInput(input);
    const tlds = defaultTlds(input.countryBase);
    const preferred = tlds.map((tld) => `${keyword}${tld}`);

    const suggestionPromise =
      typeof registrar.searchByKeyword === "function" && keyword
        ? registrar.searchByKeyword(keyword, { timeoutMs: 6_000 })
        : Promise.resolve([] as DomainAvailabilityResult[]);

    const [preferredHits, suggestions] = await Promise.all([
      registrar.checkAvailability(preferred),
      suggestionPromise,
    ]);

    const byDomain = new Map<string, DomainAvailabilityResult>();
    for (const hit of [...preferredHits, ...suggestions]) {
      const key = hit.domain.toLowerCase();
      const existing = byDomain.get(key);
      // Prefer priced / preferred TLD rows when merging.
      if (!existing || (hit.wholesalePriceUsd != null && existing.wholesalePriceUsd == null)) {
        byDomain.set(key, hit);
      }
    }

    if (byDomain.size > 0) {
      // Preferred TLDs first, then other suggestions.
      const preferredSet = new Set(preferred.map((d) => d.toLowerCase()));
      const merged = [
        ...preferred
          .map((d) => byDomain.get(d.toLowerCase()))
          .filter((h): h is DomainAvailabilityResult => Boolean(h)),
        ...[...byDomain.values()].filter(
          (h) => !preferredSet.has(h.domain.toLowerCase())
        ),
      ];
      return { listings: toListings(merged, currency, source), source };
    }

    const candidates = candidateDomains(input);
    const results = await registrar.checkAvailability(
      candidates.map((c) => c.domain)
    );
    const fallbackMap = new Map(results.map((r) => [r.domain.toLowerCase(), r]));

    const listings = candidates.map(({ domain, tld }, index) =>
      listingFromHit(domain, tld, fallbackMap.get(domain.toLowerCase()), currency, source, index)
    );

    return { listings, source };
  } catch (err) {
    console.error("[domains] Live registrar search failed", err);
    if (isProductionAppMode()) {
      return {
        listings: [],
        source: "unavailable",
        message: REGISTRAR_SEARCH_FAILED,
      };
    }
    return {
      listings: searchDomainListings(input),
      source: "demo",
      message: "Live registrar search failed — showing the demo catalog instead.",
    };
  }
}
