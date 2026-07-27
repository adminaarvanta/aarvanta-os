import type { DomainRegistrantContact } from "@/lib/registrars/types";
import {
  getDefaultRegistrantContact,
  getDomainRetailMarkupPct,
  getDomainUsdToGbpRate,
} from "@/lib/registrars/domain-pricing";

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

export { getDefaultRegistrantContact, getDomainRetailMarkupPct, getDomainUsdToGbpRate };

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
