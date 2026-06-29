import { getHrStore } from "@/lib/data/platform-store";
import { buildDemoHrCandidates, buildDemoHrEmployees } from "@/lib/data/platform-demo-seed";
import type { TenantScope } from "@/types/communication";

/** Seed HR roster for workspaces that have no employees yet (e.g. production bootstrap). */
export async function ensureHrPlatformSeed(scope: TenantScope): Promise<void> {
  const hrStore = getHrStore();
  const [employees, candidates] = await Promise.all([
    hrStore.listEmployees(scope),
    hrStore.list(scope),
  ]);

  if (employees.length === 0) {
    for (const template of buildDemoHrEmployees()) {
      await hrStore.createEmployee({
        ...scope,
        name: template.name,
        department: template.department,
        role: template.role,
        startDate: template.startDate,
        leaveBalance: template.leaveBalance,
        email: template.email,
      });
    }
  }

  if (candidates.length === 0) {
    for (const template of buildDemoHrCandidates()) {
      await hrStore.create({
        ...scope,
        name: template.name,
        role: template.role,
        score: template.score,
        status: template.status,
        email: template.email,
        resumeSummary: template.resumeSummary,
      });
    }
  }
}
