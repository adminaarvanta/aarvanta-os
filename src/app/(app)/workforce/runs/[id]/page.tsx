import { notFound } from "next/navigation";
import Link from "next/link";
import { ApplyActionButton } from "@/components/workforce/apply-action-button";
import { WorkforceNav } from "@/components/workforce/workforce-nav";
import { WfHeader, WfPanel } from "@/components/workforce/workforce-shell";
import { getAgentDefinition } from "@/lib/workforce/agents";
import { serializeAgentAction } from "@/lib/workforce/serialize";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { getTenantScope } from "@/lib/tenant/context";
import { formatRelative } from "@/lib/utils";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scope = await getTenantScope();
  const run = await getWorkforceRepository().getRun(id, scope);
  if (!run) notFound();

  const agent = getAgentDefinition(run.agentType);
  const recommendations = run.recommendations ?? [];
  const actions = run.actions ?? [];

  const statusTone =
    run.status === "completed"
      ? { bg: "var(--wf-ok-soft)", color: "var(--wf-ok)" }
      : run.status === "failed"
        ? { bg: "var(--wf-danger-soft)", color: "var(--wf-danger)" }
        : { bg: "var(--wf-accent-soft)", color: "var(--wf-accent)" };

  return (
    <>
      <WfHeader
        title="Agent run"
        subtitle={`${agent.name} · ${formatRelative(run.createdAt)}`}
        actions={
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase"
            style={{ background: statusTone.bg, color: statusTone.color }}
          >
            {run.status}
          </span>
        }
      />
      <div className="px-5 sm:px-8" style={{ background: "var(--wf-bg)" }}>
        <div className="mx-auto max-w-5xl pb-2">
          <Link
            href={`/workforce/${run.agentType}`}
            className="text-xs font-semibold"
            style={{ color: "var(--wf-accent)" }}
          >
            ← {agent.name}
          </Link>
          {run.inputSummary && (
            <p className="mt-1 text-sm" style={{ color: "var(--wf-muted)" }}>
              {run.inputSummary}
            </p>
          )}
        </div>
      </div>
      <WorkforceNav />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-5xl space-y-4">
          {run.status === "failed" && run.error && (
            <div
              className="rounded-xl border p-4 text-sm"
              style={{
                borderColor: "var(--wf-danger)",
                background: "var(--wf-danger-soft)",
                color: "var(--wf-danger)",
              }}
            >
              {run.error}
            </div>
          )}

          {run.summary && (
            <WfPanel>
              <h3 className="text-sm font-bold" style={{ color: "var(--wf-ink)" }}>
                Summary
              </h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--wf-muted)" }}
              >
                {run.summary}
              </p>
            </WfPanel>
          )}

          {recommendations.length > 0 && (
            <WfPanel>
              <h3 className="text-sm font-bold" style={{ color: "var(--wf-ink)" }}>
                Recommendations
              </h3>
              <ul className="mt-3 space-y-2">
                {recommendations.map((rec) => (
                  <li
                    key={rec}
                    className="flex gap-2 text-sm"
                    style={{ color: "var(--wf-ink)" }}
                  >
                    <span style={{ color: "var(--wf-accent)" }}>→</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </WfPanel>
          )}

          {actions.length > 0 && (
            <WfPanel>
              <h3 className="text-sm font-bold" style={{ color: "var(--wf-ink)" }}>
                Actions
              </h3>
              <ul className="mt-3 space-y-3">
                {actions.map((action) => (
                  <li
                    key={action.id}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: "var(--wf-line)",
                      background: "var(--wf-bg)",
                    }}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p
                          className="font-semibold"
                          style={{ color: "var(--wf-ink)" }}
                        >
                          {action.label}
                        </p>
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: "var(--wf-muted)" }}
                        >
                          {action.type.replace("_", " ")}
                        </p>
                        {action.type === "suggest_reply" && (
                          <p
                            className="mt-2 rounded-xl bg-white p-3 text-sm whitespace-pre-wrap"
                            style={{
                              color: "var(--wf-ink)",
                              border: "1px solid var(--wf-line)",
                            }}
                          >
                            {(action.payload.content as string) ?? ""}
                          </p>
                        )}
                        {action.type === "alert" && (
                          <p
                            className="mt-2 text-sm font-medium"
                            style={{ color: "var(--wf-accent)" }}
                          >
                            {String(action.payload.message ?? "")}
                          </p>
                        )}
                      </div>
                      <ApplyActionButton
                        runId={run.id}
                        action={serializeAgentAction(action)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </WfPanel>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            {run.contactId && (
              <Link
                href={`/crm/contacts/${run.contactId}`}
                className="font-semibold"
                style={{ color: "var(--wf-accent)" }}
              >
                View contact in CRM
              </Link>
            )}
            {run.conversationId && (
              <Link
                href={`/inbox/${run.conversationId}`}
                className="font-semibold"
                style={{ color: "var(--wf-accent)" }}
              >
                View conversation in Inbox
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Agent run" };
