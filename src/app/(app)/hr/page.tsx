import { Landmark } from "lucide-react";
import { CardList, ModulePageShell, StatGrid } from "@/components/platform/module-page-shell";
import { getHrStore } from "@/lib/data/platform-store";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrPage() {
  const scope = await getTenantScope();
  const hrStore = getHrStore();
  const [candidates, employees, courses] = await Promise.all([
    hrStore.list(scope),
    hrStore.listEmployees(scope),
    hrStore.listCourses(scope),
  ]);

  return (
    <ModulePageShell
      icon={Landmark}
      title="HR OS"
      description="ATS candidates, employee roster, and learning programs in one workspace."
    >
      <div className="space-y-8">
        <StatGrid
          items={[
            { label: "Candidates", value: candidates.length, sub: "ATS pipeline" },
            { label: "Employees", value: employees.length, sub: "Active roster" },
            { label: "Courses", value: courses.length, sub: "Learning programs" },
            {
              label: "Avg candidate score",
              value: candidates.length
                ? Math.round(
                    candidates.reduce((sum, candidate) => sum + candidate.score, 0) /
                      candidates.length
                  )
                : 0,
              sub: "Qualification average",
            },
          ]}
        />

        <div className="flex flex-wrap gap-2">
          <a
            href="#ats-candidates"
            className="rounded-lg bg-[#D4AF37]/15 px-3 py-1.5 text-sm text-[#F9E076] ring-1 ring-[#D4AF37]/30"
          >
            ATS candidates
          </a>
          <a
            href="#employees"
            className="rounded-lg px-3 py-1.5 text-sm text-[#A89878] ring-1 ring-[#3d3528] hover:bg-[#1a1714]"
          >
            Employees
          </a>
          <a
            href="#courses"
            className="rounded-lg px-3 py-1.5 text-sm text-[#A89878] ring-1 ring-[#3d3528] hover:bg-[#1a1714]"
          >
            Courses
          </a>
        </div>

        <section id="ats-candidates">
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">ATS candidates</h3>
          <CardList
            items={candidates.map((candidate) => ({
              id: candidate.id,
              title: `${candidate.name} · ${candidate.role}`,
              body: candidate.resumeSummary,
              meta: `Score ${candidate.score}`,
              badge: candidate.status,
            }))}
          />
        </section>

        <section id="employees">
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Employees</h3>
          <CardList
            items={employees.map((employee) => ({
              id: employee.id,
              title: `${employee.name} · ${employee.role}`,
              body: employee.department,
              meta: `Started ${new Date(employee.startDate).toLocaleDateString()} · Leave balance ${employee.leaveBalance}`,
            }))}
          />
        </section>

        <section id="courses">
          <h3 className="mb-3 text-sm font-semibold text-[#F5E6C8]">Courses</h3>
          <CardList
            items={courses.map((course) => ({
              id: course.id,
              title: course.title,
              body: `${course.durationHours} hours · ${course.enrolled} enrolled`,
              badge: course.category,
            }))}
          />
        </section>
      </div>
    </ModulePageShell>
  );
}

export const metadata = { title: "HR" };
