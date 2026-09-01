import { Shield } from "lucide-react";
import { notFound } from "next/navigation";
import {
  CreditAccessClient,
  type CreditAccessMember,
} from "@/components/settings/credit-access-client";
import { PageFrame, PageScroll } from "@/components/layout/page-scroll";
import { PageHeader } from "@/components/ui/os/page-header";
import { isSuperAdminEmail } from "@/lib/billing/super-admin";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { getSessionContext } from "@/lib/tenant/context";

export default async function CreditAccessSettingsPage() {
  const ctx = await getSessionContext();
  if (!isSuperAdminEmail(ctx.email)) {
    notFound();
  }

  const repo = getTenantRepository();
  const [members, workspaces] = await Promise.all([
    repo.listMembersByTenant(ctx.scope.tenantId),
    repo.listWorkspaces(ctx.scope.tenantId),
  ]);
  const workspaceById = new Map(workspaces.map((ws) => [ws.id, ws.name]));

  const roster: CreditAccessMember[] = members
    .filter((m) => m.status === "active")
    .map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      workspaceName: workspaceById.get(m.workspaceId) ?? m.workspaceId,
      creditOverrides: {
        unlimitedVoice: Boolean(m.creditOverrides?.unlimitedVoice),
        unlimitedEmailOutreach: Boolean(m.creditOverrides?.unlimitedEmailOutreach),
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PageFrame>
      <PageHeader
        icon={Shield}
        title="Credit access"
        description="Choose who gets unlimited Voice OS and Email OS outreach."
      />
      <PageScroll className="p-4 sm:p-6">
        <CreditAccessClient initialMembers={roster} />
      </PageScroll>
    </PageFrame>
  );
}

export const metadata = { title: "Credit access · Settings" };
