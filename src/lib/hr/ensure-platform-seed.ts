import { getHrStore } from "@/lib/data/platform-store";
import {
  buildDemoHrCandidates,
  buildDemoHrEmployees,
  buildDemoHrJobs,
} from "@/lib/data/platform-demo-seed";
import type { TenantScope } from "@/types/communication";

/** Seed HR roster for workspaces that have no employees yet (e.g. production bootstrap). */
export async function ensureHrPlatformSeed(scope: TenantScope): Promise<void> {
  const hrStore = getHrStore();
  const [employees, candidates, jobs] = await Promise.all([
    hrStore.listEmployees(scope),
    hrStore.list(scope),
    hrStore.listJobs(scope),
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
        status: template.status ?? "active",
        annualSalaryGbp: template.annualSalaryGbp,
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
        jobId: template.jobId,
        source: template.source,
        phone: template.phone,
      });
    }
  }

  if (jobs.length === 0) {
    for (const template of buildDemoHrJobs()) {
      await hrStore.createJob({
        ...scope,
        title: template.title,
        department: template.department,
        requirements: template.requirements,
        status: template.status,
        postedAt: template.postedAt,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      });
    }
  }
}
