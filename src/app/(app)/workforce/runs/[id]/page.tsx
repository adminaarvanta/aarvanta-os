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
      <header className="shrink-0 border-b border-border bg-surface-elevated px-4 py-3 sm:px-6 sm:py-4">
        <Link
          href={`/workforce/${run.agentType}`}
          className="text-xs text-gold hover:underline"
        >
          ← {agent.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground sm:text-xl">
            Agent run
          </h2>
          <Badge
            className={
              run.status === "completed"
                ? "bg-accent-cyan/15 text-accent-cyan ring-accent-cyan/30"
                : run.status === "failed"
                  ? "bg-danger/15 text-danger ring-danger/45"
                  : "bg-gold/10 text-gold-bright ring-gold/35"
            }
          >
            {run.status}
          </Badge>
        </div>
        <p className="text-xs text-muted">
          {agent.name} · {formatRelative(run.createdAt)}
          {run.inputSummary && ` · ${run.inputSummary}`}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 sm:p-6">
        {run.status === "failed" && run.error && (
          <div className="rounded-xl border border-danger/45 bg-danger/15 p-4 text-sm text-red-300">
            {run.error}
          </div>
        )}

        {run.summary && (
          <section className="rounded-xl border border-border bg-surface-elevated p-5">
            <h3 className="text-sm font-semibold text-foreground">Summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {run.summary}
            </p>
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="rounded-xl border border-border bg-surface-elevated p-5">
            <h3 className="text-sm font-semibold text-foreground">
              Recommendations
            </h3>
            <ul className="mt-3 space-y-2">
              {recommendations.map((rec) => (
                <li
                  key={rec}
                  className="flex gap-2 text-sm text-muted"
                >
                  <span className="text-gold">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </section>
        )}

        {actions.length > 0 && (
          <section className="rounded-xl border border-border bg-surface-elevated p-5">
            <h3 className="text-sm font-semibold text-foreground">Actions</h3>
            <ul className="mt-3 space-y-4">
              {actions.map((action) => (
                <li
                  key={action.id}
                  className="rounded-lg border border-border bg-surface-muted p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{action.label}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {action.type.replace("_", " ")}
                      </p>
                      {action.type === "suggest_reply" && (
                        <p className="mt-2 rounded-lg bg-background p-3 text-sm text-foreground whitespace-pre-wrap">
                          {(action.payload.content as string) ?? ""}
                          {typeof action.payload.subject === "string" &&
                            action.payload.subject && (
                            <span className="mt-2 block text-xs text-muted">
                              Subject: {action.payload.subject}
                            </span>
                          )}
                        </p>
                      )}
                      {action.type === "alert" && (
                        <p className="mt-2 text-sm text-gold-bright">
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
              className="text-gold hover:underline"
            >
              View contact in CRM
            </Link>
          )}
          {run.conversationId && (
            <Link
              href={`/inbox/${run.conversationId}`}
              className="text-gold hover:underline"
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
