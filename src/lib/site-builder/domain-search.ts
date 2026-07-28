import { getDomainRegistrar, isLiveDomainRegistrar } from "@/lib/registrars";
import { wholesaleToRetail } from "@/lib/registrars/retail-pricing";
import type { DomainAvailabilityResult } from "@/lib/registrars/types";
import { searchDomainListings } from "@/lib/site-builder/domain-catalog";
import { slugifyBrand } from "@/lib/launch/brand";
import type { SiteDomainListing } from "@/types/site-builder";

/** Server-only domain search — may call name.com / OpenSRS. Do not import from client components. */

export type DomainSearchSource = "namecom" | "opensrs" | "demo";

export type DomainSearchResult = {
  listings: SiteDomainListing[];
  source: DomainSearchSource;
};

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

function toListings(
  results: DomainAvailabilityResult[],
  currency: "GBP" | "USD"
): SiteDomainListing[] {
  // Preserve caller order (preferred TLDs first, then suggestions).
  return results.slice(0, 25).map((hit, index) => {
    const tld = tldFromDomain(hit.domain);
    const wholesale = hit.wholesalePriceUsd;
    const priceAnnual =
      wholesale != null
        ? wholesaleToRetail({ wholesaleUsd: wholesale, currency })
        : priceForTld(tld || ".com", currency);

    let note: string;
    if (!hit.available) {
      note = hit.reason?.includes("Premium")
        ? "Unavailable (premium / restricted) — try another name"
        : "Unavailable — try another name or TLD";
    } else if (hit.isPremium) {
      note = "Premium domain — priced at registry rate + markup";
    } else if (index < 2) {
      note = "Recommended — live price from name.com";
    } else {
      note = "Available — live price from name.com";
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

/**
 * Search domains via the live registrar when configured; otherwise the demo catalog.
 * Prefer name.com keyword search so users see a real suggestion list.
 */
export async function searchDomainListingsAsync(input: {
  businessName: string;
  countryBase: string;
  query?: string;
}): Promise<DomainSearchResult> {
  if (!isLiveDomainRegistrar()) {
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
      return { listings: toListings(merged, currency), source };
    }

    const candidates = candidateDomains(input);
    const results = await registrar.checkAvailability(
      candidates.map((c) => c.domain)
    );
    const fallbackMap = new Map(results.map((r) => [r.domain.toLowerCase(), r]));

    const listings = candidates.map(({ domain, tld }, index) => {
      const hit = fallbackMap.get(domain.toLowerCase());
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
        note = "Recommended — live price from name.com";
      } else {
        note = "Available — live price from name.com";
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

    return { listings, source };
  } catch (err) {
    console.error(
      "[domains] Live registrar search failed, falling back to demo catalog",
      err
    );
    return { listings: searchDomainListings(input), source: "demo" };
  }
}
