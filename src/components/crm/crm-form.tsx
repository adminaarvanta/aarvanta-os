"use client";

import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const crmInputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-[#2f7f92] focus:ring-2 focus:ring-[#2f7f92]/20";

export function CrmField({
  label,
  htmlFor,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-foreground"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-[#2f7f92]" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="text-[11px] leading-4 text-muted">{hint}</p> : null}
    </div>
  );
}

export function CrmFormDialog({
  open,
  title,
  description,
  icon: Icon,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  icon: LucideIcon;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#0e1522]/45 backdrop-blur-[3px]"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crm-form-dialog-title"
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated shadow-[0_24px_64px_rgba(15,23,42,0.24)]"
      >
        <div
          aria-hidden
          className="h-1.5 bg-gradient-to-r from-[#1a2f59] via-[#2f7f92] to-sky-400"
        />
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle bg-gradient-to-r from-sky-500/[0.08] via-surface-elevated to-surface-elevated px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a2f59] to-[#2f7f92] text-white shadow-[0_8px_20px_rgba(26,47,89,0.28)]">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id="crm-form-dialog-title"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                {title}
              </h2>
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

export function CrmFormBody({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
      {children}
    </div>
  );
}

export function CrmFormActions({
  busy,
  submitDisabled,
  onCancel,
  submitLabel,
  busyLabel = "Saving…",
}: {
  busy?: boolean;
  submitDisabled?: boolean;
  onCancel: () => void;
  submitLabel: string;
  busyLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle bg-surface-elevated px-5 py-4">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onCancel}
        disabled={busy}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        size="sm"
        variant="navy"
        disabled={busy || submitDisabled}
      >
        {busy ? busyLabel : submitLabel}
      </Button>
    </div>
  );
}

export const crmChipClass = {
  active:
    "rounded-full px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-[#1a2f59] to-[#2f7f92] text-white shadow-[0_4px_12px_rgba(26,47,89,0.22)]",
  idle: "rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted hover:border-[#2f7f92]/40 hover:text-foreground",
} as const;
