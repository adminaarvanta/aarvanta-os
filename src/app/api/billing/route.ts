import { NextResponse } from "next/server";
import { PLAN_CATALOG } from "@/lib/billing/plan-catalog";
import {
  resolveEntitlements,
  remainingForMetric,
  usagePercent,
  toClientEntitlements,
} from "@/lib/billing/entitlements";
import { getBillingStore } from "@/lib/data/platform-store";
import { apiError } from "@/lib/api/request";
import { getTenantScope } from "@/lib/tenant/context";

export async function GET() {
  try {
    const scope = await getTenantScope();
    const store = getBillingStore();
    const entitlements = await resolveEntitlements(scope);
    const [plans, subscriptions] = await Promise.all([
      store.listPlans(),
      store.list(scope),
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

    return NextResponse.json({
      plans,
      catalog: PLAN_CATALOG.map((p) => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        priceMonthly: p.priceMonthly,
        priceAnnual: p.priceAnnual,
        highlighted: p.highlighted,
        highlights: p.highlights,
        exclusions: p.exclusions,
        limits: p.limits,
      })),
      subscriptions,
      subscription: entitlements.subscription,
      entitlements: toClientEntitlements(entitlements),
      meters,
      period: entitlements.period,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Load failed";
    return apiError("BILLING_ERROR", message, message === "Unauthorized" ? 401 : 500);
  }
}
