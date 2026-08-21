import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { isDemoMode } from "@/lib/config/app-mode";
import { getTenantRepository } from "@/lib/data/tenant-store";
import { isOnboardingPending } from "@/lib/onboarding/catalog";
import { getSessionContext } from "@/lib/tenant/context";

export const metadata = { title: "Set up your workspace · Aarvanta" };

export default async function OnboardingPage() {
  if (!isDemoMode()) {
    const ctx = await getSessionContext();
    const org = await getTenantRepository().getOrganization(ctx.scope.tenantId);
    if (!isOnboardingPending(org)) redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(ellipse_at_top_right,rgba(168,137,79,0.08),transparent_42%),linear-gradient(180deg,var(--background),var(--surface-muted))] px-4 py-10">
      <OnboardingWizard />
    </div>
  );
}
