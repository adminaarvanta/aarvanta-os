import { CreditCard } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { BILLING_PLANS, getBillingStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function BillingPage() {
  const scope = await getTenantScope();
  const billingStore = getBillingStore();
  const [subscriptions, usage] = await Promise.all([
    billingStore.list(scope),
    billingStore.listUsage(scope),
  ]);

  const totalSeats = usage
    .filter((record) => record.metric === "seats")
    .reduce((sum, record) => sum + record.quantity, 0);
  const totalAgentRuns = usage
    .filter((record) => record.metric === "agent_runs")
    .reduce((sum, record) => sum + record.quantity, 0);

  return (
    <ModulePageShell
      icon={CreditCard}
      title="Billing"
      description="Plans, subscriptions, and usage metering across your workspace."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            {
              label: "Plans",
              value: BILLING_PLANS.length,
              sub: "Starter to enterprise",
            },
            {
              label: "Subscriptions",
              value: subscriptions.length,
              sub: "Active tenant subscriptions",
            },
            {
              label: "Seats",
              value: totalSeats,
              sub: "Current metered seats",
            },
            {
              label: "Agent runs",
              value: totalAgentRuns.toLocaleString(),
              sub: "Latest usage periods",
            },
          ]}
        />

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Plans</h3>
          <CardList
            items={BILLING_PLANS.map((plan) => ({
              id: plan.id,
              title: `${plan.name} · ${plan.currency} ${plan.priceMonthly}/mo`,
              body: plan.features.join(" · "),
              meta: `Plan ID: ${plan.id}`,
            }))}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Subscriptions</h3>
          <CardList
            items={subscriptions.map((subscription) => ({
              id: subscription.id,
              title: `${subscription.planId} subscription`,
              body: `Status: ${subscription.status}`,
              meta: `Period ends ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`,
              badge: subscription.status,
            }))}
          />
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-[#FFFFFF]">Usage</h3>
          <CardList
            items={usage.map((record) => ({
              id: record.id,
              title: `${record.metric} · ${record.quantity.toLocaleString()}`,
              meta: `Period ${record.period}`,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "Billing" };
