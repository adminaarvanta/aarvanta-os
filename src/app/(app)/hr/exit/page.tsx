import { HrExitClient } from "@/components/hr/hr-people-ops";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrExitPage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const hr = getHrStore();
  const [employees, exits] = await Promise.all([
    hr.listEmployees(scope),
    hr.listExitCases(scope),
  ]);
  return <HrExitClient employees={employees} initialExits={exits} />;
}
