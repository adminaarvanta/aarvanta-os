import { isDemoMode } from "@/lib/config/app-mode";
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

function demoAvailable(domain: string): boolean {
  const hash = domain.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const reserved = ["google", "facebook", "amazon", "microsoft", "apple"];
  if (reserved.some((r) => domain.includes(r))) return false;
  return hash % 5 !== 0;
}

/**
 * Demo registrar — offline heuristic availability; register is a local stub.
 * Used in APP_MODE=demo or when OpenSRS credentials are absent.
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
 * OpenSRS when credentials are set (and not demo-only); otherwise offline demo.
 */
export function getDomainRegistrar(): DomainRegistrar {
  if (isDemoMode() && process.env.OPENSRS_FORCE_LIVE !== "true") {
    return new DemoDomainRegistrar();
  }
  if (!isOpenSrsConfigured()) {
    return new DemoDomainRegistrar();
  }
  const config = getOpenSrsConfig();
  if (!config) return new DemoDomainRegistrar();
  return createOpenSrsClient(config);
}

export function isLiveDomainRegistrar(): boolean {
  return getDomainRegistrar().id === "opensrs";
}

export type {
  DomainAvailabilityResult,
  DomainPriceResult,
  DomainRegistrar,
  RegisterDomainInput,
  RegisterDomainResult,
};
