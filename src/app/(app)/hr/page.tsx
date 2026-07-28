import { PendingLink } from "@/components/layout/navigation-provider";
import { HrPageHeader } from "@/components/hr/hr-nav";
import { HrPanel, HrStatStrip } from "@/components/hr/hr-ui";
import { getHrStore } from "@/lib/data/platform-store";
import { ensureHrPlatformSeed } from "@/lib/hr/ensure-platform-seed";
import { getOnboardingDashboard } from "@/lib/hr/onboarding-service";
import { getTenantScope } from "@/lib/tenant/context";

export default async function HrOverviewPage() {
  const scope = await getTenantScope();
  await ensureHrPlatformSeed(scope);
  const hr = getHrStore();
  const [jobs, candidates, employees, punches, leave, exits, onboarding] =
    await Promise.all([
      hr.listJobs(scope),
      hr.list(scope),
      hr.listEmployees(scope),
      hr.listPunches(scope),
      hr.listLeaveRequests(scope),
      hr.listExitCases(scope),
      getOnboardingDashboard(),
    ]);

  const openJobs = jobs.filter((j) => j.status === "open").length;
  const activeEmployees = employees.filter((e) => e.status !== "exited").length;
  const pendingLeave = leave.filter((l) => l.status === "pending").length;
  const pendingOnboarding =
    onboarding.stats.notSent + onboarding.stats.awaiting + onboarding.stats.awaitingCeo;

  return (
    <div className="space-y-6">
      <HrPageHeader
        title="People lifecycle"
        description="From job post to exit documents — one colourful HR workspace."
        actions={
          <div className="flex flex-wrap gap-2">
            <PendingLink
              href="/hr/jobs"
              className="inline-flex items-center justify-center rounded-lg bg-gold px-4 py-2 text-sm font-medium text-black shadow-sm shadow-gold/20 transition-colors hover:bg-gold-bright"
            >
              Post a job
            </PendingLink>
            <PendingLink
              href="/hr/onboarding"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-gold/40 hover:bg-surface-hover"
            >
              Onboarding
            </PendingLink>
          </div>
        }
      />

      <HrStatStrip
        items={[
          { label: "Open jobs", value: openJobs, tone: "cyan", hint: `${jobs.length} total` },
          {
            label: "Pipeline",
            value: candidates.filter((c) => c.status !== "hired" && c.status !== "rejected").length,
            tone: "gold",
            hint: `${candidates.length} candidates`,
          },
          {
            label: "Onboarding",
            value: pendingOnboarding,
            tone: "amber",
            hint: `${onboarding.stats.completed} completed`,
          },
          {
            label: "Headcount",
            value: activeEmployees,
            tone: "teal",
            hint: `${punches.length} punches logged`,
          },
          {
            label: "Leave / exit",
            value: pendingLeave,
            tone: "leave",
            hint: `${exits.length} exit cases`,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <HrPanel title="Today’s focus" description="Jump into the module that needs attention.">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Candidates to advance</span>
              <PendingLink href="/hr/candidates" className="font-medium text-gold-bright hover:underline">
                Open ATS →
              </PendingLink>
            </li>
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Packs waiting</span>
              <PendingLink href="/hr/onboarding" className="font-medium text-gold-bright hover:underline">
                Onboarding →
              </PendingLink>
            </li>
            <li className="flex justify-between gap-2 rounded-lg border border-border-subtle px-3 py-2">
              <span className="text-muted">Clock & attendance</span>
              <PendingLink href="/hr/punch" className="font-medium text-gold-bright hover:underline">
                Punch →
              </PendingLink>
            </li>
          </ul>
        </HrPanel>
        <HrPanel title="Lifecycle map" description="Hire → onboard → attend → leave → invoice → exit.">
          <p className="text-sm leading-relaxed text-muted">
            Use the tabs above for every HR step. Import candidates from Excel, hire into the roster,
            send onboarding packs, track punches and leave, raise contractor invoices, and complete
            exit with relieving and experience letters.
          </p>
        </HrPanel>
      </div>
    </div>
  );
}

export const metadata = { title: "HR" };
