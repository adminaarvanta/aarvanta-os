import Link from "next/link";
import { Handshake } from "lucide-react";
import { AffiliateDashboardClient } from "@/components/affiliate/affiliate-dashboard-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";
import { isAffiliatePlatformAdmin } from "@/lib/affiliate/admin";
import {
  affiliateRole,
  buildAffiliateDashboard,
} from "@/lib/affiliate/service";
import { affiliateStore } from "@/lib/data/affiliate-store";
import { getSessionContext } from "@/lib/tenant/context";

export const metadata = { title: "Affiliate dashboard" };

export default async function AffiliateDashboardPage() {
  let dashboard = null;
  let showAdmin = false;
  try {
    const session = await getSessionContext();
    const affiliate =
      (await affiliateStore.getAffiliateByUserId(session.userId)) ??
      (await affiliateStore.getAffiliateByEmail(session.email));
    showAdmin =
      isAffiliatePlatformAdmin(session.email) ||
      (affiliate?.status === "active" &&
        affiliateRole(affiliate) === "regional_manager");
    if (affiliate) {
      dashboard = await buildAffiliateDashboard(affiliate.id);
    }
  } catch {
    /* demo without session still renders client fetch */
  }

  return (
    <ModulePageShell
      icon={Handshake}
      title="Affiliate dashboard"
      description="Track clicks, leads, commissions, income, and payout requests."
      actions={
        showAdmin ? (
          <Link
            href="/affiliate/admin"
            className="text-sm text-gold hover:underline"
          >
            Admin portal
          </Link>
        ) : null
      }
    >
      <AffiliateDashboardClient initial={dashboard} />
    </ModulePageShell>
  );
}
