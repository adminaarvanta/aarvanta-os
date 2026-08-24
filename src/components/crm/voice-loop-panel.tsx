"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone } from "lucide-react";
import { formatWhen } from "@/lib/calling/schedule-slots";
import type { ScheduledCall } from "@/lib/calling/scheduled-call-store";
import type { CallSession } from "@/types/calling-agent";
import type { CrmActivity, CrmTask } from "@/types/crm";

type LoopPayload = {
  lastSession: CallSession | null;
  nextCall: ScheduledCall | null;
  openTasks: CrmTask[];
  emails: CrmActivity[];
  timeZone: string;
  missingEmail: boolean;
};

export function VoiceLoopPanel({ contactId }: { contactId: string }) {
  const [data, setData] = useState<LoopPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/voice/loop?contactId=${encodeURIComponent(contactId)}`);
        if (!res.ok) return;
        const payload = (await res.json()) as LoopPayload;
        if (!cancelled) setData(payload);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contactId]);

  const lastSession = data?.lastSession ?? null;
  const nextCall = data?.nextCall ?? null;
  const openTasks = data?.openTasks ?? [];
  const emails = data?.emails ?? [];
  const timeZone = data?.timeZone ?? "America/New_York";
  const missingEmail = Boolean(data?.missingEmail);
  const conclusion = lastSession?.conclusion;
  const nextAction = conclusion?.nextAction;

  return (
    <section className="rounded-2xl border border-border/80 bg-surface-elevated p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/12 text-gold ring-1 ring-gold/20">
          <Phone className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Voice follow-up</h2>
          <p className="mt-0.5 text-xs text-muted">
            Last call conclusion, the next AI call, and emails this person already received.
          </p>
        </div>
      </div>

      {missingEmail ? (
        <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          No email on this person — schedule and summary emails cannot be sent until an
          address is added.
        </p>
      ) : null}

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border/80 bg-background px-3 py-2.5">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Last conclusion
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {conclusion?.notes || lastSession?.summary || "No AI call yet."}
          </dd>
          {lastSession?.outcome ? (
            <p className="mt-1 text-[11px] capitalize text-muted">
              {lastSession.outcome.replace(/_/g, " ")}
              {nextAction && nextAction !== "none" ? ` · next: ${nextAction.replace(/_/g, " ")}` : ""}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-border/80 bg-background px-3 py-2.5">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Next scheduled call
          </dt>
          <dd className="mt-1 text-sm text-foreground">
            {nextCall
              ? formatWhen(nextCall.scheduledAt, timeZone)
              : data
                ? "None scheduled."
                : "Loading…"}
          </dd>
          {nextCall ? (
            <p className="mt-1 text-[11px] capitalize text-muted">
              {nextCall.status.replace(/_/g, " ")}
            </p>
          ) : null}
        </div>
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Open AI voice tasks
          </h3>
          {openTasks.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              {data ? "No open voice tasks." : "Loading…"}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {openTasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border border-border/80 px-3 py-2.5 text-sm"
                >
                  <p className="font-medium text-foreground">{task.title}</p>
                  <p className="text-xs capitalize text-muted">
                    {task.status.replace(/_/g, " ")}
                    {task.dueDate ? ` · ${formatWhen(task.dueDate, timeZone)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Customer emails
          </h3>
          {emails.length === 0 ? (
            <p className="mt-2 text-sm text-muted">
              {data ? "No call emails logged yet." : "Loading…"}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {emails.slice(0, 4).map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border/80 px-3 py-2.5 text-sm"
                >
                  <p className="font-medium text-foreground">{item.title}</p>
                  {item.description ? (
                    <p className="mt-0.5 line-clamp-3 text-xs text-muted">
                      {item.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted">
        Manage campaigns and the dialer in{" "}
        <Link href="/voice" className="font-medium text-gold hover:underline">
          Voice OS
        </Link>
        .
      </p>
    </section>
  );
}
