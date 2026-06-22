import { notFound } from "next/navigation";
import Link from "next/link";
import { ApplyActionButton } from "@/components/workforce/apply-action-button";
import { getAgentDefinition } from "@/lib/workforce/agents";
import { serializeAgentAction } from "@/lib/workforce/serialize";
import { getWorkforceRepository } from "@/lib/data/workforce-store";
import { getTenantScope } from "@/lib/tenant/context";
import { formatRelative } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

  return (
    <>
      <header className="shrink-0 border-b border-[#3d3528] bg-[#101010] px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href={`/workforce/${run.agentType}`}
          className="text-xs text-[#D4AF37] hover:underline"
        >
          ← {agent.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-[#F5E6C8] sm:text-xl">
            Agent run
          </h2>
          <Badge
            className={
              run.status === "completed"
                ? "bg-emerald-950/60 text-emerald-300 ring-emerald-700/50"
                : run.status === "failed"
                  ? "bg-red-950/60 text-red-300 ring-red-700/50"
                  : "bg-amber-950/60 text-amber-300 ring-amber-700/50"
            }
          >
            {run.status}
          </Badge>
        </div>
        <p className="text-xs text-[#A89878]">
          {agent.name} · {formatRelative(run.createdAt)}
          {run.inputSummary && ` · ${run.inputSummary}`}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        {run.status === "failed" && run.error && (
          <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-4 text-sm text-red-300">
            {run.error}
          </div>
        )}

        {run.summary && (
          <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
            <h3 className="text-sm font-semibold text-[#F5E6C8]">Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#A89878]">
              {run.summary}
            </p>
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
            <h3 className="text-sm font-semibold text-[#F5E6C8]">
              Recommendations
            </h3>
            <ul className="mt-3 space-y-2">
              {recommendations.map((rec) => (
                <li
                  key={rec}
                  className="flex gap-2 text-sm text-[#A89878]"
                >
                  <span className="text-[#D4AF37]">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </section>
        )}

        {actions.length > 0 && (
          <section className="rounded-xl border border-[#3d3528] bg-[#101010] p-5">
            <h3 className="text-sm font-semibold text-[#F5E6C8]">Actions</h3>
            <ul className="mt-3 space-y-4">
              {actions.map((action) => (
                <li
                  key={action.id}
                  className="rounded-lg border border-[#3d3528] bg-[#141414] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-[#F5E6C8]">{action.label}</p>
                      <p className="mt-0.5 text-xs text-[#A89878]">
                        {action.type.replace("_", " ")}
                      </p>
                      {action.type === "suggest_reply" && (
                        <p className="mt-2 rounded-lg bg-[#0a0a0a] p-3 text-sm text-[#F5E6C8] whitespace-pre-wrap">
                          {(action.payload.content as string) ?? ""}
                          {typeof action.payload.subject === "string" &&
                            action.payload.subject && (
                            <span className="mt-2 block text-xs text-[#A89878]">
                              Subject: {action.payload.subject}
                            </span>
                          )}
                        </p>
                      )}
                      {action.type === "alert" && (
                        <p className="mt-2 text-sm text-amber-300">
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
          </section>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          {run.contactId && (
            <Link
              href={`/crm/contacts/${run.contactId}`}
              className="text-[#D4AF37] hover:underline"
            >
              View contact in CRM
            </Link>
          )}
          {run.conversationId && (
            <Link
              href={`/inbox/${run.conversationId}`}
              className="text-[#D4AF37] hover:underline"
            >
              View conversation in Inbox
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

export const metadata = { title: "Agent run" };
