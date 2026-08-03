import { AiTeamChatHome } from "@/components/workforce/ai-team-chat-home";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WfHeader } from "@/components/workforce/workforce-shell";
import {
  getWorkforceExecutionsStore,
} from "@/lib/data/workforce-pipeline-store";
import { listPendingApprovals } from "@/lib/workforce/pipeline/approvals";
import { getTenantScope } from "@/lib/tenant/context";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** Chat home — ask anything or pick a quick action to start a job. */
export default async function WorkforcePage() {
  const scope = await getTenantScope();
  const [executions, pending] = await Promise.all([
    getWorkforceExecutionsStore().list(scope),
    listPendingApprovals(scope),
  ]);

  const today = startOfTodayIso();
  const activeStatuses = new Set([
    "created",
    "planning",
    "collecting_context",
    "executing",
    "awaiting_approval",
  ]);
  const activeJobs = executions.filter((e) =>
    activeStatuses.has(e.status)
  ).length;
  const completedToday = executions.filter(
    (e) =>
      e.status === "completed" &&
      e.completedAt &&
      e.completedAt >= today
  ).length;

  return (
    <>
      <WfHeader
        title="AI Team"
        subtitle="Ask for an outcome — your specialists handle the rest"
      />
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <AiTeamChatHome
          counts={{
            pendingApprovals: pending.length,
            activeJobs,
            completedToday,
          }}
        />
      </div>
    </>
  );
}

export const metadata = { title: "AI Team" };
