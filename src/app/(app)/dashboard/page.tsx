import { CommandCenterDashboard } from "@/components/command-center/command-center-dashboard";
import { TodayDashboard } from "@/components/command-center/today-dashboard";
import { buildFounderSnapshot } from "@/lib/founder/build-snapshot";
import { buildTodaySnapshot } from "@/lib/founder/today-snapshot";
import { shouldShowLaunchpad } from "@/lib/onboarding/catalog";
import { buildLaunchpadSnapshot } from "@/lib/onboarding/launchpad";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { canAccessWhatsAppOs } from "@/lib/channels/whatsapp-access";
import { A48_TODAY_ENABLED } from "@/lib/product/flags";
import { isDemoMode } from "@/lib/config/app-mode";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  const { canAccessEmailOutreachAsync } = await import(
    "@/lib/channels/email-outreach-access"
  );
  const [snapshot, today, org, launchpad, showOutreach] = await Promise.all([
    A48_TODAY_ENABLED
      ? Promise.resolve(null)
      : buildFounderSnapshot(ctx.scope),
    A48_TODAY_ENABLED ? buildTodaySnapshot(ctx.scope) : Promise.resolve(null),
    getTenantRepository().getOrganization(ctx.scope.tenantId),
    buildLaunchpadSnapshot(ctx.scope),
    canAccessEmailOutreachAsync(ctx.email, ctx.member),
  ]);

  const setupGuide = shouldShowLaunchpad(org)
    ? {
        firstName: (ctx.name || ctx.email).split(" ")[0] || "there",
        items: launchpad.items,
        percent: launchpad.percent,
      }
    : null;

  if (A48_TODAY_ENABLED && today) {
    return (
      <TodayDashboard
        userName={ctx.name || ctx.email}
        snapshot={today}
        setupGuide={setupGuide}
        demoMode={isDemoMode()}
      />
    );
  }

  return (
    <CommandCenterDashboard
      userName={ctx.name || ctx.email}
      snapshot={snapshot!}
      showWhatsApp={canAccessWhatsAppOs(ctx.email)}
      showOutreach={showOutreach}
      setupGuide={setupGuide}
    />
  );
}

export const metadata = { title: "Today" };
