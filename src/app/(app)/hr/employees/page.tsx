import { HrEmployeesClient } from "@/components/hr/hr-people-ops";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrEmployeesPage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const employees = await getHrStore().listEmployees(scope);
  return <HrEmployeesClient initialEmployees={employees} />;
}
