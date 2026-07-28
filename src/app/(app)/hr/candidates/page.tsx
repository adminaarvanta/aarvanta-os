import { HrCandidatesClient } from "@/components/hr/hr-jobs-candidates";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrCandidatesPage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const hr = getHrStore();
  const [candidates, jobs] = await Promise.all([hr.list(scope), hr.listJobs(scope)]);
  return <HrCandidatesClient initialCandidates={candidates} jobs={jobs} />;
}
