import { AppShell } from "@/components/layout/app-shell";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getRepository } from "@/lib/data/repository";
import { isProductionMode } from "@/lib/config/app-mode";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { ROLE_LABELS } from "@/types/tenant";
import type { EntitlementsClient } from "@/lib/billing/entitlements";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureDatastoreReady();
  const production = isProductionMode();
  let tenant = null;
  let userName = "Founder";
  let userRole = "Owner";
  let whatsappUnread = 0;
  let voiceUnread = 0;
  let entitlements: EntitlementsClient | null = null;

  try {
    const ctx = await getSessionContext();
    const repo = getTenantRepository();
    const { ensureTenantRecords } = await import("@/lib/tenant/ensure-tenant-records");
    const { ensureProductionBootstrap } = await import(
      "@/lib/tenant/ensure-production-bootstrap"
    );
    const bootstrapped = await ensureTenantRecords(ctx);
    await ensureProductionBootstrap();
    const workspaces = await repo.listWorkspaces(ctx.scope.tenantId);
    tenant = {
      organization: bootstrapped.organization,
      workspace: bootstrapped.workspace,
      workspaces,
    };
    userName = ctx.name || ctx.email.split("@")[0] || "Founder";
    userRole = ROLE_LABELS[ctx.role] ?? ctx.role;
    const conversations = await getRepository().listConversations(ctx.scope);
    const { unreadForChannel } = await import("@/lib/channels/filter-conversations");
    whatsappUnread = unreadForChannel(conversations, "whatsapp");
    voiceUnread = unreadForChannel(conversations, "voice");
    const { hydrateWorkspaceSettingsCache } = await import("@/lib/hr/settings");
    await hydrateWorkspaceSettingsCache(bootstrapped.workspace.id);

    const { resolveEntitlements, toClientEntitlements } = await import(
      "@/lib/billing/entitlements"
    );
    entitlements = toClientEntitlements(await resolveEntitlements(ctx.scope));
  } catch {
    const { getPlan } = await import("@/lib/billing/plan-catalog");
    const free = getPlan("free")!;
    entitlements = {
      planId: "free",
      planName: free.name,
      priceMonthly: 0,
      features: free.features,
      limits: free.limits,
      usage: {
        ai_credits: 0,
        voice_minutes: 0,
        whatsapp_conversations: 0,
        emails: 0,
        seats: 0,
        storage_mb: 0,
      },
      period: new Date().toISOString().slice(0, 7),
      creditsRemaining:
        typeof free.limits.aiCredits === "number" ? free.limits.aiCredits : 0,
      creditsPercent: 0,
      isSuperAdmin: false,
    };
  }

  return (
    <AppShell
      production={production}
      tenant={tenant}
      userName={userName}
      userRole={userRole}
      whatsappUnread={whatsappUnread}
      voiceUnread={voiceUnread}
      entitlements={entitlements}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        {children}
      </div>
    </AppShell>
  );
}
