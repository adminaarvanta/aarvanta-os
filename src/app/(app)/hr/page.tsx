import { Landmark } from "lucide-react";
import { HrApprovalQueue } from "@/components/hr/hr-approval-queue";
import { HrAutomationToggle } from "@/components/hr/hr-automation-toggle";
import { HrDocumentAgent } from "@/components/hr/hr-document-agent";
import { HrOnboardingManager } from "@/components/hr/hr-onboarding-manager";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { Panel } from "@/components/ui/os/panel";
import { SectionHeader } from "@/components/ui/os/section-header";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getOnboardingDashboard } from "@/lib/hr/onboarding-service";
import { getHrWorkspaceSettings } from "@/lib/hr/settings";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrPage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const hrStore = getHrStore();
  const [candidates, employees, courses, documents, cases, settings, onboarding] =
    await Promise.all([
      hrStore.list(scope),
      hrStore.listEmployees(scope),
      hrStore.listCourses(scope),
      hrStore.listDocuments(scope),
      hrStore.listCases(scope),
      getHrWorkspaceSettings(scope.workspaceId),
      getOnboardingDashboard(),
    ]);

  const pending = cases.filter((item) => item.status === "pending_approval");
  const recentSent = cases
    .filter((item) => item.status === "sent")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <ModulePageShell
      icon={Landmark}
      title="HR OS"
      description="Onboarding packs, ATS, employee roster, and document automation."
    >
      <div className="space-y-6">
        <HrOnboardingManager initial={onboarding} />

        <HrAutomationToggle initialEnabled={settings.inboxAutomationEnabled} />
        <HrApprovalQueue pending={pending} recentSent={recentSent} />

        <StatGrid
          items={[
            { label: "Candidates", value: candidates.length, sub: "ATS pipeline" },
            { label: "Employees", value: employees.length, sub: "Active roster" },
            { label: "HR documents", value: documents.length, sub: "Generated" },
            { label: "Open cases", value: pending.length, sub: "Awaiting review" },
          ]}
        />

        <HrDocumentAgent
          employees={employees}
          candidates={candidates}
          initialDocuments={documents}
        />

        <Panel padding="none">
          <div className="border-b border-border-subtle px-4 py-3 sm:px-5">
            <SectionHeader title="People & learning" className="mb-0" />
          </div>
          <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Candidates
              </h3>
              <CardList
                items={candidates.map((candidate) => ({
                  id: candidate.id,
                  title: candidate.name,
                  body: candidate.role,
                  meta: `Score ${candidate.score}`,
                  badge: candidate.status,
                }))}
              />
            </section>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Employees
              </h3>
              <CardList
                items={employees.map((employee) => ({
                  id: employee.id,
                  title: employee.name,
                  body: `${employee.role} · ${employee.department}`,
                  meta: `Leave ${employee.leaveBalance}d`,
                }))}
              />
            </section>
            <section className="sm:col-span-2 lg:col-span-1">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Courses
              </h3>
              <CardList
                items={courses.map((course) => ({
                  id: course.id,
                  title: course.title,
                  body: `${course.durationHours}h · ${course.enrolled} enrolled`,
                  badge: course.category,
                }))}
              />
            </section>
          </div>
        </Panel>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "HR" };
