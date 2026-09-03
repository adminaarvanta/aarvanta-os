import { Shield } from "lucide-react";
import { notFound } from "next/navigation";
import {
  CreditAccessClient,
  type CreditAccessMember,
} from "@/components/settings/credit-access-client";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";
import { PageHeader } from "@/components/ui/os/page-header";
import { buildCreditAccessRoster } from "@/lib/billing/credit-access-roster";
import { isSuperAdminEmail } from "@/lib/billing/super-admin";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";

export default async function CreditAccessSettingsPage() {
  const ctx = await getSessionContext();
  if (!isSuperAdminEmail(ctx.email)) {
    notFound();
  }

  const roster = await buildCreditAccessRoster(getTenantRepository());
  const members: CreditAccessMember[] = roster.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    organizationName: m.organizationName,
    workspaceName: m.workspaceName,
    membershipCount: m.membershipCount,
    creditOverrides: m.creditOverrides,
  }));

  return (
    <PageFrame>
      <PageHeader
        icon={Shield}
        title="Credit access"
        description="Every product user — grant unlimited Voice OS and Email OS outreach."
      />
      <PageScroll className="p-4 sm:p-6">
        <CreditAccessClient initialMembers={members} />
      </PageScroll>
    </PageFrame>
  );
}

export const metadata = { title: "Credit access · Settings" };
