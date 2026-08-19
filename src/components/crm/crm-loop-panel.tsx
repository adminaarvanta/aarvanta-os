import Link from "next/link";
import { ArrowUpRight, Bot, Sparkles } from "lucide-react";
import type { BrainLoopSnapshot } from "@/lib/ai-team/brain";

export function CrmLoopPanel({ snapshot }: { snapshot: BrainLoopSnapshot }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-surface-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/12 text-gold ring-1 ring-gold/20">
            <Bot className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              AI Team loop
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              CRM, AI Team, and Workforce share the same tasks. Human work stays
              manual; AI-assigned work runs on its own.
            </p>
          </div>
        </div>
        <Link
          href="/workforce"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline"
        >
          Open AI Team
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <LoopStat label="Open AI tasks" value={snapshot.openAgentTasks} />
        <LoopStat label="Done today" value={snapshot.doneAgentTasksToday} />
        <LoopStat label="Active jobs" value={snapshot.activeJobs} />
      </div>

      {snapshot.items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted">
          Add a person, score a lead, or assign a task to an AI specialist to
          start the loop.
        </p>
      ) : (
        <ul className="mt-4 space-y-1">
          {snapshot.items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-muted"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">
                    {item.title}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {item.detail}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LoopStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/80 bg-background px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
