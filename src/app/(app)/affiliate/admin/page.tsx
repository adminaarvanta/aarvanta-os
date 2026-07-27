import { Shield } from "lucide-react";
import { AffiliateAdminClient } from "@/components/affiliate/affiliate-admin-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";

export const metadata = { title: "Affiliate admin" };

export default function AffiliateAdminPage() {
  return (
    <ModulePageShell
      icon={Shield}
      title="Affiliate admin"
      description="Approve partners, set regional discount and commission caps, fulfill payouts."
    >
      <AffiliateAdminClient />
    </ModulePageShell>
  );
}
