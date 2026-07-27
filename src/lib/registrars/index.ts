import {
  getNameComConfig,
  isNameComConfigured,
} from "@/lib/registrars/namecom-config";
import { createNameComClient } from "@/lib/registrars/namecom-client";
import {
  getOpenSrsConfig,
  isOpenSrsConfigured,
} from "@/lib/registrars/opensrs-config";
import { createOpenSrsClient } from "@/lib/registrars/opensrs-client";
import type {
  DomainAvailabilityResult,
  DomainPriceResult,
  DomainRegistrar,
  RegisterDomainInput,
  RegisterDomainResult,
} from "@/lib/registrars/types";

function isDemoAppMode(): boolean {
  // Avoid importing app-mode (pulls firebase-admin) — keep this package server-safe
  // and never transitively importable by client components.
  return process.env.APP_MODE !== "production";
}

function forceLiveRegistrar(): boolean {
  return (
    process.env.NAMECOM_FORCE_LIVE === "true" ||
    process.env.OPENSRS_FORCE_LIVE === "true"
  );
}

function demoAvailable(domain: string): boolean {
  const hash = domain.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const reserved = ["google", "facebook", "amazon", "microsoft", "apple"];
  if (reserved.some((r) => domain.includes(r))) return false;
  return hash % 5 !== 0;
}

/**
 * Demo registrar — offline heuristic availability; register is a local stub.
 * Used in APP_MODE=demo or when no live registrar credentials are present.
 */
class DemoDomainRegistrar implements DomainRegistrar {
  readonly id = "demo" as const;

  async checkAvailability(domains: string[]): Promise<DomainAvailabilityResult[]> {
    return domains.map((domain) => ({
      domain,
      available: demoAvailable(domain),
      wholesalePriceUsd: 10,
      reason: demoAvailable(domain) ? "Demo available" : "Demo unavailable",
    }));
  }

  async getPrice(domain: string, years = 1): Promise<DomainPriceResult> {
    return {
      domain,
      periodYears: years,
      wholesalePriceUsd: 10,
    };
  }

  async registerDomain(input: RegisterDomainInput): Promise<RegisterDomainResult> {
    return {
      orderId: `DEMO-${input.domain.replace(/\./g, "-").toUpperCase().slice(0, 24)}`,
      domain: input.domain,
      responseCode: "200",
      responseText: "Demo registration (no registrar call)",
    };
  }
}

/**
 * Resolve the active domain registrar.
 * Prefer name.com when configured; fall back to OpenSRS; otherwise offline demo.
 */
export function getDomainRegistrar(): DomainRegistrar {
  if (isDemoAppMode() && !forceLiveRegistrar()) {
    return new DemoDomainRegistrar();
  }

  if (isNameComConfigured()) {
    const config = getNameComConfig();
    if (config) return createNameComClient(config);
  }

  if (isOpenSrsConfigured()) {
    const config = getOpenSrsConfig();
    if (config) return createOpenSrsClient(config);
  }

  return new DemoDomainRegistrar();
}

export function isLiveDomainRegistrar(): boolean {
  const id = getDomainRegistrar().id;
  return id === "namecom" || id === "opensrs";
}

export type {
  DomainAvailabilityResult,
  DomainPriceResult,
  DomainRegistrar,
  RegisterDomainInput,
  RegisterDomainResult,
};
