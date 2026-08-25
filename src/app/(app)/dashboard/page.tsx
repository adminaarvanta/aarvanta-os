import { CommandCenterDashboard } from "@/components/command-center/command-center-dashboard";
import { buildFounderSnapshot } from "@/lib/founder/build-snapshot";
import { shouldShowLaunchpad } from "@/lib/onboarding/catalog";
import { buildLaunchpadSnapshot } from "@/lib/onboarding/launchpad";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";
import { canAccessWhatsAppOs } from "@/lib/channels/whatsapp-access";

export default async function DashboardPage() {
  const ctx = await getSessionContext();
  const [snapshot, org, launchpad] = await Promise.all([
    buildFounderSnapshot(ctx.scope),
    getTenantRepository().getOrganization(ctx.scope.tenantId),
    buildLaunchpadSnapshot(ctx.scope),
  ]);

  return (
    <CommandCenterDashboard
      userName={ctx.name || ctx.email}
      snapshot={snapshot}
      showWhatsApp={canAccessWhatsAppOs(ctx.email)}
      setupGuide={
        shouldShowLaunchpad(org)
          ? {
              firstName: (ctx.name || ctx.email).split(" ")[0] || "there",
              items: launchpad.items,
              percent: launchpad.percent,
            }
          : null
      }
    />
  );
}

export const metadata = { title: "Command Center" };
