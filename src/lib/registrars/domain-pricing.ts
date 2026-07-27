import type { DomainRegistrantContact } from "@/lib/registrars/types";

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

/** Retail markup on wholesale USD (e.g. 30 → +30%). Default 25. */
export function getDomainRetailMarkupPct(): number {
  const raw = Number(env("DOMAIN_RETAIL_MARKUP_PCT") ?? "25");
  if (!Number.isFinite(raw) || raw < 0) return 25;
  return raw;
}

/** Fixed FX for converting wholesale USD → GBP retail. Default 0.79. */
export function getDomainUsdToGbpRate(): number {
  const raw = Number(env("DOMAIN_USD_TO_GBP_RATE") ?? "0.79");
  if (!Number.isFinite(raw) || raw <= 0) return 0.79;
  return raw;
}

/**
 * Default WHOIS / registrant contact for registrations.
 * Prefers DOMAIN_CONTACT_* → NAMECOM_CONTACT_* → OPENSRS_CONTACT_* → sensible UK defaults.
 */
export function getDefaultRegistrantContact(): DomainRegistrantContact {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = env(key);
      if (v) return v;
    }
    return undefined;
  };

  return {
    firstName: pick("DOMAIN_CONTACT_FIRST", "NAMECOM_CONTACT_FIRST", "OPENSRS_CONTACT_FIRST") ?? "Domain",
    lastName: pick("DOMAIN_CONTACT_LAST", "NAMECOM_CONTACT_LAST", "OPENSRS_CONTACT_LAST") ?? "Admin",
    orgName:
      pick("DOMAIN_CONTACT_ORG", "NAMECOM_CONTACT_ORG", "OPENSRS_CONTACT_ORG", "ORGANIZATION_NAME") ??
      "Aarvanta OS",
    email:
      pick("DOMAIN_CONTACT_EMAIL", "NAMECOM_CONTACT_EMAIL", "OPENSRS_CONTACT_EMAIL", "AUTH_EMAIL") ??
      "domains@aarvanta.co",
    phone: pick("DOMAIN_CONTACT_PHONE", "NAMECOM_CONTACT_PHONE", "OPENSRS_CONTACT_PHONE") ?? "+44.2000000000",
    address1:
      pick("DOMAIN_CONTACT_ADDRESS1", "NAMECOM_CONTACT_ADDRESS1", "OPENSRS_CONTACT_ADDRESS1") ??
      "1 Example Street",
    address2: pick("DOMAIN_CONTACT_ADDRESS2", "NAMECOM_CONTACT_ADDRESS2", "OPENSRS_CONTACT_ADDRESS2"),
    city: pick("DOMAIN_CONTACT_CITY", "NAMECOM_CONTACT_CITY", "OPENSRS_CONTACT_CITY") ?? "London",
    state: pick("DOMAIN_CONTACT_STATE", "NAMECOM_CONTACT_STATE", "OPENSRS_CONTACT_STATE") ?? "England",
    postalCode:
      pick("DOMAIN_CONTACT_POSTAL", "NAMECOM_CONTACT_POSTAL", "OPENSRS_CONTACT_POSTAL") ?? "EC1A 1BB",
    country: pick("DOMAIN_CONTACT_COUNTRY", "NAMECOM_CONTACT_COUNTRY", "OPENSRS_CONTACT_COUNTRY") ?? "GB",
  };
}
