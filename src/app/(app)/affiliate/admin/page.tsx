import { Shield } from "lucide-react";
import { AffiliateAdminClient } from "@/components/affiliate/affiliate-admin-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";

export const metadata = { title: "Affiliate admin" };

export default function AffiliateAdminPage() {
  return (
    <ModulePageShell
      icon={Shield}
      title="Affiliate admin"
      description="Manage hierarchy, regional rate matrix, partner approvals, and payouts."
    >
      <AffiliateAdminClient />
    </ModulePageShell>
  );
}
