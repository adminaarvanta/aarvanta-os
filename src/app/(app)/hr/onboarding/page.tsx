import { HrOnboardingManager } from "@/components/hr/hr-onboarding-manager";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getOnboardingDashboard } from "@/lib/hr/onboarding-service";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrOnboardingPage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const onboarding = await getOnboardingDashboard();
  return <HrOnboardingManager initial={onboarding} />;
}
