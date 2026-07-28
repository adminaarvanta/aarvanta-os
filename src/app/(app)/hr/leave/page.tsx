import { HrLeaveClient } from "@/components/hr/hr-people-ops";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrLeavePage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const hr = getHrStore();
  const [employees, leave] = await Promise.all([
    hr.listEmployees(scope),
    hr.listLeaveRequests(scope),
  ]);
  return <HrLeaveClient employees={employees} initialLeave={leave} />;
}
