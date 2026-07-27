import { randomUUID } from "crypto";
import {
  getNameComConfig,
  type NameComConfig,
} from "@/lib/registrars/namecom-config";
import type {
  DomainAvailabilityResult,
  DomainPriceResult,
  DomainRegistrantContact,
  DomainRegistrar,
  RegisterDomainInput,
  RegisterDomainResult,
} from "@/lib/registrars/types";

type NameComSearchResult = {
  domainName?: string;
  purchasable?: boolean;
  purchasePrice?: number;
  purchaseType?: string;
  premium?: boolean;
  renewalPrice?: number;
  reason?: string;
};

type NameComSearchResponse = {
  results?: NameComSearchResult[];
};

type NameComCreateResponse = {
  order?: number;
  totalPaid?: number;
  domain?: { domainName?: string };
  message?: string;
};

function contactPayload(contact: DomainRegistrantContact) {
  return {
    firstName: contact.firstName,
    lastName: contact.lastName,
    companyName: contact.orgName,
    address1: contact.address1,
    address2: contact.address2 || undefined,
    city: contact.city,
    state: contact.state,
    zip: contact.postalCode,
    country: contact.country,
    email: contact.email,
    phone: contact.phone,
  };
}

export class NameComClient implements DomainRegistrar {
  readonly id = "namecom" as const;

  constructor(private readonly config: NameComConfig) {}

  async checkAvailability(domains: string[]): Promise<DomainAvailabilityResult[]> {
    if (!domains.length) return [];

    // API allows up to 50 names per request.
    const chunks: string[][] = [];
    for (let i = 0; i < domains.length; i += 50) {
      chunks.push(domains.slice(i, i + 50));
    }

    const byDomain = new Map<string, DomainAvailabilityResult>();

    for (const chunk of chunks) {
      const data = await this.requestJson<NameComSearchResponse>(
        "POST",
        "/core/v1/domains:checkAvailability",
        {
          domainNames: chunk,
          purchaseType: "registration",
        }
      );

      for (const row of data.results ?? []) {
        const domain = (row.domainName ?? "").toLowerCase();
        if (!domain) continue;

        const isPremium = Boolean(row.premium);
        const purchasable =
          Boolean(row.purchasable) &&
          (row.purchaseType ?? "registration") === "registration" &&
          (this.config.allowPremium || !isPremium);

        byDomain.set(domain, {
          domain,
          available: purchasable,
          wholesalePriceUsd:
            typeof row.purchasePrice === "number" ? row.purchasePrice : undefined,
          isPremium,
          reason: purchasable
            ? undefined
            : row.reason ||
              (isPremium && !this.config.allowPremium
                ? "Premium domains disabled"
                : "Unavailable"),
        });
      }
    }

    return domains.map((domain) => {
      const key = domain.toLowerCase();
      return (
        byDomain.get(key) ?? {
          domain: key,
          available: false,
          reason: "No result from name.com",
        }
      );
    });
  }

  async getPrice(domain: string, years = 1): Promise<DomainPriceResult> {
    const [hit] = await this.checkAvailability([domain]);
    if (!hit?.available || hit.wholesalePriceUsd == null) {
      throw new Error(
        `name.com getPrice: ${domain} not purchasable (${hit?.reason ?? "unknown"})`
      );
    }

    // For non-premium registration, discovery price is the 1-year wholesale.
    // Multi-year: scale for retail estimates; create omits purchasePrice unless premium.
    const perYear = hit.wholesalePriceUsd;
    return {
      domain: domain.toLowerCase(),
      periodYears: years,
      wholesalePriceUsd: hit.isPremium ? perYear : perYear * years,
      isPremium: hit.isPremium,
    };
  }

  async registerDomain(input: RegisterDomainInput): Promise<RegisterDomainResult> {
    const domain = input.domain.toLowerCase();

    // Re-check immediately before create (name.com guidance).
    const [fresh] = await this.checkAvailability([domain]);
    if (!fresh?.available) {
      throw new Error(
        `name.com register failed: ${domain} not purchasable (${fresh?.reason ?? "unavailable"})`
      );
    }

    const contact = contactPayload(input.contact);
    const body: Record<string, unknown> = {
      domain: {
        domainName: domain,
        autorenewEnabled: input.autoRenew,
        locked: true,
        privacyEnabled: true,
        contacts: {
          registrant: contact,
          admin: contact,
          tech: contact,
          billing: contact,
        },
      },
      years: input.years,
      purchaseType: "registration",
    };

    if (fresh.isPremium || input.premiumPriceUsd != null) {
      const price = input.premiumPriceUsd ?? fresh.wholesalePriceUsd;
      if (price == null) {
        throw new Error(`name.com register failed: premium price required for ${domain}`);
      }
      body.purchasePrice = price;
    }

    const data = await this.requestJson<NameComCreateResponse>(
      "POST",
      "/core/v1/domains",
      body,
      { idempotencyKey: `register-${domain}-${input.years}-${input.regUsername || "aar"}` }
    );

    const orderId =
      data.order != null
        ? `namecom-${data.order}`
        : `namecom-${domain.replace(/\./g, "-")}`;

    return {
      orderId,
      domain,
      responseCode: "200",
      responseText: `Registered via name.com (paid USD ${data.totalPaid ?? "?"})`,
    };
  }

  /** Connectivity probe for health checks. */
  async hello(): Promise<{ ok: boolean; message?: string }> {
    try {
      const data = await this.requestJson<{ message?: string }>("GET", "/core/v1/hello");
      return { ok: true, message: data.message };
    } catch (err) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : "hello failed",
      };
    }
  }

  private async requestJson<T>(
    method: string,
    path: string,
    body?: unknown,
    opts?: { idempotencyKey?: string }
  ): Promise<T> {
    const url = `${this.config.host}${path}`;
    const auth = Buffer.from(
      `${this.config.username}:${this.config.apiToken}`,
      "utf8"
    ).toString("base64");

    const headers: Record<string, string> = {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (opts?.idempotencyKey) {
      headers["X-Idempotency-Key"] = opts.idempotencyKey.slice(0, 64) || randomUUID();
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      const message =
        json && typeof json === "object" && "message" in json
          ? String((json as { message: unknown }).message)
          : text.slice(0, 240);
      throw new Error(`name.com HTTP ${res.status}: ${message}`);
    }

    return (json ?? {}) as T;
  }
}

export function createNameComClient(config?: NameComConfig): NameComClient {
  const resolved = config ?? getNameComConfig();
  if (!resolved) {
    throw new Error("name.com is not configured");
  }
  return new NameComClient(resolved);
}
