import { crmNow, crmNewId } from "@/lib/data/crm-helpers";
import type { DomainOrder, SiteDomainPurchase } from "@/types/site-builder";
import type { TenantScope } from "@/types/communication";

export function createDomainPurchaseOrder(input: {
  scope: TenantScope;
  domain: string;
  tld: string;
  priceAnnual: number;
  currency: string;
  autoRenew: boolean;
  buildJobId?: string;
}): DomainOrder {
  const now = crmNow();
  const purchasedAt = now;
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  return {
    ...input.scope,
    id: crmNewId("domain"),
    domain: input.domain,
    tld: input.tld,
    priceAnnual: input.priceAnnual,
    currency: input.currency,
    status: "completed",
    registrarOrderId: `AAR-DOM-${crmNewId("ord").replace("ord_", "").toUpperCase()}`,
    buildJobId: input.buildJobId,
    purchasedAt,
    expiresAt,
    autoRenew: input.autoRenew,
  };
}

export function toPurchasedDomainPreference(
  order: DomainOrder,
  autoRenew: boolean
): SiteDomainPurchase {
  return {
    status: "purchased",
    selectedDomain: order.domain,
    tld: order.tld,
    priceAnnual: order.priceAnnual,
    currency: order.currency,
    autoRenew,
    registrarOrderId: order.registrarOrderId,
    purchasedAt: order.purchasedAt,
    expiresAt: order.expiresAt,
  };
}

