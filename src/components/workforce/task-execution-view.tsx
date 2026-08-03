"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Phone,
} from "lucide-react";
import { ApprovalActions } from "@/components/workforce/approval-actions";
import { WfPanel, WfPrimaryButton } from "@/components/workforce/workforce-shell";
import { agentLabel } from "@/lib/workforce/pipeline/labels";
import type {
  TimelineEvent,
  WorkforceApproval,
  WorkforceExecution,
  WorkforceReport,
} from "@/types/workforce";
import { cn } from "@/lib/utils";

const TABS = ["Timeline", "Overview", "Report"] as const;
type Tab = (typeof TABS)[number];

function progressPercent(execution: WorkforceExecution) {
  const total = execution.plan.steps.length || 1;
  const done = execution.plan.steps.filter(
    (s) => s.status === "completed" || s.status === "skipped"
  ).length;
  if (execution.status === "completed") return 100;
  return Math.round((done / total) * 100);
}

export function TaskExecutionView({
  execution,
  goalLabel,
  report,
  approvals,
  pendingApproval,
}: {
  execution: WorkforceExecution;
  goalLabel: string;
  report: WorkforceReport | null;
  approvals: WorkforceApproval[];
  pendingApproval: WorkforceApproval | null;
}) {
  const [phase, setPhase] = useState<"done" | "detail">(
    execution.status === "completed" && report ? "done" : "detail"
  );
  const [tab, setTab] = useState<Tab>(
    execution.status === "completed" ? "Report" : "Timeline"
  );
  const pct = progressPercent(execution);

  // One surface at a time: approval OR completion OR detail
  if (pendingApproval) {
    return (
      <WfPanel>
        <ApprovalActions
          executionId={execution.id}
          approval={pendingApproval}
        />
      </WfPanel>
    );
  }

  if (phase === "done" && report) {
    return (
      <div
        className="rounded-xl border bg-white p-8 text-center shadow-[0_1px_3px_rgba(14,21,37,0.04)]"
        style={{ borderColor: "var(--wf-line)" }}
      >
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "var(--wf-ok-soft)" }}
        >
          <CheckCircle2 className="h-8 w-8" style={{ color: "var(--wf-ok)" }} />
        </div>
        <h3 className="mt-4 text-xl font-bold" style={{ color: "var(--wf-ink)" }}>
          Job Completed!
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--wf-muted)" }}>
          {report.outcome}
        </p>
        <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2">
          {[
            { icon: Phone, label: "Calls", value: report.callsMade },
            { icon: MessageSquare, label: "Messages", value: report.messagesSent },
            { icon: ClipboardList, label: "Docs", value: report.documentsGenerated },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border p-3"
              style={{ borderColor: "var(--wf-line)", background: "var(--wf-bg)" }}
            >
              <item.icon
                className="mx-auto h-4 w-4"
                style={{ color: "var(--wf-accent)" }}
              />
              <p className="mt-1 text-lg font-bold">{item.value}</p>
              <p
                className="text-[10px] font-semibold uppercase"
                style={{ color: "var(--wf-muted)" }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
        {report.suggestions[0] && (
          <p className="mt-5 text-sm" style={{ color: "var(--wf-ink)" }}>
            <span style={{ color: "var(--wf-muted)" }}>Next: </span>
            {report.suggestions[0]}
          </p>
        )}
        <WfPrimaryButton
          type="button"
          className="mt-6"
          onClick={() => {
            setPhase("detail");
            setTab("Report");
          }}
        >
          View Full Report
        </WfPrimaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WfPanel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-bold" style={{ color: "var(--wf-ink)" }}>
              {goalLabel}
            </p>
            <p className="text-xs" style={{ color: "var(--wf-muted)" }}>
              {execution.assignedAgents.map(agentLabel).join(", ")}
            </p>
          </div>
          <span
            className="text-sm font-bold"
            style={{ color: "var(--wf-accent)" }}
          >
            {pct}%
          </span>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full"
          style={{ background: "var(--wf-line)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: "var(--wf-accent)" }}
          />
        </div>
      </WfPanel>

      <div
        className="flex gap-1 rounded-full border bg-white p-1"
        style={{ borderColor: "var(--wf-line)" }}
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-full px-3 py-2 text-sm font-semibold transition"
            )}
            style={{
              background: tab === t ? "var(--wf-accent)" : "transparent",
              color: tab === t ? "#fff" : "var(--wf-muted)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Timeline" && <TimelineTab events={execution.timeline} />}
      {tab === "Overview" && <OverviewTab execution={execution} />}
      {tab === "Report" && <ReportTab report={report} />}

      {/* keep approvals in report context only */}
      {approvals.length > 0 && tab === "Report" ? null : null}
    </div>
  );
}

function TimelineTab({ events }: { events: TimelineEvent[] }) {
  return (
    <WfPanel>
      <h4 className="mb-4 text-sm font-bold" style={{ color: "var(--wf-ink)" }}>
        Execution Timeline
      </h4>
      <ol
        className="relative space-y-4 border-l-2 pl-5"
        style={{ borderColor: "var(--wf-accent-soft)" }}
      >
        {events.map((event) => (
          <li key={event.id} className="relative">
            <span
              className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--wf-accent)" }}
            />
            <p className="text-xs font-medium" style={{ color: "var(--wf-muted)" }}>
              {new Date(event.at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · {event.actorLabel}
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--wf-ink)" }}>
              {event.label}
            </p>
          </li>
        ))}
        {events.length === 0 && (
          <li className="text-sm" style={{ color: "var(--wf-muted)" }}>
            Waiting for activity…
          </li>
        )}
      </ol>
    </WfPanel>
  );
}

function OverviewTab({ execution }: { execution: WorkforceExecution }) {
  return (
    <WfPanel>
      <ul className="space-y-2">
        {execution.plan.steps.map((step) => (
          <li
            key={step.id}
            className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm"
            style={{ borderColor: "var(--wf-line)" }}
          >
            <span style={{ color: "var(--wf-ink)" }}>{step.title}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
              style={{
                background:
                  step.status === "completed"
                    ? "var(--wf-ok-soft)"
                    : step.status === "awaiting_approval"
                      ? "var(--wf-wait-soft)"
                      : "var(--wf-bg)",
                color:
                  step.status === "completed"
                    ? "var(--wf-ok)"
                    : step.status === "awaiting_approval"
                      ? "#B45309"
                      : "var(--wf-muted)",
              }}
            >
              {step.status.replace(/_/g, " ")}
            </span>
          </li>
        ))}
      </ul>
    </WfPanel>
  );
}

function ReportTab({ report }: { report: WorkforceReport | null }) {
  if (!report) {
    return (
      <WfPanel>
        <p className="text-sm" style={{ color: "var(--wf-muted)" }}>
          Report appears when the job completes.
        </p>
      </WfPanel>
    );
  }

  return (
    <WfPanel className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--wf-muted)" }}>
            Objective
          </p>
          <p className="font-semibold">{report.objectiveLabel}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--wf-muted)" }}>
            Outcome
          </p>
          <p className="font-semibold">{report.outcome}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--wf-muted)" }}>
            Time
          </p>
          <p className="font-semibold">{report.totalMinutes} minutes</p>
        </div>
      </div>
      {report.suggestions.length > 0 && (
        <div>
          <p
            className="mb-2 text-xs font-semibold uppercase"
            style={{ color: "var(--wf-muted)" }}
          >
            AI Suggestions
          </p>
          <ul className="space-y-2">
            {report.suggestions.map((s) => (
              <li
                key={s}
                className="rounded-xl px-3 py-2 text-sm"
                style={{
                  background: "var(--wf-accent-soft)",
                  color: "var(--wf-ink)",
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </WfPanel>
  );
}
