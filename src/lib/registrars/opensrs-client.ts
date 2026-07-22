import { createHash, randomBytes } from "crypto";
import { getOpenSrsConfig, type OpenSrsConfig } from "@/lib/registrars/opensrs-config";
import {
  assoc,
  buildOpsEnvelope,
  parseOpsReply,
  type OpsValue,
} from "@/lib/registrars/opensrs-xml";
import type {
  DomainAvailabilityResult,
  DomainPriceResult,
  DomainRegistrantContact,
  DomainRegistrar,
  RegisterDomainInput,
  RegisterDomainResult,
} from "@/lib/registrars/types";

function md5Hex(input: string): string {
  return createHash("md5").update(input, "utf8").digest("hex");
}

/** OpenSRS X-Signature = md5(md5(xml + key) + key) */
export function signOpenSrsPayload(xml: string, apiKey: string): string {
  return md5Hex(md5Hex(xml + apiKey) + apiKey);
}

function contactAssoc(contact: DomainRegistrantContact): OpsValue {
  const entries: Record<string, OpsValue> = {
    first_name: contact.firstName,
    last_name: contact.lastName,
    org_name: contact.orgName,
    email: contact.email,
    phone: contact.phone,
    address1: contact.address1,
    city: contact.city,
    state: contact.state,
    postal_code: contact.postalCode,
    country: contact.country,
  };
  if (contact.address2) entries.address2 = contact.address2;
  return assoc(entries);
}

export class OpenSrsClient implements DomainRegistrar {
  readonly id = "opensrs" as const;

  constructor(private readonly config: OpenSrsConfig) {}

  async checkAvailability(domains: string[]): Promise<DomainAvailabilityResult[]> {
    const results: DomainAvailabilityResult[] = [];
    for (const domain of domains) {
      results.push(await this.lookupOne(domain));
    }
    return results;
  }

  async getPrice(domain: string, years = 1): Promise<DomainPriceResult> {
    const reply = await this.request("GET_PRICE", "DOMAIN", {
      domain,
      period: years,
      reg_type: "new",
    });

    if (!reply.isSuccess) {
      throw new Error(
        `OpenSRS get_price failed (${reply.responseCode}): ${reply.responseText}`
      );
    }

    const price = Number(reply.attributes.price);
    if (!Number.isFinite(price)) {
      throw new Error(`OpenSRS get_price returned invalid price for ${domain}`);
    }

    return {
      domain,
      periodYears: years,
      wholesalePriceUsd: price,
      isPremium:
        reply.attributes.is_registry_premium === "1" ||
        reply.attributes.reason === "Premium Name",
    };
  }

  async registerDomain(input: RegisterDomainInput): Promise<RegisterDomainResult> {
    const attributes: Record<string, OpsValue> = {
      domain: input.domain,
      period: input.years,
      reg_type: input.premiumPriceUsd != null ? "premium" : "new",
      handle: "process",
      auto_renew: input.autoRenew ? "1" : "0",
      reg_username: input.regUsername,
      reg_password: input.regPassword,
      custom_nameservers: "0",
      custom_tech_contact: "0",
      dns_template: "*blank*",
      f_lock_domain: "1",
      contact_set: assoc({
        owner: contactAssoc(input.contact),
        admin: contactAssoc(input.contact),
        billing: contactAssoc(input.contact),
        tech: contactAssoc(input.contact),
      }),
    };

    if (input.premiumPriceUsd != null) {
      attributes.premium_price_to_verify = input.premiumPriceUsd.toFixed(2);
    }

    const reply = await this.request("SW_REGISTER", "DOMAIN", attributes);

    if (!reply.isSuccess) {
      throw new Error(
        `OpenSRS register failed (${reply.responseCode}): ${reply.responseText}${
          reply.attributes.error ? ` — ${reply.attributes.error}` : ""
        }`
      );
    }

    const orderId =
      reply.attributes.id ||
      reply.attributes.queue_request_id ||
      reply.attributes.registration_code ||
      `opensrs-${input.domain}`;

    return {
      orderId: String(orderId),
      domain: input.domain,
      responseCode: reply.responseCode,
      responseText: reply.responseText,
      pending:
        Boolean(reply.attributes.forced_pending) ||
        Boolean(reply.attributes.async_reason) ||
        reply.responseCode === "250",
    };
  }

  private async lookupOne(domain: string): Promise<DomainAvailabilityResult> {
    const reply = await this.request("LOOKUP", "DOMAIN", {
      domain,
      no_cache: "1",
    });

    // LOOKUP returns is_success=1 for both available (210) and taken (211).
    const status = (reply.attributes.status ?? "").toLowerCase();
    const available = status === "available" || reply.responseCode === "210";
    const isPremium =
      reply.attributes.reason === "Premium Name" ||
      reply.attributes.is_registry_premium === "1";

    let wholesalePriceUsd: number | undefined;
    if (available) {
      try {
        const price = await this.getPrice(domain, 1);
        wholesalePriceUsd = price.wholesalePriceUsd;
      } catch {
        // Price is optional for search listings; availability still returned.
      }
    }

    return {
      domain,
      available,
      wholesalePriceUsd,
      isPremium,
      reason: reply.attributes.reason || reply.responseText,
    };
  }

  private async request(
    action: string,
    object: string,
    attributes: Record<string, OpsValue>
  ) {
    const xml = buildOpsEnvelope({ action, object, attributes });
    const signature = signOpenSrsPayload(xml, this.config.apiKey);
    const body = Buffer.from(xml, "utf8");

    const res = await fetch(this.config.host, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
        "Content-Length": String(body.length),
        "X-Username": this.config.username,
        "X-Signature": signature,
      },
      body,
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`OpenSRS HTTP ${res.status}: ${text.slice(0, 200)}`);
    }

    return parseOpsReply(text);
  }
}

export function createOpenSrsClient(config?: OpenSrsConfig): OpenSrsClient {
  const resolved = config ?? getOpenSrsConfig();
  if (!resolved) {
    throw new Error("OpenSRS is not configured");
  }
  return new OpenSrsClient(resolved);
}

/** Generate OpenSRS-safe registrant credentials for a domain order. */
export function generateRegistrantCredentials(domain: string): {
  regUsername: string;
  regPassword: string;
} {
  const base = domain
    .replace(/\./g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 12)
    .toLowerCase();
  const suffix = randomBytes(3).toString("hex");
  return {
    regUsername: `${base}${suffix}`.slice(0, 20) || `user${suffix}`,
    regPassword: `Aa1!${randomBytes(9).toString("base64url")}`,
  };
}
