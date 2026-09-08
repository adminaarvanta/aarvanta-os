import { AppShell } from "@/components/layout/app-shell";
import { ensureDatastoreReady } from "@/lib/data/datastore";
import { getRepository } from "@/lib/data/repository";
import { isProductionMode } from "@/lib/config/app-mode";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { isOnboardingPending, shouldShowLaunchpad } from "@/lib/onboarding/catalog";
import { getSessionContext } from "@/lib/tenant/context";
import { ROLE_LABELS } from "@/types/tenant";
import type { EntitlementsClient } from "@/lib/billing/entitlements";
import { canAccessWhatsAppOs } from "@/lib/channels/whatsapp-access";
import { redirect } from "next/navigation";

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
  let userId: string | null = null;
  let hasSeenWalkthrough = false;
  let showLaunchpad = false;
  let pendingOnboarding = false;
  let whatsappUnread = 0;
  let voiceUnread = 0;
  let showWhatsAppNav = false;
  let showOutreachNav = false;
  let entitlements: EntitlementsClient | null = null;

  // Resolve session + credit grants first, in isolation. An unrelated
  // bootstrap failure must not wipe Voice / Email OS unlocks for grantees.
  let sessionCtx: Awaited<ReturnType<typeof getSessionContext>> | null = null;
  try {
    sessionCtx = await getSessionContext();
    userName = sessionCtx.name || sessionCtx.email.split("@")[0] || "Founder";
    userRole = ROLE_LABELS[sessionCtx.role] ?? sessionCtx.role;
    userId = sessionCtx.userId;
    showWhatsAppNav = canAccessWhatsAppOs(sessionCtx.email);
    hasSeenWalkthrough = Boolean(sessionCtx.member?.hasSeenWalkthrough);

    const { resolveEntitlements, toClientEntitlements } = await import(
      "@/lib/billing/entitlements"
    );
    const resolved = await resolveEntitlements(sessionCtx.scope);
    entitlements = toClientEntitlements(resolved);

    const { canAccessEmailOutreachAsync } = await import(
      "@/lib/channels/email-outreach-access"
    );
    showOutreachNav =
      Boolean(resolved.creditOverrides.unlimitedEmailOutreach) ||
      (await canAccessEmailOutreachAsync(sessionCtx.email, sessionCtx.member));
  } catch {
    /* session missing — free fallback below */
  }

  if (sessionCtx) {
    try {
      const ctx = sessionCtx;
      const repo = getTenantRepository();
      const { ensureTenantRecords } = await import(
        "@/lib/tenant/ensure-tenant-records"
      );
      const { ensureProductionBootstrap } = await import(
        "@/lib/tenant/ensure-production-bootstrap"
      );
      const bootstrapped = await ensureTenantRecords(ctx);
      await ensureProductionBootstrap();
      pendingOnboarding = isOnboardingPending(bootstrapped.organization);
      const workspaces = await repo.listWorkspaces(ctx.scope.tenantId);
      tenant = {
        organization: bootstrapped.organization,
        workspace: bootstrapped.workspace,
        workspaces,
      };
      showLaunchpad = shouldShowLaunchpad(bootstrapped.organization);
      const conversations = await getRepository().listConversations(ctx.scope);
      const { unreadForChannel } = await import(
        "@/lib/channels/filter-conversations"
      );
      whatsappUnread = unreadForChannel(conversations, "whatsapp");
      voiceUnread = unreadForChannel(conversations, "voice");
      const { hydrateWorkspaceSettingsCache } = await import("@/lib/hr/settings");
      await hydrateWorkspaceSettingsCache(bootstrapped.workspace.id);

      const { getSiteBuildRepository } = await import(
        "@/lib/data/site-build-store"
      );
      const buildJobs = await getSiteBuildRepository().list(ctx.scope);
      if (entitlements) {
        entitlements = {
          ...entitlements,
          buildDraftsUsed: buildJobs.length,
        };
      }
    } catch (error) {
      console.warn(
        "[app-layout] bootstrap failed; keeping resolved credit grants",
        error instanceof Error ? error.message : error
      );
    }
  }

  if (!entitlements) {
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
      creditOverrides: {
        unlimitedVoice: false,
        unlimitedEmailOutreach: false,
      },
      demoMode: !production,
    };
  }

  if (pendingOnboarding) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      production={production}
      tenant={tenant}
      userName={userName}
      userRole={userRole}
      userId={userId}
      hasSeenWalkthrough={hasSeenWalkthrough}
      showLaunchpad={showLaunchpad}
      whatsappUnread={whatsappUnread}
      voiceUnread={voiceUnread}
      showWhatsAppNav={showWhatsAppNav}
      showOutreachNav={showOutreachNav}
      entitlements={entitlements}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        {children}
      </div>
    </AppShell>
  );
}
