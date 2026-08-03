import Link from "next/link";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WfHeader, WfPanel } from "@/components/workforce/workforce-shell";
import {
  getWorkforceExecutionsStore,
  getWorkforceGoalsStore,
} from "@/lib/data/workforce-pipeline-store";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { goalDisplayLabel } from "@/lib/workforce/pipeline/goal-engine";
import { agentLabel } from "@/lib/workforce/pipeline/labels";
import { getTenantScope } from "@/lib/tenant/context";

type FeedItem = {
  id: string;
  at: string;
  href: string;
  title: string;
  detail: string;
};

export default async function WorkforceActivityPage() {
  const scope = await getTenantScope();
  const [executions, goals, runs] = await Promise.all([
    getWorkforceExecutionsStore().list(scope),
    getWorkforceGoalsStore().list(scope),
    getWorkforceRepository().listRuns(scope, { limit: 20 }),
  ]);
  const goalMap = new Map(goals.map((g) => [g.id, g]));

  const jobItems: FeedItem[] = executions.map((execution) => {
    const goal = goalMap.get(execution.goalId);
    const specialists = execution.assignedAgents.map(agentLabel).join(", ");
    const status = execution.status.replace(/_/g, " ");
    return {
      id: `job-${execution.id}`,
      at: execution.completedAt ?? execution.startedAt ?? execution.createdAt,
      href: `/workforce/jobs/${execution.id}`,
      title: goal ? goalDisplayLabel(goal) : "AI Team job",
      detail: `${specialists || "AI Team"} · ${status}`,
    };
  });

  const runItems: FeedItem[] = runs.map((run) => ({
    id: `run-${run.id}`,
    at: run.completedAt ?? run.createdAt,
    href: `/workforce/runs/${run.id}`,
    title: `${agentLabel(run.agentType)} ran`,
    detail: run.summary?.slice(0, 120) || run.status,
  }));

  const feed = [...jobItems, ...runItems].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
  );

  return (
    <>
      <WfHeader
        title="Activity"
        subtitle={
          feed.length === 0
            ? "No recent activity"
            : `${Math.min(feed.length, 50)} recent events`
        }
      />
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-3xl space-y-3">
          {feed.length === 0 ? (
            <WfPanel>
              <p
                className="py-8 text-center text-sm"
                style={{ color: "var(--wf-muted)" }}
              >
                Activity will appear here as your AI Team works.
              </p>
            </WfPanel>
          ) : (
            feed.slice(0, 50).map((item) => (
              <Link key={item.id} href={item.href} className="block">
                <WfPanel className="transition hover:bg-[#F8F9FC]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="truncate font-semibold"
                        style={{ color: "var(--wf-ink)" }}
                      >
                        {item.title}
                      </p>
                      <p
                        className="mt-0.5 truncate text-xs"
                        style={{ color: "var(--wf-muted)" }}
                      >
                        {item.detail}
                      </p>
                    </div>
                    <time
                      className="shrink-0 text-[10px] font-medium uppercase"
                      style={{ color: "var(--wf-muted)" }}
                      dateTime={item.at}
                    >
                      {new Date(item.at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </WfPanel>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "AI Team Activity" };
