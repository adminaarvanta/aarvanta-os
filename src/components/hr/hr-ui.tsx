"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function HrShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("hr-os flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      {children}
    </div>
  );
}

export function HrStatStrip({
  items,
}: {
  items: Array<{
    label: string;
    value: string | number;
    hint?: string;
    tone?: "default" | "cyan" | "gold" | "teal" | "rose" | "amber" | "leave";
  }>;
}) {
  const toneClass: Record<string, string> = {
    default: "border-border bg-surface-elevated",
    cyan: "border-[color:var(--hr-screening)]/30 bg-[color:var(--hr-screening-soft)]",
    gold: "border-[color:var(--hr-offer)]/30 bg-[color:var(--hr-offer-soft)]",
    teal: "border-[color:var(--hr-hired)]/30 bg-[color:var(--hr-hired-soft)]",
    rose: "border-[color:var(--hr-exit)]/30 bg-[color:var(--hr-exit-soft)]",
    amber: "border-[color:var(--hr-late)]/30 bg-[color:var(--hr-late-soft)]",
    leave: "border-[color:var(--hr-leave)]/30 bg-[color:var(--hr-leave-soft)]",
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "rounded-xl border px-3.5 py-3 transition-colors",
            toneClass[item.tone ?? "default"]
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {item.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {item.value}
          </p>
          {item.hint ? (
            <p className="mt-0.5 text-xs text-dim">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function HrStatusChip({
  label,
  tone = "default",
}: {
  label: string;
  tone?:
    | "default"
    | "applied"
    | "screening"
    | "interview"
    | "offer"
    | "hired"
    | "rejected"
    | "awaiting"
    | "completed"
    | "pending"
    | "approved"
    | "late"
    | "exit"
    | "active"
    | "open";
}) {
  const map: Record<string, string> = {
    default: "bg-surface-muted text-muted",
    applied: "bg-surface-muted text-foreground",
    screening: "bg-[color:var(--hr-screening-soft)] text-[color:var(--hr-screening)]",
    interview: "bg-[color:var(--hr-interview-soft)] text-[color:var(--hr-interview)]",
    offer: "bg-[color:var(--hr-offer-soft)] text-[color:var(--hr-offer)]",
    hired: "bg-[color:var(--hr-hired-soft)] text-[color:var(--hr-hired)]",
    rejected: "bg-[color:var(--hr-rejected-soft)] text-[color:var(--hr-rejected)]",
    awaiting: "bg-[color:var(--hr-offer-soft)] text-[color:var(--hr-offer)]",
    completed: "bg-[color:var(--hr-hired-soft)] text-[color:var(--hr-hired)]",
    pending: "bg-[color:var(--hr-late-soft)] text-[color:var(--hr-late)]",
    approved: "bg-[color:var(--hr-hired-soft)] text-[color:var(--hr-hired)]",
    late: "bg-[color:var(--hr-late-soft)] text-[color:var(--hr-late)]",
    exit: "bg-[color:var(--hr-exit-soft)] text-[color:var(--hr-exit)]",
    active: "bg-[color:var(--hr-punch-soft)] text-[color:var(--hr-punch)]",
    open: "bg-[color:var(--hr-screening-soft)] text-[color:var(--hr-screening)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize transition-colors",
        map[tone] ?? map.default
      )}
    >
      {label.replace(/_/g, " ")}
    </span>
  );
}

export function HrDataTable({
  columns,
  rows,
  empty,
}: {
  columns: Array<{ key: string; label: string; className?: string }>;
  rows: Array<{ id: string; cells: Record<string, ReactNode> }>;
  empty?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-10 text-center text-sm text-muted">
        {empty ?? "Nothing here yet."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface-elevated">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border-subtle bg-surface-muted/50 text-[11px] uppercase tracking-wide text-muted">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn("px-3 py-2.5 font-semibold", col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className={cn(
                "border-b border-border-subtle last:border-0 transition-colors hover:bg-surface-hover/60",
                idx % 2 === 1 && "bg-surface-muted/20"
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn("px-3 py-2.5 text-foreground", col.className)}>
                  {row.cells[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HrPanel({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface-elevated/90 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-4 py-3.5 sm:px-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
