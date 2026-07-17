import { CreditCard } from "lucide-react";
import { BillingClient } from "@/components/billing/billing-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";
import { BILLING_PLANS, getBillingStore } from "@/lib/data/platform-store";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getTenantScope } from "@/lib/tenant/context";

export default async function BillingPage() {
  const scope = await getTenantScope();
  const billingStore = getBillingStore();
  const [subscriptions, usage] = await Promise.all([
    billingStore.list(scope),
    billingStore.listUsage(scope),
  ]);

  return (
    <ModulePageShell
      icon={CreditCard}
      title="Billing"
      description="Subscribe with Stripe Checkout. Manage payment methods in the Stripe Customer Portal."
    >
      <BillingClient
        plans={BILLING_PLANS}
        subscriptions={subscriptions}
        usage={usage}
        stripeConfigured={isStripeConfigured()}
      />
    </ModulePageShell>
  );
}

export const metadata = { title: "Billing" };
