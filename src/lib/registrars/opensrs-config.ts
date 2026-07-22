import type { DomainRegistrantContact } from "@/lib/registrars/types";

export type OpenSrsEnv = "test" | "live";

export type OpenSrsConfig = {
  username: string;
  apiKey: string;
  env: OpenSrsEnv;
  host: string;
  retailMarkupPct: number;
  usdToGbpRate: number;
  contact: DomainRegistrantContact;
};

const LIVE_HOST = "https://rr-n1-tor.opensrs.net:55443";
const TEST_HOST = "https://horizon.opensrs.net:55443";

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function isOpenSrsConfigured(): boolean {
  return Boolean(env("OPENSRS_USERNAME") && env("OPENSRS_API_KEY"));
}

export function getOpenSrsEnv(): OpenSrsEnv {
  return env("OPENSRS_ENV") === "live" ? "live" : "test";
}

/** Retail markup on wholesale USD (e.g. 30 → +30%). Default 25. */
export function getDomainRetailMarkupPct(): number {
  const raw = Number(env("DOMAIN_RETAIL_MARKUP_PCT") ?? "25");
  if (!Number.isFinite(raw) || raw < 0) return 25;
  return raw;
}

/** Fixed FX for converting OpenSRS USD wholesale → GBP retail. Default 0.79. */
export function getDomainUsdToGbpRate(): number {
  const raw = Number(env("DOMAIN_USD_TO_GBP_RATE") ?? "0.79");
  if (!Number.isFinite(raw) || raw <= 0) return 0.79;
  return raw;
}

export function getDefaultRegistrantContact(): DomainRegistrantContact {
  return {
    firstName: env("OPENSRS_CONTACT_FIRST") ?? "Domain",
    lastName: env("OPENSRS_CONTACT_LAST") ?? "Admin",
    orgName: env("OPENSRS_CONTACT_ORG") ?? env("ORGANIZATION_NAME") ?? "Aarvanta OS",
    email: env("OPENSRS_CONTACT_EMAIL") ?? env("AUTH_EMAIL") ?? "domains@aarvanta.co",
    phone: env("OPENSRS_CONTACT_PHONE") ?? "+44.2000000000",
    address1: env("OPENSRS_CONTACT_ADDRESS1") ?? "1 Example Street",
    address2: env("OPENSRS_CONTACT_ADDRESS2"),
    city: env("OPENSRS_CONTACT_CITY") ?? "London",
    state: env("OPENSRS_CONTACT_STATE") ?? "England",
    postalCode: env("OPENSRS_CONTACT_POSTAL") ?? "EC1A 1BB",
    country: env("OPENSRS_CONTACT_COUNTRY") ?? "GB",
  };
}

export function getOpenSrsConfig(): OpenSrsConfig | null {
  const username = env("OPENSRS_USERNAME");
  const apiKey = env("OPENSRS_API_KEY");
  if (!username || !apiKey) return null;

  const opensrsEnv = getOpenSrsEnv();
  return {
    username,
    apiKey,
    env: opensrsEnv,
    host: opensrsEnv === "live" ? LIVE_HOST : TEST_HOST,
    retailMarkupPct: getDomainRetailMarkupPct(),
    usdToGbpRate: getDomainUsdToGbpRate(),
    contact: getDefaultRegistrantContact(),
  };
}

export type OpenSrsRuntimeStatus =
  | { status: "live"; env: OpenSrsEnv }
  | { status: "disabled"; reason: string };

export function getOpenSrsRuntimeStatus(): OpenSrsRuntimeStatus {
  if (!isOpenSrsConfigured()) {
    return {
      status: "disabled",
      reason: "OPENSRS_USERNAME / OPENSRS_API_KEY not set",
    };
  }
  return { status: "live", env: getOpenSrsEnv() };
}
