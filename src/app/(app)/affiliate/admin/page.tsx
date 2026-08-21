import Link from "next/link";
import { Shield } from "lucide-react";
import { AffiliateAdminClient } from "@/components/affiliate/affiliate-admin-client";
import { ModulePageShell } from "@/components/platform/module-page-shell";

export const metadata = { title: "Partner admin" };

export default function AffiliateAdminPage() {
  return (
    <ModulePageShell
      icon={Shield}
      title="Partner admin"
      description="Manage hierarchy, regional rate matrix, partner approvals, and payouts."
      actions={
        <Link
          href="/partners"
          className="text-sm text-gold hover:underline"
        >
          Partner dashboard
        </Link>
      }
    >
      <AffiliateAdminClient />
    </ModulePageShell>
  );
}
