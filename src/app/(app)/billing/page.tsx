import { CreditCard } from "lucide-react";
import { BillingClient } from "@/components/billing/billing-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";
import { PLAN_CATALOG } from "@/lib/billing/plan-catalog";
import {
  resolveEntitlements,
  remainingForMetric,
  usagePercent,
  toClientEntitlements,
} from "@/lib/billing/entitlements";
import { BILLING_PLANS, getBillingStore } from "@/lib/data/platform-store";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getTenantScope } from "@/lib/tenant/context";

export default async function BillingPage() {
  const scope = await getTenantScope();
  const billingStore = getBillingStore();
  const [subscriptions, entitlements] = await Promise.all([
    billingStore.list(scope),
    resolveEntitlements(scope),
  ]);

  const meters = [
    {
      key: "ai_credits" as const,
      label: "AI credits",
      used: entitlements.usage.ai_credits,
      limit: entitlements.limits.aiCredits,
      remaining: remainingForMetric(entitlements, "ai_credits"),
      percent: usagePercent(entitlements, "ai_credits"),
    },
    {
      key: "voice_minutes" as const,
      label: "AI voice minutes",
      used: entitlements.usage.voice_minutes,
      limit: entitlements.limits.voiceMinutes,
      remaining: remainingForMetric(entitlements, "voice_minutes"),
      percent: usagePercent(entitlements, "voice_minutes"),
    },
    {
      key: "whatsapp_conversations" as const,
      label: "WhatsApp conversations",
      used: entitlements.usage.whatsapp_conversations,
      limit: entitlements.limits.whatsappConversations,
      remaining: remainingForMetric(entitlements, "whatsapp_conversations"),
      percent: usagePercent(entitlements, "whatsapp_conversations"),
    },
    {
      key: "emails" as const,
      label: "Emails",
      used: entitlements.usage.emails,
      limit: entitlements.limits.emailsPerMonth,
      remaining: remainingForMetric(entitlements, "emails"),
      percent: usagePercent(entitlements, "emails"),
    },
  ];

  return (
    <ModulePageShell
      icon={CreditCard}
      title="Billing"
      description="Your plan, Business Capacity, and channel allowances. Upgrade when you are ready to launch."
    >
      <BillingClient
        plans={BILLING_PLANS}
        catalog={PLAN_CATALOG.map((p) => ({
          id: p.id,
          name: p.name,
          tagline: p.tagline,
          priceMonthly: p.priceMonthly,
          priceAnnual: p.priceAnnual,
          highlighted: p.highlighted,
          highlights: p.highlights,
          exclusions: p.exclusions,
          limits: p.limits,
        }))}
        subscriptions={subscriptions}
        entitlements={toClientEntitlements(entitlements)}
        meters={meters}
        period={entitlements.period}
        stripeConfigured={isStripeConfigured()}
      />
    </ModulePageShell>
  );
}

export const metadata = { title: "Billing" };
