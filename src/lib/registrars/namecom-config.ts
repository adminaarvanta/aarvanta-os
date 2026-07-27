import type { DomainRegistrantContact } from "@/lib/registrars/types";
import {
  getDefaultRegistrantContact,
  getDomainRetailMarkupPct,
  getDomainUsdToGbpRate,
} from "@/lib/registrars/domain-pricing";

export type NameComEnv = "test" | "live";

export type NameComConfig = {
  username: string;
  apiToken: string;
  env: NameComEnv;
  host: string;
  retailMarkupPct: number;
  usdToGbpRate: number;
  contact: DomainRegistrantContact;
  /** When false, premium domains are reported unavailable. Default true. */
  allowPremium: boolean;
};

const LIVE_HOST = "https://api.name.com";
const TEST_HOST = "https://api.dev.name.com";

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function getNameComEnv(): NameComEnv {
  return env("NAMECOM_ENV") === "live" ? "live" : "test";
}

export function isNameComConfigured(): boolean {
  const username = env("NAMECOM_USERNAME");
  if (!username) return false;
  const nameEnv = getNameComEnv();
  if (nameEnv === "live") return Boolean(env("NAMECOM_API_TOKEN"));
  return Boolean(env("NAMECOM_API_TOKEN_DEV") || env("NAMECOM_API_TOKEN"));
}

function resolveUsername(base: string, nameEnv: NameComEnv): string {
  if (nameEnv === "live") return base.replace(/-test$/i, "");
  if (/-test$/i.test(base)) return base;
  return `${base}-test`;
}

function resolveToken(nameEnv: NameComEnv): string | undefined {
  if (nameEnv === "live") return env("NAMECOM_API_TOKEN");
  return env("NAMECOM_API_TOKEN_DEV") || env("NAMECOM_API_TOKEN");
}

export function getNameComConfig(): NameComConfig | null {
  const baseUsername = env("NAMECOM_USERNAME");
  if (!baseUsername) return null;

  const nameEnv = getNameComEnv();
  const apiToken = resolveToken(nameEnv);
  if (!apiToken) return null;

  const allowPremiumRaw = env("DOMAIN_ALLOW_PREMIUM") ?? "true";
  const allowPremium = allowPremiumRaw !== "false" && allowPremiumRaw !== "0";

  return {
    username: resolveUsername(baseUsername, nameEnv),
    apiToken,
    env: nameEnv,
    host: nameEnv === "live" ? LIVE_HOST : TEST_HOST,
    retailMarkupPct: getDomainRetailMarkupPct(),
    usdToGbpRate: getDomainUsdToGbpRate(),
    contact: getDefaultRegistrantContact(),
    allowPremium,
  };
}

export type NameComRuntimeStatus =
  | { status: "live"; env: NameComEnv }
  | { status: "disabled"; reason: string };

export function getNameComRuntimeStatus(): NameComRuntimeStatus {
  if (!isNameComConfigured()) {
    return {
      status: "disabled",
      reason: "NAMECOM_USERNAME / API token not set",
    };
  }
  return { status: "live", env: getNameComEnv() };
}

export { getDefaultRegistrantContact };
