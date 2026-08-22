"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function FinanceShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "finance-os flex min-h-0 flex-1 flex-col overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

export function FinanceStatStrip({
  items,
}: {
  items: Array<{
    label: string;
    value: string | number;
    hint?: string;
    tone?: "default" | "emerald" | "amber" | "sky" | "rose" | "indigo" | "teal";
  }>;
}) {
  const toneClass: Record<string, string> = {
    default: "border-border bg-surface-elevated",
    emerald:
      "border-[color:var(--finance-profit)]/30 bg-[color:var(--finance-profit-soft)]",
    amber:
      "border-[color:var(--finance-amber)]/30 bg-[color:var(--finance-amber-soft)]",
    sky: "border-[color:var(--finance-sky)]/30 bg-[color:var(--finance-sky-soft)]",
    rose: "border-[color:var(--finance-loss)]/30 bg-[color:var(--finance-loss-soft)]",
    indigo:
      "border-[color:var(--finance-indigo)]/30 bg-[color:var(--finance-indigo-soft)]",
    teal: "border-[color:var(--finance-teal)]/30 bg-[color:var(--finance-teal-soft)]",
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

export function FinanceStatusChip({
  label,
  tone = "default",
}: {
  label: string;
  tone?:
    | "default"
    | "draft"
    | "sent"
    | "paid"
    | "overdue"
    | "profit"
    | "loss"
    | "active"
    | "inactive"
    | "posted"
    | "asset"
    | "liability"
    | "equity"
    | "revenue"
    | "expense";
}) {
  const map: Record<string, string> = {
    default: "bg-surface-muted text-muted",
    draft: "bg-surface-muted text-foreground",
    sent: "bg-[color:var(--finance-sky-soft)] text-[color:var(--finance-sky)]",
    paid: "bg-[color:var(--finance-profit-soft)] text-[color:var(--finance-profit)]",
    overdue: "bg-[color:var(--finance-loss-soft)] text-[color:var(--finance-loss)]",
    profit: "bg-[color:var(--finance-profit-soft)] text-[color:var(--finance-profit)]",
    loss: "bg-[color:var(--finance-loss-soft)] text-[color:var(--finance-loss)]",
    active: "bg-[color:var(--finance-teal-soft)] text-[color:var(--finance-teal)]",
    inactive: "bg-surface-muted text-muted",
    posted: "bg-[color:var(--finance-indigo-soft)] text-[color:var(--finance-indigo)]",
    asset: "bg-[color:var(--finance-sky-soft)] text-[color:var(--finance-sky)]",
    liability: "bg-[color:var(--finance-amber-soft)] text-[color:var(--finance-amber)]",
    equity: "bg-[color:var(--finance-indigo-soft)] text-[color:var(--finance-indigo)]",
    revenue: "bg-[color:var(--finance-profit-soft)] text-[color:var(--finance-profit)]",
    expense: "bg-[color:var(--finance-loss-soft)] text-[color:var(--finance-loss)]",
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

export function FinancePanel({
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
    <section className="rounded-2xl border border-[color:var(--finance-panel-border)] bg-[color:var(--finance-panel-bg)] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          ) : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function FinanceField({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--finance-accent)]",
        className
      )}
      {...props}
    />
  );
}

export function FinanceSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-[color:var(--finance-accent)]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FinanceDataTable({
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
        <thead className="border-b border-border-subtle bg-[color:var(--finance-table-head)] text-[11px] uppercase tracking-wide text-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-3 py-2.5 font-semibold", col.className)}
              >
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
                <td
                  key={col.key}
                  className={cn("px-3 py-2.5 text-foreground", col.className)}
                >
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
