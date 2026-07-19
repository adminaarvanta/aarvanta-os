import type { SiteDnsRecordInstruction } from "@/types/site-builder";

/** CNAME target for www / subdomains (Vercel-style). Override via env in production. */
export const AARVANTA_SITES_CNAME_TARGET =
  process.env.NEXT_PUBLIC_AARVANTA_SITES_CNAME_TARGET ?? "cname.sites.aarvanta.cloud";

/**
 * Apex A-record target (shared edge / load balancer IP).
 * Set NEXT_PUBLIC_AARVANTA_SITES_APEX_IPV4 in production once EC2/ALB is live.
 * Default uses TEST-NET-3 (RFC 5737) so demos never point at a real third party.
 */
export const AARVANTA_SITES_APEX_IPV4 =
  process.env.NEXT_PUBLIC_AARVANTA_SITES_APEX_IPV4 ?? "203.0.113.10";

const MULTI_PART_TLDS = [".co.uk", ".org.uk", ".ac.uk", ".com.au"] as const;

const DOMAIN_RE =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function normalizeExternalDomain(input: string): string | null {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
  if (!cleaned || cleaned.includes(" ") || !DOMAIN_RE.test(cleaned)) return null;
  return cleaned;
}

export function extractTld(domain: string): string {
  for (const tld of MULTI_PART_TLDS) {
    if (domain.endsWith(tld)) return tld;
  }
  const parts = domain.split(".");
  if (parts.length < 2) return "";
  return `.${parts[parts.length - 1]}`;
}

function apexOf(domain: string): string {
  for (const tld of MULTI_PART_TLDS) {
    if (domain.endsWith(tld)) {
      const without = domain.slice(0, -tld.length);
      const labels = without.split(".").filter(Boolean);
      return `${labels[labels.length - 1]}${tld}`;
    }
  }
  const parts = domain.split(".");
  return parts.slice(-2).join(".");
}

function isApexDomain(domain: string): boolean {
  return domain === apexOf(domain);
}

/**
 * DNS records the customer must add at their domain provider (GoDaddy, Namecheap,
 * Cloudflare, Google Domains, etc.) — same pattern as Vercel custom domains.
 */
export function buildDnsInstructions(domain: string): SiteDnsRecordInstruction[] {
  const normalized = normalizeExternalDomain(domain);
  if (!normalized) return [];

  const apex = apexOf(normalized);
  const withoutWww =
    normalized.startsWith("www.") && normalized.slice(4) === apex
      ? apex
      : normalized;

  // Subdomain only (e.g. shop.brand.com) → single CNAME
  if (!isApexDomain(withoutWww) && withoutWww !== apex) {
    const host = withoutWww.slice(0, -(apex.length + 1));
    return [
      {
        type: "CNAME",
        host: host || withoutWww,
        value: AARVANTA_SITES_CNAME_TARGET,
        ttl: "3600",
        purpose: `Point ${withoutWww} to Aarvanta Hosting`,
      },
    ];
  }

  // Apex (+ www) — Vercel-style A + CNAME pair
  return [
    {
      type: "A",
      host: "@",
      value: AARVANTA_SITES_APEX_IPV4,
      ttl: "3600",
      purpose: `Point ${apex} (root domain) to Aarvanta Hosting`,
    },
    {
      type: "CNAME",
      host: "www",
      value: AARVANTA_SITES_CNAME_TARGET,
      ttl: "3600",
      purpose: `Point www.${apex} to Aarvanta Hosting`,
    },
  ];
}

export const DNS_PROVIDER_GUIDE = [
  "Open your domain provider dashboard (GoDaddy, Namecheap, Cloudflare, Google Domains, Route 53, etc.).",
  "Find DNS settings — usually labelled DNS, DNS Management, or Manage DNS.",
  "Add the records below exactly (host / name, type, and value).",
  "Save changes. Propagation usually takes a few minutes; it can take up to 48 hours.",
] as const;
