import Link from "next/link";
import { Handshake } from "lucide-react";
import { AffiliateDashboardClient } from "@/components/affiliate/affiliate-dashboard-client";
import { ReferralsOptInClient } from "@/components/affiliate/referrals-opt-in-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";
import { isAffiliatePlatformAdmin } from "@/lib/affiliate/admin";
import {
  affiliateRole,
  buildAffiliateDashboard,
} from "@/lib/affiliate/service";
import { affiliateStore } from "@/lib/data/affiliate-store";
import { getSessionContext } from "@/lib/tenant/context";

export const metadata = { title: "Partners" };

export default async function PartnersPage() {
  let dashboard = null;
  let hasAffiliate = false;
  let showAdmin = false;
  try {
    const session = await getSessionContext();
    const affiliate =
      (await affiliateStore.getAffiliateByUserId(session.userId)) ??
      (await affiliateStore.getAffiliateByEmail(session.email));
    hasAffiliate = Boolean(affiliate);
    showAdmin =
      isAffiliatePlatformAdmin(session.email) ||
      (affiliate?.status === "active" &&
        affiliateRole(affiliate) === "regional_manager");
    if (affiliate) {
      dashboard = await buildAffiliateDashboard(affiliate.id);
    }
  } catch {
    /* unauthenticated demo still renders client fetch */
  }

  return (
    <ModulePageShell
      icon={Handshake}
      title="Partners"
      description="Share Aarvanta, track leads and commissions, and request payouts."
      actions={
        showAdmin ? (
          <Link
            href="/affiliate/admin"
            className="inline-flex items-center rounded-lg bg-gold px-3 py-1.5 text-sm font-semibold text-black hover:bg-gold-bright"
          >
            Open hierarchy admin
          </Link>
        ) : (
          <Link href="/affiliate" className="text-sm text-gold hover:underline">
            Public apply page
          </Link>
        )
      }
    >
      {showAdmin ? (
        <div className="mb-4 rounded-xl border border-gold/35 bg-gold/10 px-4 py-3 text-sm text-foreground">
          You can manage the partner hierarchy tree, regional rates, and
          approvals in{" "}
          <Link
            href="/affiliate/admin"
            className="font-semibold text-gold hover:underline"
          >
            Partner admin
          </Link>
          .
        </div>
      ) : null}
      {hasAffiliate ? (
        <AffiliateDashboardClient initial={dashboard} />
      ) : (
        <ReferralsOptInClient hasAffiliate={false} />
      )}
    </ModulePageShell>
  );
}
