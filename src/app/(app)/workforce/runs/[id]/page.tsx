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
      <header className="shrink-0 border-b border-[#243656] bg-[#0D1524] px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href={`/workforce/${run.agentType}`}
          className="text-xs text-[#B8965D] hover:underline"
        >
          ← {agent.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-[#FFFFFF] sm:text-xl">
            Agent run
          </h2>
          <Badge
            className={
              run.status === "completed"
                ? "bg-[#0A2A33] text-[#4DA6FF] ring-[#4DA6FF]/30"
                : run.status === "failed"
                  ? "bg-[#2A1218] text-[#F0A0A8] ring-[#8B3A45]/45"
                  : "bg-[#2A2210] text-[#C9AA72] ring-[#B8965D]/35"
            }
          >
            {run.status}
          </Badge>
        </div>
        <p className="text-xs text-[#9AABC4]">
          {agent.name} · {formatRelative(run.createdAt)}
          {run.inputSummary && ` · ${run.inputSummary}`}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        {run.status === "failed" && run.error && (
          <div className="rounded-xl border border-[#8B3A45]/45 bg-[#2A1218] p-4 text-sm text-red-300">
            {run.error}
          </div>
        )}

        {run.summary && (
          <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#9AABC4]">
              {run.summary}
            </p>
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">
              Recommendations
            </h3>
            <ul className="mt-3 space-y-2">
              {recommendations.map((rec) => (
                <li
                  key={rec}
                  className="flex gap-2 text-sm text-[#9AABC4]"
                >
                  <span className="text-[#B8965D]">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </section>
        )}

        {actions.length > 0 && (
          <section className="rounded-xl border border-[#243656] bg-[#0D1524] p-5">
            <h3 className="text-sm font-semibold text-[#FFFFFF]">Actions</h3>
            <ul className="mt-3 space-y-4">
              {actions.map((action) => (
                <li
                  key={action.id}
                  className="rounded-lg border border-[#243656] bg-[#121E32] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-[#FFFFFF]">{action.label}</p>
                      <p className="mt-0.5 text-xs text-[#9AABC4]">
                        {action.type.replace("_", " ")}
                      </p>
                      {action.type === "suggest_reply" && (
                        <p className="mt-2 rounded-lg bg-[#040608] p-3 text-sm text-[#FFFFFF] whitespace-pre-wrap">
                          {(action.payload.content as string) ?? ""}
                          {typeof action.payload.subject === "string" &&
                            action.payload.subject && (
                            <span className="mt-2 block text-xs text-[#9AABC4]">
                              Subject: {action.payload.subject}
                            </span>
                          )}
                        </p>
                      )}
                      {action.type === "alert" && (
                        <p className="mt-2 text-sm text-[#C9AA72]">
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
              className="text-[#B8965D] hover:underline"
            >
              View contact in CRM
            </Link>
          )}
          {run.conversationId && (
            <Link
              href={`/inbox/${run.conversationId}`}
              className="text-[#B8965D] hover:underline"
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
