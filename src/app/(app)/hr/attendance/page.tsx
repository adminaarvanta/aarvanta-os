import { HrAttendanceClient } from "@/components/hr/hr-people-ops";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrAttendancePage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const hr = getHrStore();
  const [employees, punches, leaveRequests] = await Promise.all([
    hr.listEmployees(scope),
    hr.listPunches(scope),
    hr.listLeaveRequests(scope),
  ]);
  return (
    <HrAttendanceClient
      employees={employees}
      punches={punches}
      leaveRequests={leaveRequests}
    />
  );
}
