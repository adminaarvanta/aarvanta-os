import { HrJobsClient } from "@/components/hr/hr-jobs-candidates";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrJobsPage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const jobs = await getHrStore().listJobs(scope);
  return <HrJobsClient initialJobs={jobs} />;
}
