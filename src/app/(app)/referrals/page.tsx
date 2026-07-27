import { Gift } from "lucide-react";
import { ReferralsOptInClient } from "@/components/affiliate/referrals-opt-in-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";
import { affiliateStore } from "@/lib/data/affiliate-store";
import { getSessionContext } from "@/lib/tenant/context";

export const metadata = { title: "Referrals" };

export default async function ReferralsPage() {
  let hasAffiliate = false;
  try {
    const session = await getSessionContext();
    const affiliate =
      (await affiliateStore.getAffiliateByUserId(session.userId)) ??
      (await affiliateStore.getAffiliateByEmail(session.email));
    hasAffiliate = Boolean(affiliate);
  } catch {
    /* unauthenticated demo */
  }

  return (
    <ModulePageShell
      icon={Gift}
      title="Referrals"
      description="Customer affiliate opt-in — same tracking, commission, and payout engine as partners."
    >
      <ReferralsOptInClient hasAffiliate={hasAffiliate} />
    </ModulePageShell>
  );
}
