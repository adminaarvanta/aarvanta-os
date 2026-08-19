import { getBillingStore } from "@/lib/data/platform-store";
import { getStripePaymentStore } from "@/lib/data/stripe-payment-store";
import { requireStripe } from "@/lib/stripe/client";
import type { TenantScope } from "@/types/communication";

function scopeMeta(scope: TenantScope): Record<string, string> {
  return {
    tenantId: scope.tenantId,
    workspaceId: scope.workspaceId,
    companyId: scope.companyId,
  };
}

/** Best-effort customer id already stored for this workspace. */
export async function resolveStoredStripeCustomerId(
  scope: TenantScope
): Promise<string | undefined> {
  const [subs, payments] = await Promise.all([
    getBillingStore().list(scope),
    getStripePaymentStore().list(scope),
  ]);
  const fromSub = subs.find((s) => s.stripeCustomerId)?.stripeCustomerId;
  if (fromSub) return fromSub;
  return payments.find((p) => p.stripeCustomerId)?.stripeCustomerId;
}

export async function findOrCreateStripeCustomer(input: {
  scope: TenantScope;
  email?: string;
  name?: string;
  existingCustomerId?: string;
}): Promise<string> {
  const stripe = requireStripe();
  const knownId = input.existingCustomerId ?? (await resolveStoredStripeCustomerId(input.scope));

  if (knownId) {
    try {
      const existing = await stripe.customers.retrieve(knownId);
      if (!("deleted" in existing && existing.deleted)) {
        await stripe.customers.update(knownId, {
          email: input.email || undefined,
          name: input.name || undefined,
          metadata: {
            ...existing.metadata,
            ...scopeMeta(input.scope),
          },
        });
        return knownId;
      }
    } catch {
      /* create a replacement below */
    }
  }

  if (input.email) {
    const listed = await stripe.customers.list({ email: input.email, limit: 10 });
    const match = listed.data.find(
      (customer) => customer.metadata?.tenantId === input.scope.tenantId
    );
    if (match) {
      await stripe.customers.update(match.id, {
        name: input.name || undefined,
        metadata: {
          ...match.metadata,
          ...scopeMeta(input.scope),
        },
      });
      return match.id;
    }
  }

  const customer = await stripe.customers.create({
    email: input.email,
    name: input.name,
    metadata: scopeMeta(input.scope),
  });
  return customer.id;
}
