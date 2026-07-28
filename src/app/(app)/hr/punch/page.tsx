import { HrPunchClient } from "@/components/hr/hr-people-ops";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrPunchPage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const hr = getHrStore();
  const [employees, punches] = await Promise.all([
    hr.listEmployees(scope),
    hr.listPunches(scope),
  ]);
  return <HrPunchClient employees={employees} initialPunches={punches} />;
}
